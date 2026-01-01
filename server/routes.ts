import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from 'passport';
import { z } from 'zod';
import multer from 'multer';
import { storage } from "./storage";
import { setupAuth, isAuthenticated, generateMagicLinkToken, verifyMagicLinkToken, hashPassword, isAdminEmail } from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { generateCardContent, generateCardImage, generateSongLyrics, generateSongCover } from "./openaiService";
import { generateGreetingCard, generateAnimation, generateCassetteCaseImage } from "./nanoBananaService";
// Note: soraService is disabled as video generation APIs are not yet publicly available
import { sendMagicLinkEmail, sendPasswordResetEmail, sendContactFormEmail } from "./emailService";
import { startScheduler } from "./schedulerService";
import { sendPasswordResetSMS, isTwilioConfigured } from "./smsService";
import { compositePhotoIntoCassette, createCassetteCover } from "./imageCompositeService";
import { insertLovedOneSchema, insertCreationSchema, type Creation } from "@shared/schema";

// Configure multer for memory storage (files stored as buffers)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Use custom domain in production, dev domain in development
function getBaseUrl(): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  if (process.env.NODE_ENV === 'production' && process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(',');
    return `https://${domains[0]}`;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  return 'http://localhost:5000';
}

const BASE_URL = getBaseUrl();

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  const objectStorageService = new ObjectStorageService();
  
  // Verify critical API keys are configured
  if (!process.env.SUNO_API_KEY) {
    console.warn('[Warning] SUNO_API_KEY is not configured - song generation will fail');
  } else {
    console.log('[Config] SUNO_API_KEY is configured');
  }

  // ========== AUTHENTICATION ROUTES ==========
  
  // Register with email/password
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      });
      
      const { email, password, phoneNumber, firstName, lastName } = schema.parse(req.body);
      
      // Normalize phone number by removing all non-digit characters except +
      const normalizedPhone = phoneNumber.replace(/[^\d+]/g, '');
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      // Check if phone number is already registered
      const existingPhone = await storage.getUserByPhoneNumber(normalizedPhone);
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number already registered to another account' });
      }
      
      const hashedPassword = await hashPassword(password);
      const isAdmin = isAdminEmail(email);
      const user = await storage.createUser({
        email,
        phoneNumber: normalizedPhone,
        password: hashedPassword,
        firstName,
        lastName,
        isAdmin,
        songsRemaining: isAdmin ? 9999 : 3,
      });
      
      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ message: 'Session regeneration failed' });
        }
        
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Login failed after registration' });
          }
          res.json(user);
        });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  });

  // Login with email/password
  app.post('/api/auth/login', (req: Request, res: Response, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      
      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ message: 'Session regeneration failed' });
        }
        
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Login failed' });
          }
          res.json(user);
        });
      });
    })(req, res, next);
  });

  // Request magic link
  app.post('/api/auth/magic-link', async (req: Request, res: Response) => {
    try {
      const schema = z.object({ email: z.string().email() });
      const { email } = schema.parse(req.body);
      
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        const isAdmin = isAdminEmail(email);
        user = await storage.createUser({ 
          email,
          isAdmin,
          songsRemaining: isAdmin ? 9999 : 3,
        });
      }
      
      const token = generateMagicLinkToken(email);
      
      // Store token in database for one-time use validation
      await storage.createMagicLinkToken({
        email,
        token,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });
      
      const magicLink = `${BASE_URL}/auth/verify?token=${token}`;
      
      await sendMagicLinkEmail(email, magicLink);
      
      res.json({ message: 'Magic link sent to your email' });
    } catch (error: any) {
      console.error("Magic link error:", error);
      res.status(400).json({ message: error.message || 'Failed to send magic link' });
    }
  });

  // Verify magic link
  app.get('/api/auth/verify', async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      
      if (!token) {
        return res.status(400).json({ message: 'Token required' });
      }
      
      // Check if token exists in database and hasn't been used
      const storedToken = await storage.getMagicLinkToken(token);
      
      if (!storedToken || storedToken.used) {
        return res.status(401).json({ message: 'Invalid, expired, or already used token' });
      }
      
      // Verify JWT signature and check expiration
      const payload = verifyMagicLinkToken(token);
      
      if (!payload || payload.email !== storedToken.email) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Mark token as used to prevent replay attacks
      await storage.markMagicLinkTokenAsUsed(token);
      
      const user = await storage.getUserByEmail(storedToken.email);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ message: 'Session regeneration failed' });
        }
        
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Login failed' });
          }
          res.json(user);
        });
      });
    } catch (error) {
      console.error("Magic link verification error:", error);
      res.status(500).json({ message: 'Verification failed' });
    }
  });

  // Request password reset
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const schema = z.object({ email: z.string().email() });
      const { email } = schema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
      }
      
      const token = generateMagicLinkToken(email);
      
      // Store token in database for one-time use validation
      await storage.createMagicLinkToken({
        email,
        token,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });
      
      const resetLink = `${BASE_URL}/auth/reset-password?token=${token}`;
      
      // Send password reset via email
      await sendPasswordResetEmail(email, resetLink);
      
      // Also send via SMS if user has a phone number and Twilio is configured
      let smsSent = false;
      if (user.phoneNumber && isTwilioConfigured()) {
        smsSent = await sendPasswordResetSMS(user.phoneNumber, resetLink);
      }
      
      const message = smsSent 
        ? 'Password reset link sent to your email and phone.'
        : 'If an account exists with this email, you will receive a password reset link.';
      
      res.json({ message });
    } catch (error: any) {
      console.error("Password reset error:", error);
      res.status(400).json({ message: error.message || 'Failed to send password reset email' });
    }
  });

  // Request password reset via SMS only (for when email delivery is unreliable)
  app.post('/api/auth/reset-password-sms', async (req: Request, res: Response) => {
    try {
      const schema = z.object({ phoneNumber: z.string().min(10) });
      const { phoneNumber } = schema.parse(req.body);
      
      // Find user by phone number
      const user = await storage.getUserByPhoneNumber(phoneNumber);
      
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: 'If an account exists with this phone number, you will receive a password reset link via SMS.' });
      }
      
      if (!isTwilioConfigured()) {
        return res.status(503).json({ message: 'SMS service is not available. Please use email reset instead.' });
      }
      
      const token = generateMagicLinkToken(user.email);
      
      // Store token in database for one-time use validation
      await storage.createMagicLinkToken({
        email: user.email,
        token,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });
      
      const resetLink = `${BASE_URL}/auth/reset-password?token=${token}`;
      
      // Send password reset via SMS only
      const smsSent = await sendPasswordResetSMS(phoneNumber, resetLink);
      
      if (smsSent) {
        res.json({ message: 'Password reset link sent to your phone via SMS.' });
      } else {
        res.status(500).json({ message: 'Failed to send SMS. Please try again or use email reset.' });
      }
    } catch (error: any) {
      console.error("SMS password reset error:", error);
      res.status(400).json({ message: error.message || 'Failed to send password reset SMS' });
    }
  });

  // Set new password with token
  app.post('/api/auth/set-password', async (req: Request, res: Response) => {
    try {
      const schema = z.object({ 
        token: z.string(),
        password: z.string().min(6, 'Password must be at least 6 characters'),
      });
      const { token, password } = schema.parse(req.body);
      
      // Check if token exists in database and hasn't been used
      const storedToken = await storage.getMagicLinkToken(token);
      
      if (!storedToken || storedToken.used) {
        return res.status(401).json({ message: 'Invalid, expired, or already used token' });
      }
      
      // Verify JWT signature and check expiration
      const payload = verifyMagicLinkToken(token);
      
      if (!payload || payload.email !== storedToken.email) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Mark token as used
      await storage.markMagicLinkTokenAsUsed(token);
      
      const user = await storage.getUserByEmail(storedToken.email);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Hash and update password
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(user.id, { password: hashedPassword });
      
      // Log the user in
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ message: 'Session regeneration failed' });
        }
        
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Login failed' });
          }
          res.json({ message: 'Password updated successfully', user });
        });
      });
    } catch (error: any) {
      console.error("Set password error:", error);
      res.status(400).json({ message: error.message || 'Failed to set password' });
    }
  });

  // Google OAuth routes (only if configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get('/api/auth/google', passport.authenticate('google', { 
      scope: ['profile', 'email'] 
    }));

    app.get('/api/auth/google/callback',
      (req: Request, res: Response, next) => {
        // Use custom callback to control session regeneration timing
        passport.authenticate('google', (err: any, user: any, info: any) => {
          if (err) {
            console.error('Google OAuth error:', err);
            return res.redirect('/?error=auth_failed');
          }
          
          if (!user) {
            console.error('Google OAuth: No user returned');
            return res.redirect('/?error=auth_failed');
          }
          
          // Regenerate session BEFORE logging in to prevent session fixation
          // This creates a new session ID while preserving the session store
          req.session.regenerate((regenerateErr) => {
            if (regenerateErr) {
              console.error('Session regeneration failed during Google OAuth:', regenerateErr);
              return res.redirect('/?error=auth_failed');
            }
            
            // Now establish login with the regenerated session
            req.login(user, (loginErr) => {
              if (loginErr) {
                console.error('Login failed after Google OAuth:', loginErr);
                return res.redirect('/?error=auth_failed');
              }
              res.redirect('/dashboard');
            });
          });
        })(req, res, next);
      }
    );
  }

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: Request, res: Response) => {
    res.json(req.user);
  });

  // Update user profile (including brand name)
  app.patch('/api/auth/user', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { firstName, lastName, brandName } = req.body;
      
      const updates: any = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (brandName !== undefined) updates.brandName = brandName;
      
      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: error.message || "Failed to update profile" });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // ========== CONTACT FORM ROUTE ==========
  
  const contactFormSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    subject: z.string().min(1),
    message: z.string().min(10),
  });

  app.post('/api/contact', async (req: Request, res: Response) => {
    try {
      const data = contactFormSchema.parse(req.body);
      await sendContactFormEmail(data);
      res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
      console.error('Contact form error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to send message. Please try again.' });
    }
  });

  // ========== LOVED ONES ROUTES ==========
  
  app.get('/api/loved-ones', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const lovedOnes = await storage.getLovedOnesByUserId(userId);
      res.json(lovedOnes);
    } catch (error) {
      console.error("Error fetching loved ones:", error);
      res.status(500).json({ message: "Failed to fetch loved ones" });
    }
  });

  app.post('/api/loved-ones', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const validatedData = insertLovedOneSchema.parse({ ...req.body, userId });
      const lovedOne = await storage.createLovedOne(validatedData);
      res.json(lovedOne);
    } catch (error: any) {
      console.error("Error creating loved one:", error);
      res.status(400).json({ message: error.message || "Failed to create loved one" });
    }
  });

  app.put('/api/loved-ones/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const existing = await storage.getLovedOneById(req.params.id);
      
      if (!existing) {
        return res.status(404).json({ message: "Loved one not found" });
      }
      
      if (existing.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updateSchema = insertLovedOneSchema.partial().omit({ userId: true });
      const validatedData = updateSchema.parse(req.body);
      const updated = await storage.updateLovedOne(req.params.id, validatedData);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating loved one:", error);
      res.status(400).json({ message: error.message || "Failed to update loved one" });
    }
  });

  app.delete('/api/loved-ones/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const existing = await storage.getLovedOneById(req.params.id);
      
      if (!existing) {
        return res.status(404).json({ message: "Loved one not found" });
      }
      
      if (existing.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteLovedOne(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting loved one:", error);
      res.status(500).json({ message: "Failed to delete loved one" });
    }
  });

  // ========== UPLOAD ROUTES ==========
  
  // Upload image for song cover customization
  app.post('/api/upload/cover-image', isAuthenticated, upload.single('image'), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      console.log(`[Upload] Received cover image upload from user ${userId}, size: ${file.size} bytes`);
      
      // Upload to object storage
      const base64 = file.buffer.toString('base64');
      const imagePath = await objectStorageService.uploadBase64Image(
        base64,
        `uploads/${userId}`,
        'cover-custom'
      );
      
      // Return full public URL so external APIs (like Nano Banana) can access the image
      const fullImageUrl = `${BASE_URL}${imagePath}`;
      
      console.log(`[Upload] Cover image uploaded: ${fullImageUrl}`);
      
      res.json({ imageUrl: fullImageUrl });
    } catch (error: any) {
      console.error('Error uploading cover image:', error);
      res.status(500).json({ message: error.message || 'Failed to upload image' });
    }
  });

  // ========== CREATION ROUTES ==========
  
  app.get('/api/creations', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const creations = await storage.getCreationsByUserId(userId);
      res.json(creations);
    } catch (error) {
      console.error("Error fetching creations:", error);
      res.status(500).json({ message: "Failed to fetch creations" });
    }
  });

  // Get single creation by ID (for polling status)
  app.get('/api/creations/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      
      const creation = await storage.getCreationById(id);
      if (!creation) {
        return res.status(404).json({ message: "Creation not found" });
      }
      if (creation.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to view this creation" });
      }
      
      res.json(creation);
    } catch (error) {
      console.error("Error fetching creation:", error);
      res.status(500).json({ message: "Failed to fetch creation" });
    }
  });

  // Create a new creation (song generation)
  app.post('/api/creations', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { 
        type, 
        recipientName, 
        occasion, 
        tone, 
        genre, 
        voiceType, 
        customMessage,
        lovedOneId 
      } = req.body;
      
      // Check if user has songs remaining
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Allow if user has credits OR has active subscription OR is admin
      const hasActiveSubscription = user.subscriptionStatus === 'active';
      const songsRemaining = user.songsRemaining ?? 0;
      const isAdmin = user.isAdmin === true;
      
      if (songsRemaining <= 0 && !hasActiveSubscription && !isAdmin) {
        return res.status(403).json({ 
          message: "No songs remaining. Please purchase a Credit Pack or subscribe for more songs.",
          songsRemaining: 0,
          requiresPayment: true 
        });
      }
      
      // Decrement credits IMMEDIATELY (before generation) for non-subscribers (admins exempt)
      if (!hasActiveSubscription && !isAdmin) {
        await storage.updateUser(userId, { songsRemaining: songsRemaining - 1 });
        console.log(`[Creations] User ${userId} credit deducted. Songs remaining: ${songsRemaining - 1}`);
      }

      // Create placeholder creation with generating status
      const creation = await storage.createCreation({
        userId,
        lovedOneId: lovedOneId || null,
        type: type || 'song',
        tone: tone || 'sweet',
        genre: genre || 'pop',
        title: `Generating song for ${recipientName}...`,
        content: customMessage || null,
        imageUrl: null,
        mediaUrl: null,
        status: 'generating',
      });

      // Return immediately
      res.json({
        ...creation,
        status: 'generating',
        message: 'Song generation started!',
      });

      // Process song generation in background
      (async () => {
        try {
          const { generateSong } = await import('./sunoService');
          
          const songResult = await generateSong({
            recipientName: recipientName || 'Someone Special',
            relationship: 'loved one',
            occasion: occasion || 'celebration',
            tone: tone || 'sweet',
            genre: genre || 'pop',
            voice: voiceType || undefined,
            duration: 'extended',
          });

          // Generate AI cassette cover
          let coverImageUrl = null;
          try {
            const cassetteCoverUrl = await generateSongCover({
              title: songResult.title,
              tone: tone || 'sweet',
              genre: genre || 'pop',
              recipientName: recipientName || 'Someone Special',
            });
            
            if (cassetteCoverUrl) {
              const coverResponse = await fetch(cassetteCoverUrl);
              const coverBuffer = await coverResponse.arrayBuffer();
              const coverBase64 = Buffer.from(coverBuffer).toString('base64');
              
              coverImageUrl = await objectStorageService.uploadBase64Image(
                coverBase64,
                `songs/${userId}`,
                'cover'
              );
              console.log('[Creations] AI cover generated:', coverImageUrl);
            }
          } catch (coverError: any) {
            console.error('[Creations] Cover generation failed:', coverError.message);
          }

          const shareableLink = `song-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          await storage.updateCreation(creation.id, {
            title: songResult.title,
            content: songResult.lyrics,
            imageUrl: coverImageUrl,
            mediaUrl: songResult.audioUrl,
            shareableLink,
            status: 'ready',
          });
          
          console.log(`[Creations] Song generation complete for ${creation.id}`);
        } catch (error: any) {
          console.error(`[Creations] Generation failed for ${creation.id}:`, error.message);
          await storage.updateCreation(creation.id, {
            status: 'failed',
            title: 'Song generation failed',
          });
          
          // Refund credit on failure
          const currentUser = await storage.getUser(userId);
          if (currentUser && currentUser.subscriptionStatus !== 'active' && !currentUser.isAdmin) {
            const refundedCredits = (currentUser.songsRemaining ?? 0) + 1;
            await storage.updateUser(userId, { songsRemaining: refundedCredits });
            console.log(`[Creations] Credit refunded for user ${userId}`);
          }
        }
      })();
    } catch (error: any) {
      console.error("Error creating song:", error);
      res.status(500).json({ message: error.message || "Failed to create song" });
    }
  });

  // Update creation (rename)
  app.patch('/api/creations/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const { title } = req.body;

      const creation = await storage.getCreationById(id);
      if (!creation) {
        return res.status(404).json({ message: "Creation not found" });
      }
      if (creation.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this creation" });
      }

      const updated = await storage.updateCreation(id, { title });
      res.json(updated);
    } catch (error) {
      console.error("Error updating creation:", error);
      res.status(500).json({ message: "Failed to update creation" });
    }
  });

  // Delete creation
  app.delete('/api/creations/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;

      const creation = await storage.getCreationById(id);
      if (!creation) {
        return res.status(404).json({ message: "Creation not found" });
      }
      if (creation.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this creation" });
      }

      await storage.deleteCreation(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting creation:", error);
      res.status(500).json({ message: "Failed to delete creation" });
    }
  });

  // Generate AI Card (using Nano Banana API)
  app.post('/api/generate/card', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { lovedOneId, tone, occasion, style } = req.body;
      
      let lovedOne;
      if (lovedOneId) {
        lovedOne = await storage.getLovedOneById(lovedOneId);
      }

      const recipientName = lovedOne?.name || req.body.recipientName || "someone special";

      const cardContent = await generateCardContent({
        recipientName,
        relationship: lovedOne?.relationship || req.body.relationship || "friend",
        occasion,
        tone: tone || "sweet",
        interests: lovedOne?.interests || undefined,
        insideJokes: lovedOne?.insideJokes || undefined,
      });

      let imageUrl: string;
      
      if (process.env.NANO_BANANA_API_KEY) {
        console.log('[Card] Using Nano Banana API for image generation');
        const nanoBananaImageUrl = await generateGreetingCard({
          recipientName,
          occasion: occasion || "celebration",
          message: cardContent.message,
          style: style || `${tone || 'sweet'}, warm, celebratory`,
        });
        
        // Download the temporary image and upload to our storage
        console.log('[Card] Downloading Nano Banana image and uploading to storage...');
        const imageResponse = await fetch(nanoBananaImageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        
        imageUrl = await objectStorageService.uploadBase64Image(
          imageBase64,
          `cards/${userId}`,
          'card'
        );
        console.log('[Card] Image uploaded to storage:', imageUrl);
      } else {
        console.log('[Card] Using OpenAI for image generation (Nano Banana API key not set)');
        const cardImageBase64 = await generateCardImage({
          occasion,
          tone: tone || "sweet",
          recipientName,
        });
        imageUrl = await objectStorageService.uploadBase64Image(
          cardImageBase64,
          `cards/${userId}`,
          'card'
        );
      }

      const creation = await storage.createCreation({
        userId,
        lovedOneId: lovedOneId || null,
        type: 'card',
        tone: tone || 'sweet',
        title: cardContent.title,
        content: cardContent.message,
        imageUrl,
      });
      
      const shareableLink = `card-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const updatedCreation = await storage.updateCreation(creation.id, { shareableLink });

      res.json(updatedCreation || creation);
    } catch (error: any) {
      console.error("Error generating card:", error);
      res.status(500).json({ message: error.message || "Failed to generate card" });
    }
  });

  // ========== FAMILY PORTRAIT COMPOSER ==========
  
  // Upload multiple photos for family portrait analysis
  app.post('/api/family-portrait/upload', isAuthenticated, upload.array('photos', 6), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length < 2) {
        return res.status(400).json({ message: 'Please upload at least 2 photos (max 6)' });
      }

      console.log(`[FamilyPortrait] Uploading ${files.length} photos from user ${userId}`);
      
      // Upload all images to object storage
      const uploadedUrls: string[] = [];
      
      // Construct base URL for images - use APP_URL (production) or Replit domain for public accessibility
      const appUrl = process.env.APP_URL;
      const replitDevDomain = process.env.REPLIT_DEV_DOMAIN;
      const requestHost = req.headers['host'] as string || '';
      const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
      
      // Priority: APP_URL > Replit dev domain > request host
      let baseUrl = appUrl || (replitDevDomain ? `https://${replitDevDomain}` : `${protocol}://${requestHost}`);
      // Remove trailing slash if present
      baseUrl = baseUrl.replace(/\/$/, '');
      
      // Warn if using localhost (won't work with external AI services)
      const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
      if (isLocalhost) {
        console.warn('[FamilyPortrait] WARNING: Using localhost base URL. AI face analysis may fail. Set APP_URL env var for production use.');
      }
      
      console.log(`[FamilyPortrait] Using base URL: ${baseUrl}`);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = file.buffer.toString('base64');
        const imagePath = await objectStorageService.uploadBase64Image(
          base64,
          `family-portraits/${userId}`,
          `source-${Date.now()}-${i}`
        );
        
        // Get full URL for the image - ensure it's absolute
        const fullUrl = imagePath.startsWith('http') ? imagePath : `${baseUrl}${imagePath}`;
        uploadedUrls.push(fullUrl);
        console.log(`[FamilyPortrait] Uploaded photo ${i + 1}: ${fullUrl}`);
      }

      res.json({ 
        imageUrls: uploadedUrls,
        count: uploadedUrls.length
      });
    } catch (error: any) {
      console.error('Error uploading family portrait photos:', error);
      res.status(500).json({ message: error.message || 'Failed to upload photos' });
    }
  });

  // Analyze uploaded photos for faces
  app.post('/api/family-portrait/analyze', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { imageUrls } = req.body;
      
      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length < 2) {
        return res.status(400).json({ message: 'Please provide at least 2 image URLs' });
      }

      // Check if any URLs are localhost (won't work with AI services)
      const hasLocalUrls = imageUrls.some(url => url.includes('localhost') || url.includes('127.0.0.1'));
      if (hasLocalUrls) {
        console.warn('[FamilyPortrait] Localhost URLs detected - AI analysis may fail');
        return res.status(502).json({ 
          message: 'Image URLs must be publicly accessible. Please ensure you are running on a public domain or set APP_URL environment variable.',
          hint: 'localhost URLs cannot be accessed by external AI services'
        });
      }

      console.log(`[FamilyPortrait] Analyzing ${imageUrls.length} photos for faces...`);
      
      const { analyzePhotosForFaces } = await import('./openaiService');
      const result = await analyzePhotosForFaces(imageUrls);

      // Validate that we got face data
      if (!result.faces || result.faces.length === 0) {
        console.warn('[FamilyPortrait] No faces detected in photos');
        return res.status(400).json({ 
          message: 'No people were detected in the uploaded photos. Please try again with clearer photos showing faces.',
          faces: [],
          totalPeople: 0
        });
      }

      res.json(result);
    } catch (error: any) {
      console.error('Error analyzing photos:', error);
      // Provide more specific error message for common failures
      const errorMessage = error.message?.includes('fetch') || error.message?.includes('URL')
        ? 'Unable to access the uploaded photos. Please ensure the images are publicly accessible.'
        : error.message || 'Failed to analyze photos. Please try again.';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Generate unified family portrait
  app.post('/api/family-portrait/generate', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { imageUrls, selectedFaces, scene, style, keepOutfits, recipientName, lovedOneId } = req.body;
      
      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length < 2) {
        return res.status(400).json({ message: 'Please provide at least 2 image URLs' });
      }
      
      if (!selectedFaces || !Array.isArray(selectedFaces) || selectedFaces.length === 0) {
        return res.status(400).json({ message: 'Please select at least one person to include' });
      }

      console.log(`[FamilyPortrait] Generating portrait with ${selectedFaces.length} people in ${scene} scene, ${style} style`);
      
      const { buildFamilyPortraitPrompt } = await import('./openaiService');
      const { generateImageStandard } = await import('./nanoBananaService');
      
      // Build the compositing prompt
      const prompt = buildFamilyPortraitPrompt({
        imageUrls,
        selectedFaces,
        scene: scene || 'studio',
        style: style || 'studio-photo',
        keepOutfits: keepOutfits ?? true,
      });

      console.log(`[FamilyPortrait] Using prompt: ${prompt.substring(0, 200)}...`);

      // Use Nano Banana's image-to-image with the uploaded photos
      const generatedUrls = await generateImageStandard({
        prompt,
        numImages: 1,
        imageSize: '4:3',
        imageUrls: imageUrls, // Pass source photos for reference
      });

      if (!generatedUrls || generatedUrls.length === 0) {
        throw new Error('No image generated');
      }

      const generatedImageUrl = generatedUrls[0];
      console.log(`[FamilyPortrait] Generated portrait: ${generatedImageUrl}`);

      // Download and upload to our storage for persistence
      const response = await fetch(generatedImageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      
      const finalImagePath = await objectStorageService.uploadBase64Image(
        base64,
        `family-portraits/${userId}`,
        `portrait-${Date.now()}`
      );

      // The path already works as a URL since we serve public-objects
      console.log(`[FamilyPortrait] Final portrait path: ${finalImagePath}`);

      // Create a card creation with the portrait
      const creation = await storage.createCreation({
        userId,
        lovedOneId: lovedOneId || null,
        type: 'card',
        tone: style || 'studio-photo',
        title: `Family Portrait - ${scene || 'Studio'}`,
        content: `A beautiful family portrait featuring ${selectedFaces.length} people in ${scene || 'studio'} setting, rendered in ${style || 'studio photo'} style.`,
        imageUrl: finalImagePath,
      });

      const shareableLink = `portrait-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const updatedCreation = await storage.updateCreation(creation.id, { shareableLink });

      res.json({
        creation: updatedCreation || creation,
        imageUrl: finalImagePath,
      });
    } catch (error: any) {
      console.error('Error generating family portrait:', error);
      res.status(500).json({ message: error.message || 'Failed to generate family portrait' });
    }
  });

  // Generate AI Animation - Coming Soon (Sora API not publicly available yet)
  app.post('/api/generate/animation', isAuthenticated, async (req: Request, res: Response) => {
    // Animation generation is temporarily disabled as the Sora video API is not yet publicly available
    return res.status(503).json({ 
      message: "AI Animation generation is coming soon! This feature will be available when video generation APIs become publicly accessible.",
      comingSoon: true
    });
  });

  // Generate AI Questionnaire - personalized follow-up questions based on song details
  app.post('/api/generate/questionnaire', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { lovedOneId, recipientName, relationship, occasion, tone, genre, songDetails } = req.body;
      
      if (!songDetails || songDetails.length < 10) {
        return res.status(400).json({ message: "Please provide more details about the song (at least 10 characters)" });
      }

      let lovedOne;
      if (lovedOneId) {
        lovedOne = await storage.getLovedOneById(lovedOneId);
      }

      const { generateSongQuestionnaire } = await import('./openaiService');
      
      const questionnaire = await generateSongQuestionnaire({
        recipientName: lovedOne?.name || recipientName || "someone special",
        relationship: lovedOne?.relationship || relationship || "friend",
        occasion,
        tone,
        genre,
        songDetails,
      });

      res.json(questionnaire);
    } catch (error: any) {
      console.error("Error generating questionnaire:", error);
      res.status(500).json({ message: error.message || "Failed to generate questions" });
    }
  });

  // Generate Lyrics Preview Only (fast, no song creation)
  app.post('/api/generate/lyrics-preview', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { lovedOneId, tone, genre, occasion, recipientName, relationship, songDetails, additionalNotes } = req.body;
      // Support both songDetails (new) and additionalNotes (legacy)
      const details = songDetails || additionalNotes;
      
      let lovedOne;
      if (lovedOneId) {
        lovedOne = await storage.getLovedOneById(lovedOneId);
      }

      const lyrics = await generateSongLyrics({
        recipientName: lovedOne?.name || recipientName || "someone special",
        relationship: lovedOne?.relationship || relationship || "friend",
        occasion,
        tone: tone || "sweet",
        genre: genre || "pop",
        interests: lovedOne?.interests || undefined,
        insideJokes: lovedOne?.insideJokes || undefined,
        additionalNotes: details || undefined,
      });

      res.json(lyrics);
    } catch (error: any) {
      console.error("Error generating lyrics preview:", error);
      res.status(500).json({ message: error.message || "Failed to generate lyrics" });
    }
  });

  // Generate AI Song with Custom Lyrics (background processing to avoid timeout)
  app.post('/api/generate/song-with-lyrics', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { lovedOneId, tone, genre, title, lyrics, songDetails, additionalNotes, voice, duration, customCoverImageUrl } = req.body;
      // Support both songDetails (new) and additionalNotes (legacy)
      const details = songDetails || additionalNotes;
      
      if (!lyrics || !title) {
        return res.status(400).json({ message: "Lyrics and title are required" });
      }

      // Check if user has songs remaining
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Allow if user has credits OR has active subscription OR is admin
      const hasActiveSubscription = user.subscriptionStatus === 'active';
      const songsRemaining = user.songsRemaining ?? 0;
      const isAdmin = user.isAdmin === true;
      
      if (songsRemaining <= 0 && !hasActiveSubscription && !isAdmin) {
        return res.status(403).json({ 
          message: "No songs remaining. Please purchase a Credit Pack or subscribe for more songs.",
          songsRemaining: 0,
          requiresPayment: true 
        });
      }

      // Decrement credits IMMEDIATELY (before generation) for non-subscribers (admins exempt)
      if (!hasActiveSubscription && !isAdmin) {
        await storage.updateUser(userId, { songsRemaining: songsRemaining - 1 });
        console.log(`[Song] User ${userId} credit deducted upfront. Songs remaining: ${songsRemaining - 1}`);
      }

      // Get loved one name for cover text
      let recipientName = 'Someone Special';
      if (lovedOneId) {
        const lovedOne = await storage.getLovedOneById(lovedOneId);
        if (lovedOne) {
          recipientName = lovedOne.name;
        }
      }

      // Create a placeholder creation with "generating" status
      const creation = await storage.createCreation({
        userId,
        lovedOneId: lovedOneId || null,
        type: 'song',
        tone: tone || 'sweet',
        genre: genre || 'pop',
        title: `Generating: ${title}`,
        content: lyrics,
        imageUrl: null,
        mediaUrl: null,
        status: 'generating',
      });

      // Return immediately - song will be generated in background
      res.json({
        ...creation,
        status: 'generating',
        message: 'Song generation started! This may take 2-4 minutes. Refresh your dashboard to see when it\'s ready.',
      });

      // Process song generation in background (don't await - response already sent)
      (async () => {
        try {
          const { generateSongWithLyrics } = await import('./sunoService');
          
          const songResult = await generateSongWithLyrics({
            title,
            lyrics,
            tone: tone || "sweet",
            genre: genre || "pop",
            voice: voice || undefined,
            additionalNotes: details || undefined,
            duration: duration || "extended",
          });

          // Generate AI cassette cover
          let coverImageUrl = null;
          try {
            const cassetteCoverUrl = await generateSongCover({
              title: songResult.title,
              tone: tone || 'sweet',
              genre: genre || 'pop',
              recipientName,
            });
            
            if (cassetteCoverUrl) {
              const coverResponse = await fetch(cassetteCoverUrl);
              const coverBuffer = await coverResponse.arrayBuffer();
              const coverBase64 = Buffer.from(coverBuffer).toString('base64');
              
              coverImageUrl = await objectStorageService.uploadBase64Image(
                coverBase64,
                `songs/${userId}`,
                'cover'
              );
              console.log('[Song] AI cassette cover generated and uploaded:', coverImageUrl);
            }
          } catch (coverError: any) {
            console.error('[Song] Failed to generate AI cassette cover:', coverError.message);
          }

          const shareableLink = `song-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          await storage.updateCreation(creation.id, {
            title: songResult.title,
            content: songResult.lyrics,
            imageUrl: coverImageUrl,
            mediaUrl: songResult.audioUrl,
            shareableLink,
            status: 'ready',
          });
          
          console.log(`[Song] Background generation complete for creation ${creation.id}`);
        } catch (error: any) {
          console.error(`[Song] Background generation failed for creation ${creation.id}:`, error.message);
          await storage.updateCreation(creation.id, {
            status: 'failed',
            title: 'Song generation failed',
          });
          
          // Refund credit on failure (only for non-subscribers)
          const currentUser = await storage.getUser(userId);
          if (currentUser && currentUser.subscriptionStatus !== 'active') {
            const refundedCredits = (currentUser.songsRemaining ?? 0) + 1;
            await storage.updateUser(userId, { songsRemaining: refundedCredits });
            console.log(`[Song] Credit refunded for user ${userId} due to failure. Songs remaining: ${refundedCredits}`);
          }
        }
      })();
    } catch (error: any) {
      console.error("Error starting song generation:", error);
      res.status(500).json({ message: error.message || "Failed to start song generation" });
    }
  });

  // Generate AI Song (background processing to avoid timeout)
  app.post('/api/generate/song', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { lovedOneId, tone, genre, occasion, voice, duration, customCoverImageUrl } = req.body;
      
      // Check if user has songs remaining
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Allow if user has credits OR has active subscription OR is admin
      const hasActiveSubscription = user.subscriptionStatus === 'active';
      const songsRemaining = user.songsRemaining ?? 0;
      const isAdmin = user.isAdmin === true;
      
      if (songsRemaining <= 0 && !hasActiveSubscription && !isAdmin) {
        return res.status(403).json({ 
          message: "No songs remaining. Please purchase a Credit Pack or subscribe for more songs.",
          songsRemaining: 0,
          requiresPayment: true 
        });
      }
      
      // Decrement credits IMMEDIATELY (before generation) for non-subscribers (admins exempt)
      if (!hasActiveSubscription && !isAdmin) {
        await storage.updateUser(userId, { songsRemaining: songsRemaining - 1 });
        console.log(`[Song] User ${userId} credit deducted upfront. Songs remaining: ${songsRemaining - 1}`);
      }
      
      let lovedOne;
      if (lovedOneId) {
        lovedOne = await storage.getLovedOneById(lovedOneId);
      }

      const recipientName = lovedOne?.name || req.body.recipientName || 'Someone Special';

      // Create a placeholder creation with "generating" status
      const creation = await storage.createCreation({
        userId,
        lovedOneId: lovedOneId || null,
        type: 'song',
        tone: tone || 'sweet',
        genre: genre || 'pop',
        title: `Generating song for ${recipientName}...`,
        content: null,
        imageUrl: null,
        mediaUrl: null,
        status: 'generating',
      });

      // Return immediately - song will be generated in background
      res.json({
        ...creation,
        status: 'generating',
        message: 'Song generation started! This may take 2-4 minutes. Refresh your dashboard to see when it\'s ready.',
      });

      // Process song generation in background (don't await - response already sent)
      (async () => {
        try {
          const { generateSong } = await import('./sunoService');
          
          const songResult = await generateSong({
            recipientName,
            relationship: lovedOne?.relationship || req.body.relationship || "friend",
            occasion,
            tone: tone || "sweet",
            genre: genre || "pop",
            voice: voice || undefined,
            interests: lovedOne?.interests || undefined,
            insideJokes: lovedOne?.insideJokes || undefined,
            duration: duration || "extended",
          });

          // Generate AI cassette cover
          let coverImageUrl = null;
          try {
            const cassetteCoverUrl = await generateSongCover({
              title: songResult.title,
              tone: tone || 'sweet',
              genre: genre || 'pop',
              recipientName,
              customImageUrl: customCoverImageUrl || undefined,
            });
            
            if (cassetteCoverUrl) {
              const coverResponse = await fetch(cassetteCoverUrl);
              const coverBuffer = await coverResponse.arrayBuffer();
              const coverBase64 = Buffer.from(coverBuffer).toString('base64');
              
              coverImageUrl = await objectStorageService.uploadBase64Image(
                coverBase64,
                `songs/${userId}`,
                'cover'
              );
              console.log('[Song] AI cassette cover generated and uploaded:', coverImageUrl);
            }
          } catch (coverError: any) {
            console.error('[Song] Failed to generate AI cassette cover:', coverError.message);
          }

          const shareableLink = `song-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          await storage.updateCreation(creation.id, {
            title: songResult.title,
            content: songResult.lyrics,
            imageUrl: coverImageUrl,
            mediaUrl: songResult.audioUrl,
            shareableLink,
            status: 'ready',
          });
          
          console.log(`[Song] Background generation complete for creation ${creation.id}`);
        } catch (error: any) {
          console.error(`[Song] Background generation failed for creation ${creation.id}:`, error.message);
          await storage.updateCreation(creation.id, {
            status: 'failed',
            title: 'Song generation failed',
          });
          
          // Refund credit on failure (only for non-subscribers)
          const currentUser = await storage.getUser(userId);
          if (currentUser && currentUser.subscriptionStatus !== 'active') {
            const refundedCredits = (currentUser.songsRemaining ?? 0) + 1;
            await storage.updateUser(userId, { songsRemaining: refundedCredits });
            console.log(`[Song] Credit refunded for user ${userId} due to failure. Songs remaining: ${refundedCredits}`);
          }
        }
      })();
    } catch (error: any) {
      console.error("Error starting song generation:", error);
      res.status(500).json({ message: error.message || "Failed to start song generation" });
    }
  });

  // Generate Lyrics Preview Only (Fast - no audio generation)
  app.post('/api/generate/lyrics-preview', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { lovedOneId, tone, genre, additionalNotes } = req.body;
      
      let lovedOne;
      if (lovedOneId) {
        lovedOne = await storage.getLovedOneById(lovedOneId);
      }

      const recipientName = lovedOne?.name || req.body.recipientName || "someone special";

      const songLyrics = await generateSongLyrics({
        recipientName,
        relationship: lovedOne?.relationship || req.body.relationship || "friend",
        occasion: req.body.occasion,
        tone: tone || "sweet",
        genre: genre || "pop",
        interests: lovedOne?.interests || undefined,
        insideJokes: lovedOne?.insideJokes || undefined,
        additionalNotes,
      });

      res.json({
        title: songLyrics.title,
        lyrics: songLyrics.lyrics,
        genre: genre || "pop",
        tone: tone || "sweet",
      });
    } catch (error: any) {
      console.error("Error generating lyrics preview:", error);
      res.status(500).json({ message: error.message || "Failed to generate lyrics" });
    }
  });

  // Generate Song with Pre-written/Edited Lyrics
  app.post('/api/generate/song-with-lyrics', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { lovedOneId, title, lyrics, tone, genre } = req.body;

      if (!title || !lyrics) {
        return res.status(400).json({ message: "Title and lyrics are required" });
      }

      let lovedOne;
      if (lovedOneId) {
        lovedOne = await storage.getLovedOneById(lovedOneId);
      }

      const { generateSong } = await import('./sunoService');

      // Generate song with the provided lyrics
      const songResult = await generateSong({
        recipientName: lovedOne?.name || req.body.recipientName || "someone special",
        relationship: lovedOne?.relationship || "friend",
        occasion: req.body.occasion,
        tone: tone || "sweet",
        genre: genre || "pop",
        customLyrics: lyrics,
        customTitle: title,
      });

      // Upload cover image if provided
      let coverImageUrl = null;
      if (songResult.coverImage && songResult.coverImage.startsWith('http')) {
        const coverResponse = await fetch(songResult.coverImage);
        const coverBuffer = await coverResponse.arrayBuffer();
        const coverBase64 = Buffer.from(coverBuffer).toString('base64');
        
        coverImageUrl = await objectStorageService.uploadBase64Image(
          coverBase64,
          `songs/${userId}`,
          'cover'
        );
      }

      // Use the user's edited title and lyrics (not Suno's return which might differ)
      const creation = await storage.createCreation({
        userId,
        lovedOneId: lovedOneId || null,
        type: 'song',
        tone: tone || 'sweet',
        genre: genre || 'pop',
        title: title,  // Use user's edited title
        content: lyrics,  // Use user's edited lyrics
        imageUrl: coverImageUrl || null,
        mediaUrl: songResult.audioUrl,
      });
      
      const shareableLink = `song-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const updatedCreation = await storage.updateCreation(creation.id, { shareableLink });

      res.json(updatedCreation || creation);
    } catch (error: any) {
      console.error("Error generating song with lyrics:", error);
      res.status(500).json({ message: error.message || "Failed to generate song" });
    }
  });

  // Generate Song with OpenAI Only (Fallback - No Audio)
  app.post('/api/generate/song/openai-only', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      const parsed = insertCreationSchema.pick({ 
        lovedOneId: true, 
        tone: true, 
        genre: true 
      }).extend({
        recipientName: z.string().optional(),
        relationship: z.string().optional(),
        occasion: z.string().optional(),
      }).safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: parsed.error.errors 
        });
      }

      const { lovedOneId, tone, genre, occasion, recipientName, relationship } = parsed.data;
      
      let lovedOne;
      if (lovedOneId) {
        lovedOne = await storage.getLovedOneById(lovedOneId);
      }

      const { generateSongLyrics, generateSongCover } = await import('./openaiService');
      
      const songLyrics = await generateSongLyrics({
        recipientName: lovedOne?.name || recipientName || "someone special",
        relationship: lovedOne?.relationship || relationship || "friend",
        occasion,
        tone: tone || "sweet",
        genre: genre || "pop",
        interests: lovedOne?.interests || undefined,
        insideJokes: lovedOne?.insideJokes || undefined,
      });

      const coverBase64 = await generateSongCover({
        title: songLyrics.title,
        tone: tone || "sweet",
        genre: genre || "pop",
      });

      const coverImageUrl = await objectStorageService.uploadBase64Image(
        coverBase64,
        `songs/${userId}`,
        'cover'
      );

      const creation = await storage.createCreation({
        userId,
        lovedOneId: lovedOneId || null,
        type: 'song',
        tone: tone || 'sweet',
        genre: genre || 'pop',
        title: songLyrics.title,
        content: songLyrics.lyrics,
        imageUrl: coverImageUrl || null,
        mediaUrl: null,
      });
      
      const shareableLink = `song-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const updatedCreation = await storage.updateCreation(creation.id, { shareableLink });

      res.json(updatedCreation || creation);
    } catch (error: any) {
      console.error("Error generating song with OpenAI:", error);
      res.status(500).json({ message: error.message || "Failed to generate song" });
    }
  });

  // Get shareable creation (public)
  app.get('/api/share/:link', async (req: Request, res: Response) => {
    try {
      const creation = await storage.getCreationByShareableLink(req.params.link);
      
      if (!creation) {
        return res.status(404).json({ message: "Creation not found" });
      }
      
      res.json(creation);
    } catch (error) {
      console.error("Error fetching shared creation:", error);
      res.status(500).json({ message: "Failed to fetch creation" });
    }
  });

  // Serve public objects from object storage
  app.get('/public-objects/*', async (req: Request, res: Response) => {
    try {
      const objectPath = req.path;
      const file = await objectStorageService.getObjectEntityFile(objectPath);
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      if (error instanceof Error && error.message === "Object not found") {
        return res.status(404).json({ message: "Object not found" });
      }
      console.error("Error serving public object:", error);
      res.status(500).json({ message: "Failed to serve object" });
    }
  });

  // ========== SCHEDULED DELIVERY ROUTES ==========

  // Get user's scheduled deliveries
  app.get('/api/scheduled-deliveries', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const deliveries = await storage.getScheduledDeliveriesByUserId(userId);
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching scheduled deliveries:", error);
      res.status(500).json({ message: "Failed to fetch scheduled deliveries" });
    }
  });

  // Schedule a creation for delivery
  app.post('/api/creations/:id/schedule', isAuthenticated, async (req: Request, res: Response) => {
    console.log('[Schedule] Received request:', { creationId: req.params.id, body: req.body });
    try {
      const userId = (req.user as any).id;
      const creationId = req.params.id;
      
      const schema = z.object({
        scheduledAt: z.string(),
        recipientEmail: z.string().email().optional(),
        recipientPhone: z.string().optional(),
      }).refine(data => data.recipientEmail || data.recipientPhone, {
        message: "At least one of email or phone is required"
      });
      
      const { scheduledAt, recipientEmail, recipientPhone } = schema.parse(req.body);
      
      // Verify the creation belongs to this user
      const creation = await storage.getCreationById(creationId);
      if (!creation) {
        return res.status(404).json({ message: "Creation not found" });
      }
      if (creation.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to schedule this creation" });
      }
      
      // Normalize phone number if provided
      let normalizedPhone = recipientPhone;
      if (recipientPhone) {
        normalizedPhone = recipientPhone.replace(/[^\d+]/g, '');
        if (!normalizedPhone.startsWith('+')) {
          normalizedPhone = '+1' + normalizedPhone;
        }
      }
      
      const delivery = await storage.createScheduledDelivery({
        userId,
        creationId,
        recipientEmail: recipientEmail || null,
        recipientPhone: normalizedPhone || null,
        scheduledAt: new Date(scheduledAt),
        status: 'pending',
      });
      
      console.log('[Schedule] Created delivery:', delivery);
      res.json(delivery);
    } catch (error: any) {
      console.error("Error scheduling delivery:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || 'Invalid input' });
      }
      res.status(500).json({ message: error.message || "Failed to schedule delivery" });
    }
  });

  // Cancel a scheduled delivery
  app.patch('/api/scheduled-deliveries/:id/cancel', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const deliveryId = req.params.id;
      
      const delivery = await storage.getScheduledDeliveryById(deliveryId);
      if (!delivery) {
        return res.status(404).json({ message: "Scheduled delivery not found" });
      }
      if (delivery.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to cancel this delivery" });
      }
      if (delivery.status !== 'pending') {
        return res.status(400).json({ message: "Can only cancel pending deliveries" });
      }
      
      await storage.cancelScheduledDelivery(deliveryId);
      res.json({ message: "Delivery cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling scheduled delivery:", error);
      res.status(500).json({ message: "Failed to cancel delivery" });
    }
  });

  // ========== MIXTAPE ROUTES ==========

  // Get user's mixtapes
  app.get('/api/mixtapes', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const mixtapes = await storage.getMixtapesByUserId(userId);
      res.json(mixtapes);
    } catch (error) {
      console.error("Error fetching mixtapes:", error);
      res.status(500).json({ message: "Failed to fetch mixtapes" });
    }
  });

  // Create mixtape from existing songs
  app.post('/api/mixtapes/from-songs', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { title, theme, recipientName, songIds } = req.body;

      if (!title || !songIds || !Array.isArray(songIds) || songIds.length === 0) {
        return res.status(400).json({ message: "Title and at least one song are required" });
      }

      // Verify all songs belong to this user and are of type 'song'
      const songs: Creation[] = [];
      for (const songId of songIds) {
        const creation = await storage.getCreationById(songId);
        if (!creation) {
          return res.status(404).json({ message: `Song with ID ${songId} not found` });
        }
        if (creation.userId !== userId) {
          return res.status(403).json({ message: "You can only add your own songs to a mixtape" });
        }
        if (creation.type !== 'song') {
          return res.status(400).json({ message: `Creation ${songId} is not a song` });
        }
        songs.push(creation);
      }

      // Create the mixtape
      const mixtape = await storage.createMixtape({
        userId,
        title,
        theme: theme || 'custom',
        recipientName: recipientName || null,
        songIds,
        status: 'complete',
      });

      // Generate cassette cover for the mixtape
      try {
        const { generateSongCover } = await import('./openaiService');
        const coverUrl = await generateSongCover({
          title,
          tone: 'nostalgic',
          genre: 'mixtape',
          recipientName: recipientName || 'Someone Special',
        });

        if (coverUrl) {
          const coverResponse = await fetch(coverUrl);
          const coverBuffer = await coverResponse.arrayBuffer();
          const coverBase64 = Buffer.from(coverBuffer).toString('base64');
          
          const imageUrl = await objectStorageService.uploadBase64Image(
            coverBase64,
            `mixtapes/${userId}`,
            'cassette-cover'
          );
          
          await storage.updateMixtape(mixtape.id, { cassetteCaseImageUrl: imageUrl });
          mixtape.cassetteCaseImageUrl = imageUrl;
        }
      } catch (coverError: any) {
        console.error('[Mixtape] Failed to generate cassette cover:', coverError.message);
      }

      console.log(`[Mixtape] Created mixtape "${title}" from ${songIds.length} existing songs`);
      res.json(mixtape);
    } catch (error: any) {
      console.error("Error creating mixtape from songs:", error);
      res.status(500).json({ message: error.message || "Failed to create mixtape" });
    }
  });

  // Theme-based song configurations for mixtapes
  const MIXTAPE_THEMES: Record<string, { songs: Array<{ genre: string; tone: string; occasion: string }> }> = {
    'wedding': {
      songs: [
        { genre: 'acoustic ballad', tone: 'romantic', occasion: 'first dance' },
        { genre: 'pop', tone: 'sweet', occasion: 'wedding celebration' },
        { genre: 'soul', tone: 'heartfelt', occasion: 'love dedication' },
      ]
    },
    'anniversary': {
      songs: [
        { genre: 'jazz', tone: 'romantic', occasion: 'anniversary' },
        { genre: 'r&b', tone: 'sweet', occasion: 'years together' },
        { genre: 'acoustic', tone: 'heartfelt', occasion: 'love story' },
      ]
    },
    'birthday-party': {
      songs: [
        { genre: 'pop', tone: 'fun', occasion: 'birthday' },
        { genre: 'dance', tone: 'playful', occasion: 'birthday party' },
        { genre: 'hip-hop', tone: 'funny', occasion: 'birthday celebration' },
      ]
    },
    'romantic-evening': {
      songs: [
        { genre: 'jazz', tone: 'romantic', occasion: 'romantic evening' },
        { genre: 'r&b', tone: 'sweet', occasion: 'love' },
        { genre: 'soul ballad', tone: 'romantic', occasion: 'special night' },
      ]
    },
    'friendship': {
      songs: [
        { genre: 'pop', tone: 'fun', occasion: 'friendship' },
        { genre: 'indie', tone: 'heartfelt', occasion: 'best friends' },
        { genre: 'folk', tone: 'sweet', occasion: 'friendship celebration' },
      ]
    },
    // Client mode themes
    'appreciation': {
      songs: [
        { genre: 'jazz', tone: 'warm', occasion: 'client appreciation' },
        { genre: 'acoustic', tone: 'sincere', occasion: 'thank you' },
        { genre: 'soul', tone: 'heartfelt', occasion: 'gratitude' },
      ]
    },
    'corporate': {
      songs: [
        { genre: 'pop', tone: 'uplifting', occasion: 'corporate celebration' },
        { genre: 'electronic', tone: 'energetic', occasion: 'company event' },
        { genre: 'rock', tone: 'inspiring', occasion: 'team motivation' },
      ]
    },
    'thank-you': {
      songs: [
        { genre: 'acoustic', tone: 'sincere', occasion: 'thank you' },
        { genre: 'pop', tone: 'warm', occasion: 'appreciation' },
        { genre: 'folk', tone: 'heartfelt', occasion: 'gratitude' },
      ]
    },
    'congratulations': {
      songs: [
        { genre: 'pop', tone: 'celebratory', occasion: 'congratulations' },
        { genre: 'dance', tone: 'upbeat', occasion: 'achievement' },
        { genre: 'rock', tone: 'triumphant', occasion: 'success' },
      ]
    },
    'celebration': {
      songs: [
        { genre: 'pop', tone: 'joyful', occasion: 'celebration' },
        { genre: 'dance', tone: 'festive', occasion: 'party' },
        { genre: 'funk', tone: 'upbeat', occasion: 'good times' },
      ]
    },
    'welcome': {
      songs: [
        { genre: 'acoustic', tone: 'warm', occasion: 'welcome' },
        { genre: 'pop', tone: 'friendly', occasion: 'new beginnings' },
        { genre: 'folk', tone: 'inviting', occasion: 'greeting' },
      ]
    },
    'holiday': {
      songs: [
        { genre: 'pop', tone: 'festive', occasion: 'holiday' },
        { genre: 'jazz', tone: 'warm', occasion: 'seasonal celebration' },
        { genre: 'acoustic', tone: 'cozy', occasion: 'holiday cheer' },
      ]
    },
  };

  // Generate Mixtape (creates multiple songs)
  app.post('/api/generate/mixtape', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { 
        lovedOneId, theme, recipientName, relationship,
        genre1, tone1, notes1, voice1, duration1, customTitle1, customLyrics1,
        genre2, tone2, notes2, voice2, duration2, customTitle2, customLyrics2,
        genre3, tone3, notes3, voice3, duration3, customTitle3, customLyrics3,
        customCassetteImageUrl
      } = req.body;

      if (!theme || !MIXTAPE_THEMES[theme]) {
        return res.status(400).json({ message: "Invalid or missing theme" });
      }

      if (!genre1 || !genre2 || !genre3) {
        return res.status(400).json({ message: "All three genres are required" });
      }

      if (!tone1 || !tone2 || !tone3) {
        return res.status(400).json({ message: "All three tones are required" });
      }
      
      const genres = [genre1, genre2, genre3];
      const tones = [tone1, tone2, tone3];
      const notes = [notes1 || '', notes2 || '', notes3 || ''];
      const voices = [voice1 || undefined, voice2 || undefined, voice3 || undefined];
      const durations = [duration1 || 'extended', duration2 || 'extended', duration3 || 'extended'];
      const customTitles = [customTitle1 || undefined, customTitle2 || undefined, customTitle3 || undefined];
      const customLyrics = [customLyrics1 || undefined, customLyrics2 || undefined, customLyrics3 || undefined];

      let lovedOne = lovedOneId ? await storage.getLovedOneById(lovedOneId) : null;

      const recipient = lovedOne?.name || recipientName || "someone special";
      const recipientRelationship = lovedOne?.relationship || relationship || "friend";

      // Create mixtape record first with pending status
      const themeConfig = MIXTAPE_THEMES[theme];
      const themeTitle = theme.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      const shareableMixtapeLink = `mixtape-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const mixtape = await storage.createMixtape({
        userId,
        lovedOneId: lovedOneId || null,
        title: `${themeTitle} Mixtape for ${recipient}`,
        theme,
        recipientName: recipient,
        songIds: [],
        shareableLink: shareableMixtapeLink,
        cassetteCaseImageUrl: null, // Will be generated/composited after songs are created
        status: 'generating',
      });

      // Return immediately with generating status - songs will be created in background
      res.json({
        mixtape,
        status: 'generating',
        message: 'Your mixtape is being created! This may take a few minutes.',
      });

      // Process song generation in background (don't await - response already sent)
      setImmediate(async () => {
        try {
          // Generate songs sequentially (Suno API needs time)
          const { generateSong } = await import('./sunoService');
          const songIds: string[] = [];

          for (let i = 0; i < themeConfig.songs.length; i++) {
            const songConfig = themeConfig.songs[i];
            const songGenre = genres[i];
            const songTone = tones[i];
            const songNotes = notes[i];
            const songVoice = voices[i];
            const songDuration = durations[i];
            const songCustomTitle = customTitles[i];
            const songCustomLyrics = customLyrics[i];
            // Only use custom lyrics/title if BOTH are provided (required by Suno API)
            const useCustomLyrics = songCustomTitle && songCustomLyrics;
            try {
              // Use user-selected genre, tone, voice, duration, notes, and optional custom lyrics/title for each song
              const songResult = await generateSong({
                recipientName: recipient,
                relationship: recipientRelationship,
                occasion: songConfig.occasion,
                tone: songTone,
                genre: songGenre,
                voice: songVoice,
                interests: lovedOne?.interests || undefined,
                insideJokes: lovedOne?.insideJokes || undefined,
                additionalNotes: songNotes || undefined,
                duration: songDuration,
                customTitle: useCustomLyrics ? songCustomTitle : undefined,
                customLyrics: useCustomLyrics ? songCustomLyrics : undefined,
              });

              let coverImageUrl = songResult.coverImage;
              // Upload cover image to object storage (with its own error handling)
              if (songResult.coverImage && songResult.coverImage.startsWith('http')) {
                try {
                  const coverResponse = await fetch(songResult.coverImage);
                  const coverBuffer = await coverResponse.arrayBuffer();
                  const coverBase64 = Buffer.from(coverBuffer).toString('base64');
                  coverImageUrl = await objectStorageService.uploadBase64Image(
                    coverBase64,
                    `songs/${userId}`,
                    'cover'
                  );
                } catch (uploadError: any) {
                  console.error(`[Mixtape ${mixtape.id}] Failed to upload cover, using original:`, uploadError.message);
                  // Keep original cover URL if upload fails
                }
              }

              const creation = await storage.createCreation({
                userId,
                lovedOneId: lovedOneId || null,
                type: 'song',
                tone: songTone,
                genre: songGenre,
                title: songResult.title,
                content: songResult.lyrics,
                imageUrl: coverImageUrl || null,
                mediaUrl: songResult.audioUrl,
              });

              const shareableLink = `song-${Date.now()}-${Math.random().toString(36).substring(7)}`;
              await storage.updateCreation(creation.id, { shareableLink });
              songIds.push(creation.id);

              console.log(`[Mixtape ${mixtape.id}] Generated song ${songIds.length}/${themeConfig.songs.length}: ${songResult.title}`);
            } catch (songError: any) {
              console.error(`[Mixtape ${mixtape.id}] Error generating song:`, songError.message);
              // Continue with next song even if one fails
            }
          }

          // Update mixtape with generated song IDs and final status
          await storage.updateMixtape(mixtape.id, {
            songIds,
            status: songIds.length > 0 ? 'complete' : 'failed',
          });

          console.log(`[Mixtape ${mixtape.id}] Completed with ${songIds.length} songs`);

          // Generate cassette case image (composite custom image if provided, otherwise AI generate)
          if (songIds.length > 0) {
            try {
              if (customCassetteImageUrl) {
                // Download custom image and composite with cassette
                console.log(`[Mixtape ${mixtape.id}] Compositing custom image with cassette template`);
                const imageResponse = await fetch(customCassetteImageUrl);
                if (imageResponse.ok) {
                  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
                  const compositedBuffer = await compositePhotoIntoCassette(imageBuffer, {
                    songTitle: mixtape.title,
                    recipientName: mixtape.recipientName || 'Someone Special',
                  });
                  
                  // Upload composited image
                  const objectStorage = new ObjectStorageService();
                  const filename = `mixtape-cassette-${mixtape.id}-${Date.now()}.png`;
                  const compositedUrl = await objectStorage.uploadBuffer(compositedBuffer, filename, 'image/png');
                  
                  await storage.updateMixtape(mixtape.id, { cassetteCaseImageUrl: compositedUrl });
                  console.log(`[Mixtape ${mixtape.id}] Generated composited cassette cover from custom image`);
                } else {
                  console.error(`[Mixtape ${mixtape.id}] Failed to download custom image`);
                }
              } else {
                // AI generate cassette case image
                const cassetteCaseImageUrl = await generateCassetteCaseImage({
                  title: mixtape.title,
                  recipientName: mixtape.recipientName || 'Someone Special',
                  theme: mixtape.theme,
                });
                await storage.updateMixtape(mixtape.id, { cassetteCaseImageUrl });
                console.log(`[Mixtape ${mixtape.id}] Generated AI cassette case image`);
              }
            } catch (err: any) {
              console.error(`[Mixtape ${mixtape.id}] Failed to generate cassette case image:`, err.message);
            }
          }
        } catch (bgError: any) {
          console.error(`[Mixtape ${mixtape.id}] Background processing failed:`, bgError.message);
          await storage.updateMixtape(mixtape.id, { status: 'failed' });
        }
      });
    } catch (error: any) {
      console.error("Error generating mixtape:", error);
      res.status(500).json({ message: error.message || "Failed to generate mixtape" });
    }
  });

  // Get shareable mixtape (public)
  app.get('/api/share/mixtape/:link', async (req: Request, res: Response) => {
    try {
      const mixtape = await storage.getMixtapeByShareableLink(req.params.link);
      
      if (!mixtape) {
        return res.status(404).json({ message: "Mixtape not found" });
      }

      // Fetch creator info (use brandName for professional branding)
      const creator = await storage.getUser(mixtape.userId);
      const creatorName = creator?.brandName || null;

      // Fetch all songs in the mixtape
      const songs = await Promise.all(
        (mixtape.songIds || []).map(id => storage.getCreationById(id))
      );

      res.json({
        ...mixtape,
        creatorName,
        songs: songs.filter(Boolean),
      });
    } catch (error) {
      console.error("Error fetching shared mixtape:", error);
      res.status(500).json({ message: "Failed to fetch mixtape" });
    }
  });

  // Get mixtape by ID (authenticated)
  app.get('/api/mixtapes/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const mixtape = await storage.getMixtapeById(req.params.id);
      
      if (!mixtape) {
        return res.status(404).json({ message: "Mixtape not found" });
      }

      if (mixtape.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Fetch all songs in the mixtape
      const songs = await Promise.all(
        (mixtape.songIds || []).map(id => storage.getCreationById(id))
      );

      res.json({
        mixtape,
        songs: songs.filter(Boolean),
      });
    } catch (error) {
      console.error("Error fetching mixtape:", error);
      res.status(500).json({ message: "Failed to fetch mixtape" });
    }
  });

  // Regenerate cassette cover image for an existing song
  app.post('/api/creations/:id/regenerate-cover', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const creation = await storage.getCreationById(req.params.id);
      
      if (!creation) {
        return res.status(404).json({ message: "Song not found" });
      }

      if (creation.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (creation.type !== 'song') {
        return res.status(400).json({ message: "This feature is only available for songs" });
      }

      console.log(`[Song] Regenerating cassette cover for "${creation.title}"`);
      
      // Get loved one name if available
      let recipientName = 'Someone Special';
      if (creation.lovedOneId) {
        const lovedOne = await storage.getLovedOneById(creation.lovedOneId);
        if (lovedOne) {
          recipientName = lovedOne.name;
        }
      }

      // Generate AI cassette cover with varied styles using Nano Banana
      const cassetteCoverUrl = await generateSongCover({
        title: creation.title || 'My Song',
        tone: creation.tone || 'sweet',
        genre: creation.genre || 'pop',
        recipientName,
      });

      if (!cassetteCoverUrl) {
        throw new Error('Failed to generate cassette cover image');
      }

      // Download and upload to our storage
      const coverResponse = await fetch(cassetteCoverUrl);
      const coverBuffer = await coverResponse.arrayBuffer();
      const coverBase64 = Buffer.from(coverBuffer).toString('base64');
      
      const imageUrl = await objectStorageService.uploadBase64Image(
        coverBase64,
        `songs/${userId}`,
        'cassette-cover'
      );

      // Update the creation with new image
      await storage.updateCreation(creation.id, { imageUrl });

      console.log(`[Song] Cassette cover regenerated: ${imageUrl}`);
      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Error regenerating cassette cover:", error);
      res.status(500).json({ message: error.message || "Failed to regenerate cassette cover" });
    }
  });

  // Upload custom cover image for a song
  app.post('/api/creations/:id/upload-cover', isAuthenticated, upload.single('image'), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const creation = await storage.getCreationById(req.params.id);
      
      if (!creation) {
        return res.status(404).json({ message: "Song not found" });
      }

      if (creation.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (creation.type !== 'song') {
        return res.status(400).json({ message: "This feature is only available for songs" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      console.log(`[Song] Uploading custom cover for "${creation.title}"`);
      
      // Composite the user's photo into a cassette cover design
      console.log(`[Song] Compositing photo into cassette design...`);
      const compositedBuffer = await compositePhotoIntoCassette(req.file.buffer, {
        songTitle: creation.title || undefined
      });
      
      // Convert composited buffer to base64
      const base64Image = compositedBuffer.toString('base64');
      
      // Upload composited image to object storage
      const imageUrl = await objectStorageService.uploadBase64Image(
        base64Image,
        `songs/${userId}`,
        'cassette-cover'
      );

      // Update the creation with new image
      await storage.updateCreation(creation.id, { imageUrl });

      console.log(`[Song] Cassette cover with photo uploaded: ${imageUrl}`);
      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Error uploading custom cover:", error);
      res.status(500).json({ message: error.message || "Failed to upload custom cover" });
    }
  });

  // Update mixtape songs (swap/reorder songs)
  app.patch('/api/mixtapes/:id/songs', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const mixtape = await storage.getMixtapeById(req.params.id);
      
      if (!mixtape) {
        return res.status(404).json({ message: "Mixtape not found" });
      }

      if (mixtape.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { songIds } = req.body;
      
      if (!Array.isArray(songIds)) {
        return res.status(400).json({ message: "songIds must be an array" });
      }

      // Verify all songs exist and belong to the user
      for (const songId of songIds) {
        const song = await storage.getCreationById(songId);
        if (!song) {
          return res.status(400).json({ message: `Song ${songId} not found` });
        }
        if (song.userId !== userId) {
          return res.status(403).json({ message: `Song ${songId} does not belong to you` });
        }
      }

      // Update the mixtape with new song IDs
      const updated = await storage.updateMixtape(req.params.id, { songIds });
      
      console.log(`[Mixtape ${req.params.id}] Updated songs: ${songIds.join(', ')}`);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating mixtape songs:", error);
      res.status(500).json({ message: error.message || "Failed to update mixtape songs" });
    }
  });

  // Generate cassette case image for a mixtape (with optional custom image for compositing)
  app.post('/api/mixtapes/:id/generate-cassette-cover', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const mixtape = await storage.getMixtapeById(req.params.id);
      const { customImageUrl } = req.body;
      
      if (!mixtape) {
        return res.status(404).json({ message: "Mixtape not found" });
      }

      if (mixtape.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      console.log(`[Mixtape] Generating cassette case image for "${mixtape.title}"`);
      
      let cassetteCaseImageUrl: string;
      
      if (customImageUrl) {
        // Download custom image and composite with cassette template
        console.log(`[Mixtape ${mixtape.id}] Compositing custom image with cassette template`);
        const imageResponse = await fetch(customImageUrl);
        if (!imageResponse.ok) {
          return res.status(400).json({ message: "Failed to download custom image" });
        }
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const compositedBuffer = await compositePhotoIntoCassette(imageBuffer, {
          songTitle: mixtape.title,
          recipientName: mixtape.recipientName || 'Someone Special',
        });
        
        // Upload composited image
        const objectStorage = new ObjectStorageService();
        const filename = `mixtape-cassette-${mixtape.id}-${Date.now()}.png`;
        cassetteCaseImageUrl = await objectStorage.uploadBuffer(compositedBuffer, filename, 'image/png');
      } else {
        // AI generate cassette case image
        cassetteCaseImageUrl = await generateCassetteCaseImage({
          title: mixtape.title,
          recipientName: mixtape.recipientName || 'Someone Special',
          theme: mixtape.theme,
        });
      }

      // Update the mixtape with the generated image
      await storage.updateMixtape(mixtape.id, { cassetteCaseImageUrl });

      res.json({ cassetteCaseImageUrl });
    } catch (error: any) {
      console.error("Error generating cassette case image:", error);
      res.status(500).json({ message: error.message || "Failed to generate cassette case image" });
    }
  });

  // ========== STRIPE PAYMENT ROUTES ==========
  
  // Get Stripe publishable key
  app.get('/api/stripe/publishable-key', async (req: Request, res: Response) => {
    try {
      const { getStripePublishableKey } = await import('./stripeClient');
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      console.error('Error getting Stripe publishable key:', error);
      res.status(500).json({ message: 'Failed to get Stripe configuration' });
    }
  });

  // Get available products and prices from Stripe
  app.get('/api/stripe/products', async (req: Request, res: Response) => {
    try {
      const { sql } = await import('drizzle-orm');
      const { db } = await import('./db');
      
      const result = await db.execute(
        sql`
          SELECT 
            p.id as product_id,
            p.name as product_name,
            p.description as product_description,
            p.metadata as product_metadata,
            pr.id as price_id,
            pr.unit_amount,
            pr.currency,
            pr.recurring,
            pr.metadata as price_metadata
          FROM stripe.products p
          LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
          WHERE p.active = true
          ORDER BY pr.unit_amount
        `
      );
      
      const productsMap = new Map();
      for (const row of result.rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            metadata: row.price_metadata,
          });
        }
      }
      
      res.json({ products: Array.from(productsMap.values()) });
    } catch (error: any) {
      console.error('Error fetching Stripe products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  // Create checkout session for one-time purchase (Credit Pack)
  app.post('/api/stripe/checkout', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { priceId, mode } = req.body;
      const userId = (req.user as any).id;
      const userEmail = (req.user as any).email;
      
      if (!priceId) {
        return res.status(400).json({ message: 'Price ID is required' });
      }
      
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      
      // Get or create customer
      let customerId: string;
      const user = await storage.getUser(userId);
      
      if (user?.stripeCustomerId) {
        customerId = user.stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { userId },
        });
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }
      
      const baseUrl = getBaseUrl();
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: mode === 'subscription' ? 'subscription' : 'payment',
        success_url: `${baseUrl}/dashboard?payment=success`,
        cancel_url: `${baseUrl}/pricing?payment=cancelled`,
        metadata: { userId },
      });
      
      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ message: error.message || 'Failed to create checkout session' });
    }
  });

  // Admin-only: Seed Stripe products (creates products in current Stripe environment)
  app.post('/api/admin/seed-stripe-products', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      
      const createdProducts: string[] = [];
      const existingProducts = await stripe.products.list({ limit: 100 });
      const productNames = existingProducts.data.map(p => p.name);
      
      // Credit Pack
      if (!productNames.includes('Credit Pack')) {
        const creditPack = await stripe.products.create({
          name: 'Credit Pack',
          description: '5 songs + cover art - Perfect for a special occasion',
          metadata: { type: 'one_time', songs: '5' },
        });
        await stripe.prices.create({
          product: creditPack.id,
          unit_amount: 499,
          currency: 'usd',
          metadata: { plan: 'credit_pack' },
        });
        createdProducts.push('Credit Pack');
      }
      
      // Subscription
      if (!productNames.includes('Subscription')) {
        const subscription = await stripe.products.create({
          name: 'Subscription',
          description: '15 songs per month - For those who celebrate often',
          metadata: { type: 'subscription', songs_per_month: '15' },
        });
        await stripe.prices.create({
          product: subscription.id,
          unit_amount: 1000,
          currency: 'usd',
          recurring: { interval: 'month' },
          metadata: { plan: 'subscription' },
        });
        createdProducts.push('Subscription');
      }
      
      // Date Night Kit
      if (!productNames.includes('Date Night Kit')) {
        const dateNightKit = await stripe.products.create({
          name: 'Date Night Kit',
          description: '3 love songs + 3 covers - Perfect for romantic celebrations',
          metadata: { type: 'kit', songs: '3', covers: '3', theme: 'love' },
        });
        await stripe.prices.create({
          product: dateNightKit.id,
          unit_amount: 500,
          currency: 'usd',
          metadata: { plan: 'date_night_kit' },
        });
        createdProducts.push('Date Night Kit');
      }
      
      // Birthday Blast
      if (!productNames.includes('Birthday Blast')) {
        const birthdayBlast = await stripe.products.create({
          name: 'Birthday Blast',
          description: '1 birthday song + 1 visual animation',
          metadata: { type: 'kit', songs: '1', visuals: '1', theme: 'birthday' },
        });
        await stripe.prices.create({
          product: birthdayBlast.id,
          unit_amount: 250,
          currency: 'usd',
          metadata: { plan: 'birthday_blast' },
        });
        createdProducts.push('Birthday Blast');
      }
      
      // Gospel Greeting
      if (!productNames.includes('Gospel Greeting')) {
        const gospelGreeting = await stripe.products.create({
          name: 'Gospel Greeting',
          description: '2 spiritual messages + 2 images',
          metadata: { type: 'kit', songs: '2', images: '2', theme: 'spiritual' },
        });
        await stripe.prices.create({
          product: gospelGreeting.id,
          unit_amount: 300,
          currency: 'usd',
          metadata: { plan: 'gospel_greeting' },
        });
        createdProducts.push('Gospel Greeting');
      }
      
      // Classroom Cheers
      if (!productNames.includes('Classroom Cheers')) {
        const classroomCheers = await stripe.products.create({
          name: 'Classroom Cheers',
          description: '5 group songs for teachers & students',
          metadata: { type: 'kit', songs: '5', theme: 'education' },
        });
        await stripe.prices.create({
          product: classroomCheers.id,
          unit_amount: 500,
          currency: 'usd',
          metadata: { plan: 'classroom_cheers' },
        });
        createdProducts.push('Classroom Cheers');
      }
      
      res.json({ 
        message: createdProducts.length > 0 
          ? `Created ${createdProducts.length} products: ${createdProducts.join(', ')}`
          : 'All products already exist',
        created: createdProducts,
      });
    } catch (error: any) {
      console.error('Error seeding Stripe products:', error);
      res.status(500).json({ message: error.message || 'Failed to seed products' });
    }
  });

  // Customer portal for managing subscription
  app.post('/api/stripe/portal', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: 'No subscription found' });
      }
      
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      
      const baseUrl = getBaseUrl();
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/dashboard`,
      });
      
      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      res.status(500).json({ message: 'Failed to create portal session' });
    }
  });

  // Audio proxy endpoint for reliable audio streaming
  // Downloads full file then serves it to ensure complete delivery
  app.get('/api/audio/:creationId', async (req: Request, res: Response) => {
    try {
      const { creationId } = req.params;
      const creation = await storage.getCreationById(creationId);
      
      if (!creation || !creation.mediaUrl) {
        return res.status(404).json({ message: 'Audio not found' });
      }
      
      console.log(`[Audio Proxy] Fetching audio for creation ${creationId}`);
      
      // Fetch the entire audio file as a buffer
      const response = await fetch(creation.mediaUrl);
      
      if (!response.ok) {
        console.error(`[Audio Proxy] Failed to fetch: ${response.status}`);
        return res.status(502).json({ message: 'Failed to fetch audio' });
      }
      
      // Get the full audio as a buffer
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      console.log(`[Audio Proxy] Downloaded ${audioBuffer.length} bytes`);
      
      // Set headers for the response
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      
      // Send the complete buffer
      res.send(audioBuffer);
    } catch (error: any) {
      console.error('[Audio Proxy] Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to proxy audio' });
      }
    }
  });

  const httpServer = createServer(app);
  
  startScheduler(60000);
  
  return httpServer;
}

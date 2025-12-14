import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from 'passport';
import { z } from 'zod';
import { storage } from "./storage";
import { setupAuth, isAuthenticated, generateMagicLinkToken, verifyMagicLinkToken, hashPassword } from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { generateCardContent, generateCardImage, generateSongLyrics, generateSongCover } from "./openaiService";
import { generateGreetingCard, generateAnimation } from "./nanoBananaService";
import { sendMagicLinkEmail } from "./emailService";
import { insertLovedOneSchema, insertCreationSchema } from "@shared/schema";

const BASE_URL = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
  : 'http://localhost:5000';

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  const objectStorageService = new ObjectStorageService();

  // ========== AUTHENTICATION ROUTES ==========
  
  // Register with email/password
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      });
      
      const { email, password, firstName, lastName } = schema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
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
        user = await storage.createUser({ email });
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

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
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

  // Generate AI Animation (using Nano Banana API)
  app.post('/api/generate/animation', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { lovedOneId, tone, occasion, style, description } = req.body;
      
      if (!process.env.NANO_BANANA_API_KEY) {
        return res.status(400).json({ message: "Animation generation requires Nano Banana API key" });
      }
      
      let lovedOne;
      if (lovedOneId) {
        lovedOne = await storage.getLovedOneById(lovedOneId);
      }

      const recipientName = lovedOne?.name || req.body.recipientName || "someone special";

      console.log('[Animation] Using Nano Banana API for animation generation');
      const nanoBananaImageUrl = await generateAnimation({
        recipientName,
        occasion: occasion || "celebration",
        style: style || `${tone || 'sweet'}, colorful, animated style`,
        description,
      });

      // Download the temporary image and upload to our storage
      console.log('[Animation] Downloading Nano Banana image and uploading to storage...');
      const imageResponse = await fetch(nanoBananaImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      
      const imageUrl = await objectStorageService.uploadBase64Image(
        imageBase64,
        `animations/${userId}`,
        'animation'
      );
      console.log('[Animation] Image uploaded to storage:', imageUrl);

      const creation = await storage.createCreation({
        userId,
        lovedOneId: lovedOneId || null,
        type: 'animation',
        tone: tone || 'sweet',
        title: `Animation for ${recipientName}`,
        content: description || `A celebration animation for ${occasion || 'a special occasion'}`,
        imageUrl,
      });
      
      const shareableLink = `animation-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const updatedCreation = await storage.updateCreation(creation.id, { shareableLink });

      res.json(updatedCreation || creation);
    } catch (error: any) {
      console.error("Error generating animation:", error);
      res.status(500).json({ message: error.message || "Failed to generate animation" });
    }
  });

  // Generate Lyrics Preview Only (fast, no song creation)
  app.post('/api/generate/lyrics-preview', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { lovedOneId, tone, genre, occasion, recipientName, relationship, additionalNotes } = req.body;
      
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
        additionalNotes: additionalNotes || undefined,
      });

      res.json(lyrics);
    } catch (error: any) {
      console.error("Error generating lyrics preview:", error);
      res.status(500).json({ message: error.message || "Failed to generate lyrics" });
    }
  });

  // Generate AI Song with Custom Lyrics
  app.post('/api/generate/song-with-lyrics', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { lovedOneId, tone, genre, title, lyrics, additionalNotes } = req.body;
      
      if (!lyrics || !title) {
        return res.status(400).json({ message: "Lyrics and title are required" });
      }

      const { generateSongWithLyrics } = await import('./sunoService');
      
      const songResult = await generateSongWithLyrics({
        title,
        lyrics,
        tone: tone || "sweet",
        genre: genre || "pop",
        additionalNotes: additionalNotes || undefined,
      });

      let coverImageUrl = songResult.coverImage;
      
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

      const creation = await storage.createCreation({
        userId,
        lovedOneId: lovedOneId || null,
        type: 'song',
        tone: tone || 'sweet',
        genre: genre || 'pop',
        title: songResult.title,
        content: songResult.lyrics,
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

  // Generate AI Song
  app.post('/api/generate/song', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { lovedOneId, tone, genre, occasion } = req.body;
      
      let lovedOne;
      if (lovedOneId) {
        lovedOne = await storage.getLovedOneById(lovedOneId);
      }

      const { generateSong } = await import('./sunoService');
      
      const songResult = await generateSong({
        recipientName: lovedOne?.name || req.body.recipientName || "someone special",
        relationship: lovedOne?.relationship || req.body.relationship || "friend",
        occasion,
        tone: tone || "sweet",
        genre: genre || "pop",
        interests: lovedOne?.interests || undefined,
        insideJokes: lovedOne?.insideJokes || undefined,
      });

      let coverImageUrl = songResult.coverImage;
      
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

      const creation = await storage.createCreation({
        userId,
        lovedOneId: lovedOneId || null,
        type: 'song',
        tone: tone || 'sweet',
        genre: genre || 'pop',
        title: songResult.title,
        content: songResult.lyrics,
        imageUrl: coverImageUrl || null,
        mediaUrl: songResult.audioUrl,
      });
      
      const shareableLink = `song-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const updatedCreation = await storage.updateCreation(creation.id, { shareableLink });

      res.json(updatedCreation || creation);
    } catch (error: any) {
      console.error("Error generating song:", error);
      res.status(500).json({ message: error.message || "Failed to generate song" });
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
  };

  // Generate Mixtape (creates multiple songs)
  app.post('/api/generate/mixtape', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { 
        lovedOneId, theme, recipientName, relationship,
        genre1, tone1, notes1,
        genre2, tone2, notes2,
        genre3, tone3, notes3
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

      let lovedOne;
      if (lovedOneId) {
        lovedOne = await storage.getLovedOneById(lovedOneId);
      }

      const recipient = lovedOne?.name || recipientName || "someone special";
      const recipientRelationship = lovedOne?.relationship || relationship || "friend";

      // Create mixtape record first with pending status
      const themeConfig = MIXTAPE_THEMES[theme];
      const themeTitle = theme.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      const mixtape = await storage.createMixtape({
        userId,
        lovedOneId: lovedOneId || null,
        title: `${themeTitle} Mixtape for ${recipient}`,
        theme,
        recipientName: recipient,
        songIds: [],
        status: 'generating',
      });

      // Generate songs sequentially (Suno API needs time)
      const { generateSong } = await import('./sunoService');
      const songIds: string[] = [];

      for (let i = 0; i < themeConfig.songs.length; i++) {
        const songConfig = themeConfig.songs[i];
        const songGenre = genres[i];
        const songTone = tones[i];
        const songNotes = notes[i];
        try {
          // Use user-selected genre, tone, and notes for each song
          const songResult = await generateSong({
            recipientName: recipient,
            relationship: recipientRelationship,
            occasion: songConfig.occasion,
            tone: songTone, // User-selected tone for this specific song
            genre: songGenre, // User-selected genre for this specific song
            interests: lovedOne?.interests || undefined,
            insideJokes: lovedOne?.insideJokes || undefined,
            additionalNotes: songNotes || undefined, // User notes for this song
          });

          let coverImageUrl = songResult.coverImage;
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

          const creation = await storage.createCreation({
            userId,
            lovedOneId: lovedOneId || null,
            type: 'song',
            tone: songTone, // User-selected tone for this specific song
            genre: songGenre, // User-selected genre for this specific song
            title: songResult.title,
            content: songResult.lyrics,
            imageUrl: coverImageUrl || null,
            mediaUrl: songResult.audioUrl,
          });

          const shareableLink = `song-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          await storage.updateCreation(creation.id, { shareableLink });
          songIds.push(creation.id);

          console.log(`[Mixtape] Generated song ${songIds.length}/${themeConfig.songs.length}: ${songResult.title}`);
        } catch (songError: any) {
          console.error(`[Mixtape] Error generating song:`, songError.message);
          // Continue with next song even if one fails
        }
      }

      // Update mixtape with generated song IDs
      const updatedMixtape = await storage.updateMixtape(mixtape.id, {
        songIds,
        status: songIds.length > 0 ? 'complete' : 'failed',
      });

      // Fetch the songs to include in response
      const songs = await Promise.all(
        songIds.map(id => storage.getCreationById(id))
      );

      res.json({
        mixtape: updatedMixtape,
        songs: songs.filter(Boolean),
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

      // Fetch all songs in the mixtape
      const songs = await Promise.all(
        (mixtape.songIds || []).map(id => storage.getCreationById(id))
      );

      res.json({
        mixtape,
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

  const httpServer = createServer(app);
  return httpServer;
}

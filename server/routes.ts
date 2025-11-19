import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from 'passport';
import { z } from 'zod';
import { storage } from "./storage";
import { setupAuth, isAuthenticated, generateMagicLinkToken, verifyMagicLinkToken, hashPassword } from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { generateCardContent, generateCardImage, generateSongLyrics, generateSongCover } from "./openaiService";
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
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed after registration' });
        }
        res.json(user);
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
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed' });
        }
        res.json(user);
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
      const magicLink = `${BASE_URL}/auth/verify-magic-link?token=${token}`;
      
      await sendMagicLinkEmail(email, magicLink);
      
      res.json({ message: 'Magic link sent to your email' });
    } catch (error: any) {
      console.error("Magic link error:", error);
      res.status(400).json({ message: error.message || 'Failed to send magic link' });
    }
  });

  // Verify magic link
  app.get('/api/auth/verify-magic-link', async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      
      if (!token) {
        return res.status(400).json({ message: 'Token required' });
      }
      
      const payload = verifyMagicLinkToken(token);
      
      if (!payload) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      
      const user = await storage.getUserByEmail(payload.email);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed' });
        }
        res.json(user);
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
      passport.authenticate('google', { failureRedirect: '/' }),
      (req: Request, res: Response) => {
        res.redirect('/dashboard');
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

  // Generate AI Card
  app.post('/api/generate/card', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { lovedOneId, tone, occasion } = req.body;
      
      let lovedOne;
      if (lovedOneId) {
        lovedOne = await storage.getLovedOneById(lovedOneId);
      }

      const cardContent = await generateCardContent({
        recipientName: lovedOne?.name || req.body.recipientName || "someone special",
        relationship: lovedOne?.relationship || req.body.relationship || "friend",
        occasion,
        tone: tone || "sweet",
        interests: lovedOne?.interests || undefined,
        insideJokes: lovedOne?.insideJokes || undefined,
      });

      const cardImageBase64 = await generateCardImage({
        occasion,
        tone: tone || "sweet",
        recipientName: lovedOne?.name || req.body.recipientName || "someone special",
      });

      const imageUrl = await objectStorageService.uploadBase64Image(
        cardImageBase64,
        `cards/${userId}`,
        'card'
      );

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
      await storage.updateCreation(creation.id, { shareableLink });

      res.json(creation);
    } catch (error: any) {
      console.error("Error generating card:", error);
      res.status(500).json({ message: error.message || "Failed to generate card" });
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

      const songLyrics = await generateSongLyrics({
        recipientName: lovedOne?.name || req.body.recipientName || "someone special",
        relationship: lovedOne?.relationship || req.body.relationship || "friend",
        occasion,
        tone: tone || "sweet",
        genre: genre || "pop",
        interests: lovedOne?.interests || undefined,
        insideJokes: lovedOne?.insideJokes || undefined,
      });

      const coverImageBase64 = await generateSongCover({
        title: songLyrics.title,
        genre: genre || "pop",
        tone: tone || "sweet",
      });

      const imageUrl = await objectStorageService.uploadBase64Image(
        coverImageBase64,
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
        imageUrl,
      });
      
      const shareableLink = `song-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await storage.updateCreation(creation.id, { shareableLink });

      res.json(creation);
    } catch (error: any) {
      console.error("Error generating song:", error);
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

  const httpServer = createServer(app);
  return httpServer;
}

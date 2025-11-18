// From blueprint:javascript_log_in_with_replit and custom implementation
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { generateCardContent, generateCardImage, generateSongLyrics, generateSongCover } from "./openaiService";
import { insertLovedOneSchema, insertCreationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  const objectStorageService = new ObjectStorageService();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Loved Ones routes
  app.get('/api/loved-ones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lovedOnes = await storage.getLovedOnesByUserId(userId);
      res.json(lovedOnes);
    } catch (error) {
      console.error("Error fetching loved ones:", error);
      res.status(500).json({ message: "Failed to fetch loved ones" });
    }
  });

  app.post('/api/loved-ones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertLovedOneSchema.parse({ ...req.body, userId });
      const lovedOne = await storage.createLovedOne(validatedData);
      res.json(lovedOne);
    } catch (error: any) {
      console.error("Error creating loved one:", error);
      res.status(400).json({ message: error.message || "Failed to create loved one" });
    }
  });

  app.put('/api/loved-ones/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.delete('/api/loved-ones/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Creation routes
  app.get('/api/creations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const creations = await storage.getCreationsByUserId(userId);
      res.json(creations);
    } catch (error) {
      console.error("Error fetching creations:", error);
      res.status(500).json({ message: "Failed to fetch creations" });
    }
  });

  // Generate AI Card
  app.post('/api/generate/card', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
        interests: lovedOne?.interests,
        insideJokes: lovedOne?.insideJokes,
      });

      const imageBuffer = await generateCardImage({
        recipientName: lovedOne?.name || req.body.recipientName || "someone special",
        occasion,
        tone: tone || "sweet",
      });

      const imageUrl = await objectStorageService.uploadBuffer(imageBuffer, 'card', 'image/png');

      const creation = await storage.createCreation({
        userId,
        lovedOneId: lovedOneId || undefined,
        type: 'card',
        tone: tone || 'sweet',
        genre: undefined,
        title: cardContent.title,
        content: cardContent.message,
        imageUrl,
        mediaUrl: undefined,
      });

      res.json(creation);
    } catch (error: any) {
      console.error("Error generating card:", error);
      res.status(500).json({ message: error.message || "Failed to generate card" });
    }
  });

  // Generate AI Song
  app.post('/api/generate/song', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { lovedOneId, tone, genre, occasion } = req.body;
      
      let lovedOne;
      if (lovedOneId) {
        lovedOne = await storage.getLovedOneById(lovedOneId);
      }

      const songData = await generateSongLyrics({
        recipientName: lovedOne?.name || req.body.recipientName || "someone special",
        relationship: lovedOne?.relationship || req.body.relationship || "friend",
        occasion,
        tone: tone || "sweet",
        genre: genre || "pop",
        interests: lovedOne?.interests,
        insideJokes: lovedOne?.insideJokes,
      });

      const coverBuffer = await generateSongCover({
        title: songData.title,
        tone: tone || "sweet",
        genre: genre || "pop",
      });

      const coverUrl = await objectStorageService.uploadBuffer(coverBuffer, 'song-cover', 'image/png');

      const creation = await storage.createCreation({
        userId,
        lovedOneId: lovedOneId || undefined,
        type: 'song',
        tone: tone || 'sweet',
        genre: genre || 'pop',
        title: songData.title,
        content: songData.lyrics,
        imageUrl: coverUrl,
        mediaUrl: undefined,
      });

      res.json(creation);
    } catch (error: any) {
      console.error("Error generating song:", error);
      res.status(500).json({ message: error.message || "Failed to generate song" });
    }
  });

  // Public object serving
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public shareable creation view
  app.get('/share/:link', async (req, res) => {
    try {
      const creation = await storage.getCreationByShareableLink(`/share/${req.params.link}`);
      if (!creation) {
        return res.status(404).send('Creation not found');
      }
      // Return a simple HTML page with the creation details
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${creation.title || 'Heartbeat Studio Creation'}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; text-align: center; }
            img { max-width: 100%; border-radius: 12px; margin: 20px 0; }
            h1 { color: #dc2626; }
            .content { white-space: pre-wrap; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>${creation.title}</h1>
          ${creation.imageUrl ? `<img src="${creation.imageUrl}" alt="${creation.title}" />` : ''}
          <div class="content">${creation.content}</div>
          <p style="color: #666; margin-top: 40px;">Created with ❤️ by Horton's Tech Innovations</p>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error fetching shared creation:", error);
      res.status(500).send('Error loading creation');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

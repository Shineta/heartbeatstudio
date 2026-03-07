// From blueprint:javascript_log_in_with_replit and custom implementation
import {
  users,
  lovedOnes,
  creations,
  magicLinkTokens,
  mixtapes,
  scheduledDeliveries,
  songPreviews,
  assetTasks,
  type User,
  type UpsertUser,
  type LovedOne,
  type InsertLovedOne,
  type Creation,
  type InsertCreation,
  type MagicLinkToken,
  type InsertMagicLinkToken,
  type Mixtape,
  type InsertMixtape,
  type ScheduledDelivery,
  type InsertScheduledDelivery,
  type SongPreview,
  type InsertSongPreview,
  type AssetTask,
  type InsertAssetTask,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: Partial<UpsertUser>): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Magic link token operations
  createMagicLinkToken(token: InsertMagicLinkToken): Promise<MagicLinkToken>;
  getMagicLinkToken(token: string): Promise<MagicLinkToken | undefined>;
  markMagicLinkTokenAsUsed(token: string): Promise<void>;
  
  // Loved ones operations
  getLovedOnesByUserId(userId: string): Promise<LovedOne[]>;
  getLovedOneById(id: string): Promise<LovedOne | undefined>;
  createLovedOne(lovedOne: InsertLovedOne): Promise<LovedOne>;
  updateLovedOne(id: string, lovedOne: Partial<InsertLovedOne>): Promise<LovedOne | undefined>;
  deleteLovedOne(id: string): Promise<void>;
  
  // Creation operations
  getCreationsByUserId(userId: string): Promise<Creation[]>;
  getCreationById(id: string): Promise<Creation | undefined>;
  getCreationByShareableLink(link: string): Promise<Creation | undefined>;
  createCreation(creation: InsertCreation): Promise<Creation>;
  updateCreation(id: string, creation: Partial<InsertCreation>): Promise<Creation | undefined>;
  deleteCreation(id: string): Promise<void>;
  
  // Mixtape operations
  getMixtapesByUserId(userId: string): Promise<Mixtape[]>;
  getMixtapeById(id: string): Promise<Mixtape | undefined>;
  getMixtapeByShareableLink(link: string): Promise<Mixtape | undefined>;
  createMixtape(mixtape: InsertMixtape): Promise<Mixtape>;
  updateMixtape(id: string, mixtape: Partial<InsertMixtape>): Promise<Mixtape | undefined>;
  
  // Scheduled delivery operations
  getScheduledDeliveriesByUserId(userId: string): Promise<ScheduledDelivery[]>;
  getScheduledDeliveryById(id: string): Promise<ScheduledDelivery | undefined>;
  getPendingScheduledDeliveries(): Promise<ScheduledDelivery[]>;
  createScheduledDelivery(delivery: InsertScheduledDelivery): Promise<ScheduledDelivery>;
  updateScheduledDelivery(id: string, delivery: Partial<ScheduledDelivery>): Promise<ScheduledDelivery | undefined>;
  cancelScheduledDelivery(id: string): Promise<void>;
  
  // Song preview operations (Try it now feature)
  createSongPreview(preview: InsertSongPreview): Promise<SongPreview>;
  getSongPreviewById(id: string): Promise<SongPreview | undefined>;
  getSongPreviewBySessionToken(token: string): Promise<SongPreview | undefined>;
  getSongPreviewsByUserId(userId: string): Promise<SongPreview[]>;
  claimSongPreview(previewId: string, userId: string): Promise<SongPreview | undefined>;
  deleteSongPreview(previewId: string): Promise<void>;

  // Asset task operations (text-to-video)
  createAssetTask(task: InsertAssetTask): Promise<AssetTask>;
  getAssetTaskById(id: string): Promise<AssetTask | undefined>;
  getAssetTasksByUserId(userId: string): Promise<AssetTask[]>;
  updateAssetTask(id: string, task: Partial<InsertAssetTask>): Promise<AssetTask | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db.insert(users).values(userData as any).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Magic link token operations
  async createMagicLinkToken(tokenData: InsertMagicLinkToken): Promise<MagicLinkToken> {
    const [token] = await db.insert(magicLinkTokens).values(tokenData).returning();
    return token;
  }

  async getMagicLinkToken(token: string): Promise<MagicLinkToken | undefined> {
    const [tokenData] = await db.select().from(magicLinkTokens).where(eq(magicLinkTokens.token, token));
    return tokenData;
  }

  async markMagicLinkTokenAsUsed(token: string): Promise<void> {
    await db.update(magicLinkTokens)
      .set({ used: true })
      .where(eq(magicLinkTokens.token, token));
  }

  // Loved ones operations
  async getLovedOnesByUserId(userId: string): Promise<LovedOne[]> {
    return await db
      .select()
      .from(lovedOnes)
      .where(eq(lovedOnes.userId, userId))
      .orderBy(desc(lovedOnes.createdAt));
  }

  async getLovedOneById(id: string): Promise<LovedOne | undefined> {
    const [lovedOne] = await db.select().from(lovedOnes).where(eq(lovedOnes.id, id));
    return lovedOne;
  }

  async createLovedOne(lovedOne: InsertLovedOne): Promise<LovedOne> {
    const [created] = await db.insert(lovedOnes).values(lovedOne).returning();
    return created;
  }

  async updateLovedOne(id: string, lovedOne: Partial<InsertLovedOne>): Promise<LovedOne | undefined> {
    const [updated] = await db
      .update(lovedOnes)
      .set({ ...lovedOne, updatedAt: new Date() })
      .where(eq(lovedOnes.id, id))
      .returning();
    return updated;
  }

  async deleteLovedOne(id: string): Promise<void> {
    await db.delete(lovedOnes).where(eq(lovedOnes.id, id));
  }

  // Creation operations
  async getCreationsByUserId(userId: string): Promise<Creation[]> {
    return await db
      .select()
      .from(creations)
      .where(eq(creations.userId, userId))
      .orderBy(desc(creations.createdAt));
  }

  async getCreationById(id: string): Promise<Creation | undefined> {
    const [creation] = await db.select().from(creations).where(eq(creations.id, id));
    return creation;
  }

  async getCreationByShareableLink(link: string): Promise<Creation | undefined> {
    // Normalize the link - extract just the token ID
    let shortId = link;
    
    // Strip any URL components
    if (shortId.includes('://')) {
      try {
        const url = new URL(shortId);
        shortId = url.pathname;
      } catch {
        // Not a valid URL, continue with what we have
      }
    }
    
    // Remove /share/ prefix variations
    shortId = shortId.replace(/^\/share\//, '').replace(/^share\//, '').replace(/^\//, '');
    
    // Also handle animation- prefix links stored directly
    const fullPath = `/share/${shortId}`;
    
    console.log(`[Storage] Looking up shareable link: original="${link}", shortId="${shortId}", fullPath="${fullPath}"`);
    
    // Try full path first (how it's stored in DB)
    let [creation] = await db.select().from(creations).where(eq(creations.shareableLink, fullPath));
    if (creation) {
      console.log(`[Storage] Found by fullPath: ${creation.id}`);
      return creation;
    }
    
    // Fall back to short ID in case of legacy data
    [creation] = await db.select().from(creations).where(eq(creations.shareableLink, shortId));
    if (creation) {
      console.log(`[Storage] Found by shortId: ${creation.id}`);
      return creation;
    }
    
    // Also try with animation- prefix for animation links
    if (shortId.startsWith('animation-')) {
      [creation] = await db.select().from(creations).where(eq(creations.shareableLink, shortId));
      if (creation) return creation;
      
      [creation] = await db.select().from(creations).where(eq(creations.shareableLink, fullPath));
      if (creation) return creation;
    }
    
    console.log(`[Storage] No creation found for link: ${link}`);
    return undefined;
  }

  async createCreation(creation: InsertCreation): Promise<Creation> {
    // Use the provided shareableLink if present, otherwise generate one
    const shareableLink = creation.shareableLink || `/share/${Math.random().toString(36).substring(2, 15)}`;
    const [created] = await db
      .insert(creations)
      .values({ ...creation, shareableLink })
      .returning();
    return created;
  }

  async updateCreation(id: string, creation: Partial<InsertCreation>): Promise<Creation | undefined> {
    const [updated] = await db
      .update(creations)
      .set({ ...creation, updatedAt: new Date() })
      .where(eq(creations.id, id))
      .returning();
    return updated;
  }

  async deleteCreation(id: string): Promise<void> {
    await db.delete(creations).where(eq(creations.id, id));
  }

  // Mixtape operations
  async getMixtapesByUserId(userId: string): Promise<Mixtape[]> {
    return await db
      .select()
      .from(mixtapes)
      .where(eq(mixtapes.userId, userId))
      .orderBy(desc(mixtapes.createdAt));
  }

  async getMixtapeById(id: string): Promise<Mixtape | undefined> {
    const [mixtape] = await db.select().from(mixtapes).where(eq(mixtapes.id, id));
    return mixtape;
  }

  async getMixtapeByShareableLink(link: string): Promise<Mixtape | undefined> {
    const [mixtape] = await db.select().from(mixtapes).where(eq(mixtapes.shareableLink, link));
    return mixtape;
  }

  async createMixtape(mixtape: InsertMixtape): Promise<Mixtape> {
    const shareableLink = `mixtape-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const [created] = await db
      .insert(mixtapes)
      .values({ ...mixtape, shareableLink })
      .returning();
    return created;
  }

  async updateMixtape(id: string, mixtape: Partial<InsertMixtape>): Promise<Mixtape | undefined> {
    const [updated] = await db
      .update(mixtapes)
      .set({ ...mixtape, updatedAt: new Date() })
      .where(eq(mixtapes.id, id))
      .returning();
    return updated;
  }

  // Scheduled delivery operations
  async getScheduledDeliveriesByUserId(userId: string): Promise<ScheduledDelivery[]> {
    return await db
      .select()
      .from(scheduledDeliveries)
      .where(eq(scheduledDeliveries.userId, userId))
      .orderBy(desc(scheduledDeliveries.scheduledAt));
  }

  async getScheduledDeliveryById(id: string): Promise<ScheduledDelivery | undefined> {
    const [delivery] = await db.select().from(scheduledDeliveries).where(eq(scheduledDeliveries.id, id));
    return delivery;
  }

  async getPendingScheduledDeliveries(): Promise<ScheduledDelivery[]> {
    const now = new Date();
    return await db
      .select()
      .from(scheduledDeliveries)
      .where(and(
        eq(scheduledDeliveries.status, 'pending'),
        lte(scheduledDeliveries.scheduledAt, now)
      ));
  }

  async createScheduledDelivery(delivery: InsertScheduledDelivery): Promise<ScheduledDelivery> {
    const [created] = await db.insert(scheduledDeliveries).values(delivery).returning();
    return created;
  }

  async updateScheduledDelivery(id: string, delivery: Partial<ScheduledDelivery>): Promise<ScheduledDelivery | undefined> {
    const [updated] = await db
      .update(scheduledDeliveries)
      .set({ ...delivery, updatedAt: new Date() })
      .where(eq(scheduledDeliveries.id, id))
      .returning();
    return updated;
  }

  async cancelScheduledDelivery(id: string): Promise<void> {
    await db
      .update(scheduledDeliveries)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(scheduledDeliveries.id, id));
  }

  // Song preview operations (Try it now feature)
  async createSongPreview(preview: InsertSongPreview): Promise<SongPreview> {
    const [created] = await db.insert(songPreviews).values(preview).returning();
    return created;
  }

  async getSongPreviewById(id: string): Promise<SongPreview | undefined> {
    const [preview] = await db.select().from(songPreviews).where(eq(songPreviews.id, id));
    return preview;
  }

  async getSongPreviewBySessionToken(token: string): Promise<SongPreview | undefined> {
    const [preview] = await db
      .select()
      .from(songPreviews)
      .where(and(
        eq(songPreviews.sessionToken, token),
        eq(songPreviews.claimed, false)
      ));
    return preview;
  }

  async getSongPreviewsByUserId(userId: string): Promise<SongPreview[]> {
    return await db
      .select()
      .from(songPreviews)
      .where(eq(songPreviews.userId, userId))
      .orderBy(desc(songPreviews.createdAt));
  }

  async claimSongPreview(previewId: string, userId: string): Promise<SongPreview | undefined> {
    const [updated] = await db
      .update(songPreviews)
      .set({ userId, claimed: true })
      .where(eq(songPreviews.id, previewId))
      .returning();
    return updated;
  }

  async deleteSongPreview(previewId: string): Promise<void> {
    await db.delete(songPreviews).where(eq(songPreviews.id, previewId));
  }

  async createAssetTask(task: InsertAssetTask): Promise<AssetTask> {
    const [created] = await db.insert(assetTasks).values(task).returning();
    return created;
  }

  async getAssetTaskById(id: string): Promise<AssetTask | undefined> {
    const [task] = await db.select().from(assetTasks).where(eq(assetTasks.id, id));
    return task;
  }

  async getAssetTasksByUserId(userId: string): Promise<AssetTask[]> {
    return db.select().from(assetTasks).where(eq(assetTasks.userId, userId)).orderBy(desc(assetTasks.createdAt));
  }

  async updateAssetTask(id: string, task: Partial<InsertAssetTask>): Promise<AssetTask | undefined> {
    const [updated] = await db.update(assetTasks).set({ ...task, updatedAt: new Date() }).where(eq(assetTasks.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();

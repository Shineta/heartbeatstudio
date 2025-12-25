// From blueprint:javascript_log_in_with_replit and custom implementation
import {
  users,
  lovedOnes,
  creations,
  magicLinkTokens,
  mixtapes,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
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

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
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
    const [creation] = await db.select().from(creations).where(eq(creations.shareableLink, link));
    return creation;
  }

  async createCreation(creation: InsertCreation): Promise<Creation> {
    const shareableLink = `/share/${Math.random().toString(36).substring(2, 15)}`;
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
}

export const storage = new DatabaseStorage();

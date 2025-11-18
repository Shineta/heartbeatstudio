// From blueprint:javascript_log_in_with_replit and custom implementation
import {
  users,
  lovedOnes,
  creations,
  type User,
  type UpsertUser,
  type LovedOne,
  type InsertLovedOne,
  type Creation,
  type InsertCreation,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
}

export const storage = new DatabaseStorage();

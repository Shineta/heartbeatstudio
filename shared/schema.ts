import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (supports custom auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // hashed password for email/password auth (null for OAuth-only users)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id").unique(), // for Google OAuth
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Magic link tokens table for passwordless authentication
export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;

// Loved ones profiles
export const lovedOnes = pgTable("loved_ones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  nickname: varchar("nickname"),
  relationship: varchar("relationship").notNull(),
  birthday: varchar("birthday"), // stored as MM-DD format
  interests: text("interests"), // comma-separated or JSON
  insideJokes: text("inside_jokes"),
  avatarUrl: varchar("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLovedOneSchema = createInsertSchema(lovedOnes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLovedOne = z.infer<typeof insertLovedOneSchema>;
export type LovedOne = typeof lovedOnes.$inferSelect;

// Creations (songs, cards, animations)
export const creations = pgTable("creations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  lovedOneId: varchar("loved_one_id").references(() => lovedOnes.id, { onDelete: 'set null' }),
  type: varchar("type").notNull(), // 'song', 'card', 'animation'
  tone: varchar("tone"), // 'sweet', 'funny', 'romantic', 'inspirational'
  genre: varchar("genre"), // for songs
  title: varchar("title"),
  content: text("content"), // AI-generated content (lyrics, message, etc.)
  imageUrl: varchar("image_url"), // card image or song cover
  mediaUrl: varchar("media_url"), // for future audio/video
  shareableLink: varchar("shareable_link").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCreationSchema = createInsertSchema(creations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  shareableLink: true,
});

export type InsertCreation = z.infer<typeof insertCreationSchema>;
export type Creation = typeof creations.$inferSelect;

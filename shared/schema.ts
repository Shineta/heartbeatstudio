import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
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
  phoneNumber: varchar("phone_number").unique(), // required for signup to prevent multiple accounts
  password: varchar("password"), // hashed password for email/password auth (null for OAuth-only users)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  brandName: varchar("brand_name"), // business/brand name for professional users (e.g., "Horton's Tech Innovations")
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id").unique(), // for Google OAuth
  stripeCustomerId: varchar("stripe_customer_id"), // Stripe customer ID for payments
  songsRemaining: integer("songs_remaining").notNull().default(3), // Free tier: 3 songs, Credit Pack: +5, Subscription: 25/month
  subscriptionStatus: varchar("subscription_status"), // 'active', 'canceled', 'past_due', null for non-subscribers
  subscriptionEndsAt: timestamp("subscription_ends_at"), // When current subscription period ends
  isAdmin: boolean("is_admin").notNull().default(false), // Admin accounts bypass payment requirements
  marketingConsent: boolean("marketing_consent").notNull().default(false), // User consent to receive promotional emails/SMS
  termsAcceptedAt: timestamp("terms_accepted_at"), // Timestamp when user agreed to Terms of Service
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
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type InsertMagicLinkToken = typeof magicLinkTokens.$inferInsert;

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
  songIds: text("song_ids").array(), // attached song IDs for cards
  shareableLink: varchar("shareable_link").unique(),
  status: varchar("status").default('ready'), // 'generating', 'ready', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCreationSchema = createInsertSchema(creations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCreationSchema = insertCreationSchema.partial();

export type InsertCreation = z.infer<typeof insertCreationSchema>;
export type Creation = typeof creations.$inferSelect;

// Mixtapes (collection of songs for a theme)
export const mixtapes = pgTable("mixtapes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  lovedOneId: varchar("loved_one_id").references(() => lovedOnes.id, { onDelete: 'set null' }),
  title: varchar("title").notNull(),
  theme: varchar("theme").notNull(), // 'wedding', 'anniversary', 'birthday-party', 'romantic-evening', 'friendship'
  recipientName: varchar("recipient_name"),
  songIds: text("song_ids").array(), // array of creation IDs
  shareableLink: varchar("shareable_link").unique(),
  cassetteCaseImageUrl: varchar("cassette_case_image_url"), // AI-generated cassette case cover
  status: varchar("status").notNull().default('pending'), // 'pending', 'generating', 'complete', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMixtapeSchema = createInsertSchema(mixtapes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMixtape = z.infer<typeof insertMixtapeSchema>;
export type Mixtape = typeof mixtapes.$inferSelect;

// Scheduled deliveries for songs/cards/animations
export const scheduledDeliveries = pgTable("scheduled_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  creationId: varchar("creation_id").notNull().references(() => creations.id, { onDelete: 'cascade' }),
  recipientEmail: varchar("recipient_email"),
  recipientPhone: varchar("recipient_phone"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  deliveredAt: timestamp("delivered_at"),
  status: varchar("status").notNull().default('pending'), // 'pending', 'sent', 'failed', 'cancelled'
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScheduledDeliverySchema = createInsertSchema(scheduledDeliveries).omit({
  id: true,
  deliveredAt: true,
  failureReason: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertScheduledDelivery = z.infer<typeof insertScheduledDeliverySchema>;
export type ScheduledDelivery = typeof scheduledDeliveries.$inferSelect;

# Heartbeat Studio

**Local Development Guide**: See [SETUP.md](./SETUP.md) for detailed setup instructions.

## Overview

Heartbeat Studio is an AI-powered celebration platform that helps users create personalized gifts for loved ones. The application enables users to generate AI songs, greeting cards, and animations, then schedule and deliver them at meaningful moments. Built as a full-stack TypeScript application, it combines emotional design principles with AI generation capabilities to make celebrating others effortless and joyful.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript using Vite as the build tool
- Client-side routing via Wouter for lightweight navigation
- Form management using React Hook Form with Zod validation
- UI state and server data managed through TanStack Query (React Query)

**UI Component Strategy**
- Shadcn/ui component library (New York style variant) with Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Design system emphasizes warm, joyful aesthetics inspired by Canva, Instagram, and Notion
- Typography: Inter (primary) and Fredoka (accent/celebratory moments)
- Responsive grid patterns: 1-column mobile, 2-3 columns tablet/desktop

**Key Application Flows**
- Landing page for unauthenticated users with feature showcase
- Dashboard view for authenticated users showing loved ones, upcoming celebrations, and creation stats
- Creation wizard for generating AI content (songs, cards, animations) with step-by-step guidance
- Authentication-gated routes that redirect to landing or login as needed

**Experience Kits**
- Date Night Experience: 3 romantic songs with emotional progression
- Birthday Blast Experience: 5 personalized birthday songs
- Gospel Greeting Experience: 2 gospel-inspired audio messages with scripture
- Classroom Cheers Experience: 5 group songs for students and educators
- Sung Prayer Experience: 3-part biblical prayer structure (Thanksgiving, Declaration, Promises)

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript
- RESTful API design with `/api/*` routes
- Session-based authentication using Passport.js with OpenID Connect

**Authentication System**
- Custom authentication with Passport.js supporting three methods:
  1. Email/Password with bcrypt hashing
  2. Passwordless Magic Links via SendGrid and JWT
  3. Google OAuth 2.0
- Session storage in PostgreSQL using connect-pg-simple
- Production-grade security measures:
  - Required SESSION_SECRET (throws error if missing)
  - Session regeneration on all auth flows to prevent session fixation attacks
  - One-time use magic link tokens (marked as "used" in database)
  - Secure httpOnly cookies
  - Client-side cache clearing on logout
- Authentication middleware (`isAuthenticated`) protects sensitive routes

**Database Layer**
- Drizzle ORM with Neon serverless PostgreSQL driver
- WebSocket support for real-time database connections
- Schema-driven database design with type safety

**AI Integration**
- OpenAI service wrapper using Replit's AI Integrations proxy
- GPT-5 model for text generation (card messages, song lyrics)
- GPT-Image-1 model for visual generation (card illustrations, song covers)
- Structured JSON responses for predictable AI outputs

### Data Model

**Core Entities**

1. **Users Table**
   - Identity (id, email, name, profile image)
   - Password field for email/password auth (nullable for OAuth-only users)
   - googleId for Google OAuth integration
   - isAdmin flag for admin dashboard access
   - marketingConsent for promotional email opt-in tracking
   - termsAcceptedAt timestamp when user agreed to Terms of Service
   - Created/updated timestamps for audit trail

5. **Magic Link Tokens Table**
   - JWT tokens for passwordless authentication
   - One-time use enforcement via `used` boolean field
   - Token expiration (1 hour)
   - User and email references

2. **Loved Ones Table**
   - User-owned profiles of people to celebrate
   - Fields: name, nickname, relationship, birthday (MM-DD format)
   - Personalization data: interests, inside jokes, avatar URL
   - Foreign key relationship to users with cascade delete

3. **Creations Table**
   - User-generated AI content (songs, cards, animations)
   - Type-specific fields: tone, occasion, genre (for songs)
   - Output storage: generated content, media URLs
   - **songIds**: Array of song IDs to attach songs to cards (plays audio when card is viewed)
   - Scheduling: send date/time, delivery method
   - Shareability: unique shareable links for distribution
   - Status tracking: draft, scheduled, sent

4. **Sessions Table**
   - Standard session storage for Passport.js
   - Session ID, serialized session data, expiration timestamp

**Validation Strategy**
- Zod schemas derived from Drizzle table definitions
- Insert schemas validate user input before database operations
- Type inference ensures compile-time safety between client and server

### External Dependencies

**Cloud Services**
- **Google Cloud Storage**: Object storage for user-uploaded media and generated assets
  - Accessed via Replit sidecar service with external account credentials
  - Public object search paths configured via environment variables
  - Service manages file uploads, downloads, and public URL generation

**AI Services**
- **OpenAI via Replit AI Integrations**: Text and image generation
  - Base URL and API key provided by Replit's managed service
  - Models: GPT-5 (chat completions), GPT-Image-1 (image generation)
  - Used for generating card messages and visual assets
- **Suno API**: AI song generation with vocals and music
  - Endpoint: `https://api.sunoapi.org/suno-api/generate-music`
  - Requires SUNO_API_KEY environment variable
  - Generates complete songs (~3 minutes) with vocals, music, lyrics, and cover art
  - Model: V5 for highest quality output
  - Returns MP3 audio files, lyrics, and optional cover images
  - **Boost Music Style (V4.5)**: Enhanced style descriptions for better genre accuracy
    - Uses `/api/v1/style/generate` endpoint for conversational style prompts
    - Rap sub-genres get detailed style descriptions (Trap, Boom Bap, Old School, etc.)
    - Boosted styles are cached for 1 hour to reduce API calls
    - Fallback to basic style if boost fails
- **Nano Banana API**: Image generation for greeting cards, family portraits, and festive transformations
  - Requires NANO_BANANA_API_KEY environment variable
  - Used for greeting card illustrations, family portrait generation, and festive photo transformation
  - **Festive Transform**: Single person photo transformation feature
    - Upload one person's photo and transform into festive scene
    - 27+ festive scenes including major holidays, life events, and seasonal themes
    - 6 art styles: festive-photo, cartoon, watercolor, oil-painting, digital-art, vintage
    - Route: POST /api/generate/festive-transform
    - Uses image-to-image transformation with NanoBanana Pro model
  - **Family Portrait Composer**: Integrated into card creator as cover image option
    - Users choose cover image source: AI Generated, Family Portrait, Festive Transform, Upload Image, or No Image
    - Family Portrait flow: upload 2-6 photos → AI face detection → select people → choose scene/style
    - Scenes: studio, living-room, holiday, outdoors, graduation, birthday
    - Styles: studio-photo, watercolor, cartoon, oil-painting, digital-art, vintage
    - Option to keep or change original outfits
  - **Same People, New Scene**: After creating a family portrait card, users can quickly generate variants
    - Saves the "family set" (photos + selected faces) for reuse
    - Quick preset buttons: Christmas Card, Vacation Postcard, Studio Portrait, Birthday Cartoon, Watercolor Art, Classic Painting
    - No need to re-upload photos - instantly create new scenes with the same people
    - Great for creating card sets (holiday collection, different occasions)
  - **Scene expansion**: 27+ scenes organized by Classic Scenes (studio, living room, outdoors, beach, garden), Life Events (birthday, graduation, wedding, baby shower, anniversary, retirement), and Major Holidays (Christmas, Hanukkah, Kwanzaa, New Year's, Thanksgiving, Easter, Passover, Halloween, Fourth of July, Valentine's Day, Mother's Day, Father's Day, St. Patrick's Day, Cinco de Mayo, Diwali, Eid, Lunar New Year) with culturally appropriate outfit suggestions

**Authentication**
- **Custom Multi-Method Authentication**:
  - Email/Password: Bcrypt password hashing with salt
  - Magic Links: JWT tokens sent via SendGrid (requires SENDGRID_API_KEY)
  - Google OAuth: OAuth 2.0 via Google (requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- **Session Management**:
  - 1-week cookie TTL, httpOnly, secure in production
  - SESSION_SECRET environment variable required (throws error if missing)
  - Session fixation protection via regeneration on all auth flows

**SMS Service (Twilio)**
- **Password Reset via SMS**: Sends reset link to user's phone number
  - Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
  - Falls back to email-only if Twilio not configured
  - Phone numbers are normalized and stored with unique constraint to prevent abuse
- **Service file**: `server/smsService.ts` handles all SMS operations

**Database**
- **Neon PostgreSQL**: Serverless Postgres database
  - Connection string via DATABASE_URL environment variable
  - WebSocket-enabled for real-time features
  - Migrations managed via Drizzle Kit

**Admin Dashboard**
- Accessible at `/admin` route (admin users only)
- Features:
  - User statistics: total users, 7-day/30-day signups, active subscribers, marketing opt-ins
  - Full user list with search and filters (marketing opt-ins, subscribers)
  - CSV export of filtered user data
- Protected by `isAdmin` middleware on backend API routes
- Non-admin users are automatically redirected to dashboard

**Terms of Service**
- Accessible at `/terms` route
- Required acceptance during registration (checkbox must be checked)
- Covers: AI-generated content intellectual property, acceptable use, photo uploads, credits/refunds, disclaimers
- Acceptance timestamp stored in `termsAcceptedAt` field

**Development Tools**
- **Replit Development Extensions**: Runtime error overlay, cartographer, dev banner
  - Conditional loading in development mode only
  - Enhances developer experience with visual debugging

**Asset Management**
- Pre-generated image assets stored in `/attached_assets/generated_images/`
- Referenced in components for hero sections, feature cards, and examples
- Design guidelines document provides UI/UX direction
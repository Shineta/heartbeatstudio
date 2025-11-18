# Heartbeat Studio

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

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript
- RESTful API design with `/api/*` routes
- Session-based authentication using Passport.js with OpenID Connect

**Authentication System**
- Replit Auth integration via OpenID Connect strategy
- Session storage in PostgreSQL using connect-pg-simple
- User session includes OAuth tokens (access_token, refresh_token)
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
   - OAuth-based identity (id, email, name, profile image)
   - Created/updated timestamps for audit trail

2. **Loved Ones Table**
   - User-owned profiles of people to celebrate
   - Fields: name, nickname, relationship, birthday (MM-DD format)
   - Personalization data: interests, inside jokes, avatar URL
   - Foreign key relationship to users with cascade delete

3. **Creations Table**
   - User-generated AI content (songs, cards, animations)
   - Type-specific fields: tone, occasion, genre (for songs)
   - Output storage: generated content, media URLs
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
  - Used for generating card messages, song lyrics, and visual assets

**Authentication**
- **Replit Identity Platform**: OAuth 2.0 / OpenID Connect provider
  - Discovery endpoint for dynamic configuration
  - Session management with 1-week cookie TTL
  - Secure session secret stored in environment variables

**Database**
- **Neon PostgreSQL**: Serverless Postgres database
  - Connection string via DATABASE_URL environment variable
  - WebSocket-enabled for real-time features
  - Migrations managed via Drizzle Kit

**Development Tools**
- **Replit Development Extensions**: Runtime error overlay, cartographer, dev banner
  - Conditional loading in development mode only
  - Enhances developer experience with visual debugging

**Asset Management**
- Pre-generated image assets stored in `/attached_assets/generated_images/`
- Referenced in components for hero sections, feature cards, and examples
- Design guidelines document provides UI/UX direction
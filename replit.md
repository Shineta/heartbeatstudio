# Heartbeat Studio

## Overview

Heartbeat Studio is an AI-powered celebration platform designed to help users create personalized gifts. It enables the generation of AI songs, greeting cards, and animations, with scheduling and delivery features for meaningful occasions. The project aims to make celebrating loved ones effortless and joyful through a full-stack TypeScript application integrating emotional design with advanced AI capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is built with React 18 and TypeScript, using Vite for bundling and Wouter for client-side routing. Form management utilizes React Hook Form with Zod for validation, while TanStack Query manages UI state and server data. The UI is developed with Shadcn/ui (New York style) and Radix UI primitives, styled using Tailwind CSS, emphasizing a warm, joyful aesthetic inspired by platforms like Canva. Typography uses Inter and Fredoka, with responsive grid patterns across devices. Key application flows include a landing page, a user dashboard, and a creation wizard for AI content generation. The system also supports various "Experience Kits" for themed content generation (e.g., Date Night, Birthday Blast).

### Backend

The backend is an Express.js server in TypeScript, providing a RESTful API. It features a custom authentication system with Passport.js, supporting email/password (bcrypt), passwordless magic links (via SendGrid and JWT), and Google OAuth 2.0. Session storage is managed in PostgreSQL using `connect-pg-simple`, with robust security measures including session regeneration and `httpOnly` cookies. The database layer uses Drizzle ORM with Neon serverless PostgreSQL, ensuring type safety and schema-driven design. AI integration is handled via a wrapper for OpenAI services (GPT-5 for text, GPT-Image-1 for visuals) through Replit's AI Integrations proxy, ensuring structured JSON responses.

### Data Model

The core data model includes `Users` (identity, authentication details, admin status, marketing consent), `Loved Ones` (user-owned profiles with personalization data), `Creations` (AI-generated content with type-specific fields, output storage, scheduling, and shareability), `Sessions` (Passport.js session storage), `Magic Link Tokens` (for passwordless auth), and `Asset Tasks` (for persisting Creatify video generation tasks). Validation is enforced using Zod schemas derived from Drizzle table definitions.

### Admin Features

An admin dashboard at `/admin` provides user statistics, a searchable user list, and CSV export functionality. An "Admin Social Media Studio" at `/admin/social-media` (Creatify API-powered) allows for AI video generation from URLs or text descriptions, supporting various platforms, styles, and aspect ratios, with real-time status tracking.

## External Dependencies

-   **Cloud Storage**: Google Cloud Storage for media assets.
-   **AI Services**:
    -   **OpenAI**: Via Replit AI Integrations for GPT-5 (text) and GPT-Image-1 (image generation).
    -   **Runway API**: For AI video/animation generation (text-to-video).
    -   **Suno API**: For AI song generation with vocals, music, and lyrics (V5 model).
    -   **Nano Banana API**: For advanced image generation for greeting cards, family portraits, and festive transformations (e.g., Festive Transform, Family Portrait Composer, Gaming Card).
-   **Authentication**:
    -   **SendGrid**: For sending magic link emails.
    -   **Google OAuth**: For Google authentication.
-   **SMS Service**: **Twilio** for password reset via SMS.
-   **Database**: **Neon PostgreSQL** as the serverless relational database.
-   **Admin Tools**: **Creatify API**: For AI video generation in the Admin Social Media Studio.
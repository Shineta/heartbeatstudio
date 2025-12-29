# Local Development Setup Guide

This guide explains how to set up Heartbeat Studio for local development.

## Prerequisites

- **Node.js 20+** - Download from [nodejs.org](https://nodejs.org/)
- **PostgreSQL 15+** - Download from [postgresql.org](https://www.postgresql.org/download/) or use Docker
- **Git** - For cloning the repository

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd heartbeat-studio
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database (Required)
DATABASE_URL=postgresql://username:password@localhost:5432/heartbeat_studio

# Session Secret (Required) - Generate a random string
SESSION_SECRET=your-random-secret-string-here

# Suno API (Required for song generation)
SUNO_API_KEY=your-suno-api-key

# OpenAI (Required for AI features)
OPENAI_API_KEY=your-openai-api-key

# Google OAuth (Optional - for Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# SendGrid (Optional - for magic link emails)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Object Storage (Optional - for file uploads)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-bucket-id
PUBLIC_OBJECT_SEARCH_PATHS=public
PRIVATE_OBJECT_DIR=.private
```

### Getting API Keys

| Service | Purpose | Get Key From |
|---------|---------|--------------|
| Suno | AI song generation | [sunoapi.org](https://sunoapi.org) |
| OpenAI | Text/image generation | [platform.openai.com](https://platform.openai.com) |
| Google OAuth | Google login | [console.cloud.google.com](https://console.cloud.google.com) |
| SendGrid | Magic link emails | [sendgrid.com](https://sendgrid.com) |
| Stripe | Payment processing | [dashboard.stripe.com](https://dashboard.stripe.com) |

## Step 4: Set Up the Database

### Option A: Local PostgreSQL

1. Create a new database:
```bash
createdb heartbeat_studio
```

2. Push the schema to the database:
```bash
npm run db:push
```

### Option B: Docker

```bash
docker run --name heartbeat-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=heartbeat_studio -p 5432:5432 -d postgres:15
```

Then update your DATABASE_URL:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/heartbeat_studio
```

Push the schema:
```bash
npm run db:push
```

## Step 5: Run the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5000**

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push schema changes to database |

## Project Structure

```
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and helpers
├── server/                 # Backend Express server
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   ├── sunoService.ts      # Suno AI song generation
│   └── openai.ts           # OpenAI integration
├── shared/                 # Shared code between client/server
│   └── schema.ts           # Database schema (Drizzle ORM)
└── attached_assets/        # Static assets and generated images
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js (Email/Password, Magic Links, Google OAuth)
- **AI Services**: Suno V5 (songs), OpenAI GPT-5 (text/images)
- **Payments**: Stripe

## Common Issues

### Port 5000 in use
The app binds to port 5000. If it's in use:
```bash
# Find and kill the process
lsof -i :5000
kill -9 <PID>
```

### Database connection errors
Ensure PostgreSQL is running and DATABASE_URL is correct:
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Schema push fails
If you get data loss warnings:
```bash
npm run db:push --force
```

## Admin Testing

For testing purposes, the email `danielle.turner07@gmail.com` has admin access and bypasses payment requirements.

## Deployment

On Replit, the app auto-deploys via the "Publish" feature. For other platforms:

1. Build the production bundle:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```

Ensure all environment variables are set in your production environment.

# Heartbeat Studio by Horton's Tech Innovations

## The Platform That Makes Celebrating Loved Ones Effortless and Joyful

---

## What is Heartbeat Studio?

Heartbeat Studio is an AI-powered celebration platform that transforms how people express love and appreciation for the important people in their lives. Using cutting-edge artificial intelligence, users can create personalized songs, custom greeting cards, festive photo transformations, and celebration animations - all delivered at the perfect moment.

Whether it's a birthday, anniversary, holiday, graduation, or just because, Heartbeat Studio makes every celebration unforgettable.

---

## Core Features

### 1. AI-Generated Songs

Create completely original, personalized songs for any occasion. Our AI composes unique music with custom lyrics tailored to your loved one.

**Capabilities:**
- **40+ Music Genres**: Pop, R&B, Gospel, Hip-Hop, Country, Jazz, Rock, Classical, Reggae, Latin, K-Pop, and many more
- **20+ Languages**: English, Spanish, French, Portuguese, Mandarin, Japanese, Korean, Arabic, Hindi, and more
- **Custom Lyrics**: AI writes personalized lyrics based on your input about the recipient
- **Professional Quality**: Full vocal performances with instrumentation, generated using Suno's V5 AI model
- **Song Duration**: Approximately 3 minutes per song
- **Cover Art**: Auto-generated album cover artwork for each song

**Experience Kits (Multi-Song Packages):**
- **Date Night Experience**: 3 romantic songs with emotional progression
- **Birthday Blast Experience**: 5 personalized birthday celebration songs
- **Gospel Greeting Experience**: 2 gospel-inspired audio messages with scripture
- **Classroom Cheers Experience**: 5 group songs for students and educators
- **Sung Prayer Experience**: 3-part biblical prayer structure (Thanksgiving, Declaration, Promises)

### 2. Custom Greeting Cards

Design beautiful, personalized greeting cards with AI-generated messages and artwork.

**Features:**
- **AI-Written Messages**: Heartfelt, personalized messages generated based on your relationship and occasion
- **Multiple Cover Image Options**:
  - AI-Generated Illustrations
  - Family Portrait Composer
  - Festive Photo Transform
  - Upload Your Own Image
- **Attach Songs**: Add your AI-generated songs to play when the card is opened
- **27+ Occasions**: Birthdays, holidays, weddings, graduations, and more
- **Shareable Links**: Send cards via unique URL links

### 3. Family Portrait Composer

Transform individual photos into beautiful family portraits in any scene or style.

**How It Works:**
1. Upload 2-6 individual photos
2. AI detects and identifies each person/pet
3. Choose your scene and art style
4. AI composes everyone into a unified family portrait

**Scene Categories:**

*Classic Scenes:*
- Professional Studio
- Cozy Living Room
- Beautiful Outdoors
- Sunny Beach
- Garden Setting

*Life Events:*
- Birthday Party
- Graduation Celebration
- Wedding
- Baby Shower
- Anniversary
- Retirement

*Major Holidays (27+):*
- Christmas, Hanukkah, Kwanzaa
- New Year's Eve, Thanksgiving
- Easter, Passover
- Halloween, Valentine's Day
- Fourth of July, Mother's Day, Father's Day
- St. Patrick's Day, Cinco de Mayo
- Diwali, Eid, Lunar New Year
- And many more...

*Blast from the Past (Nostalgic Scenes):*
- TV Show Sets: Fresh Prince mansion, Family Matters living room, Good Times apartment, Martin's place, Cosby Show brownstone, Old Western saloon
- Era Styles: Retro 70s, 80s Neon, 90s Grunge
- Music Themes: Hip-Hop Crew, 90s Album Cover, Soul Train Stage, Rap Group Pose
- Photo Styles: Polaroid, Sepia Classic, Mall Photo Booth, Awkward School Portrait

*Seasons:*
- Winter Wonderland
- Spring Garden
- Summer Beach
- Autumn Harvest

*Professional Headshots:*
- Corporate Headshot
- LinkedIn Profile
- Executive Portrait
- Medical/Legal/Creative Professional
- Author/Speaker Portrait

**Art Styles:**
- Studio Photo (Photorealistic)
- Watercolor Painting
- Cartoon Illustration
- Oil Painting
- Digital Art
- Vintage Photography

**Special Features:**
- Include pets with scene-appropriate accessories
- Option to keep original outfits or change to scene-appropriate attire
- "Same People, New Scene" - quickly create variants without re-uploading photos
- Remove glasses or dental braces from photos

### 4. Festive Photo Transform

Transform a single person's photo into a beautiful festive scene.

**Features:**
- Upload one photo and place yourself in any celebration scene
- Perfect for holiday cards, social media, or fun portraits
- High-quality face preservation with scene integration
- Multiple art styles available
- Option to include iconic TV show characters in the scene

### 5. Celebration Animations

Create short animated videos for special occasions (Subscription feature).

**Capabilities:**
- 4-16 second celebration animations
- Text-to-video generation using Runway API
- Multiple animation styles: Cartoon, Anime, 3D, Watercolor, Pixar, Realistic
- Perfect for social media sharing or digital greetings

---

## Pricing & Credits

### How Credits Work
- **1 Credit = 1 AI Song** OR **1 Greeting Card**
- Animations are exclusive to subscribers
- Credits never expire

### Pricing Tiers

| Plan | Price | Credits | Best For |
|------|-------|---------|----------|
| **Free** | $0 | 3 credits | Try the platform |
| **Credit Pack** | $4.99 | 5 credits | Occasional users |
| **Subscription** | $10/month | 15 credits + Animations | Regular creators |

### Audio Preview Protection
- Free previews include "Heartbeat Studio Preview" voice watermark every 15 seconds
- Free previews limited to 50% playback
- Full, watermark-free audio available after purchase

### Admin Accounts
- Admin users bypass credit deduction for testing and demonstration purposes

---

## User Experience

### For New Users
1. **Landing Page**: Beautiful showcase of features with examples
2. **Sign Up**: Multiple options - Email/Password, Magic Link, or Google OAuth
3. **Terms Acceptance**: Required agreement to Terms of Service
4. **Dashboard Access**: Immediate access to creation tools

### Dashboard Features
- **Loved Ones Directory**: Save profiles of people you celebrate (name, birthday, relationship, interests, inside jokes)
- **Upcoming Celebrations**: See birthdays and events on the horizon
- **Creation Stats**: Track your songs, cards, and animations
- **Quick Create**: Jump into any creation type with one click

### Creation Wizard
Step-by-step guided experience for each creation type:
1. Select occasion/recipient
2. Provide personalization details
3. Choose style/genre options
4. Preview and refine
5. Schedule or send immediately

---

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** build system for fast development
- **Tailwind CSS** with custom design tokens
- **Shadcn/ui** component library
- **TanStack Query** for data fetching
- **Wouter** for client-side routing

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database (Neon serverless)
- **Drizzle ORM** for type-safe database operations
- **Passport.js** for authentication

### AI Services
- **Suno API**: Song generation with vocals and music
- **OpenAI**: Text generation and image creation
- **Nano Banana API**: Photo transformation and family portraits
- **Runway API**: Video/animation generation

### Infrastructure
- **Replit** hosting and deployment
- **Google Cloud Storage** for media assets
- **SendGrid** for email delivery
- **Twilio** for SMS notifications

---

## Security & Privacy

### Authentication Security
- Bcrypt password hashing with salt
- Session fixation protection
- One-time use magic link tokens
- Secure httpOnly cookies
- Required SESSION_SECRET

### Data Protection
- User photos processed securely
- Generated content stored in private cloud storage
- No sharing of personal data without consent
- GDPR-compliant data handling

---

## Admin Dashboard

For platform administrators:
- **User Statistics**: Total users, signup trends, active subscribers
- **User Management**: Search, filter, and view user details
- **Marketing Insights**: Track opt-in rates and engagement
- **Data Export**: CSV export of user data for analysis

---

## Language Support

Heartbeat Studio supports content creation in 20+ languages:

| Language | Songs | Cards |
|----------|-------|-------|
| English | Yes | Yes |
| Spanish | Yes | Yes |
| French | Yes | Yes |
| Portuguese | Yes | Yes |
| German | Yes | Yes |
| Italian | Yes | Yes |
| Japanese | Yes | Yes |
| Korean | Yes | Yes |
| Mandarin Chinese | Yes | Yes |
| Arabic | Yes | Yes |
| Hindi | Yes | Yes |
| Russian | Yes | Yes |
| Dutch | Yes | Yes |
| Swedish | Yes | Yes |
| Polish | Yes | Yes |
| Turkish | Yes | Yes |
| Vietnamese | Yes | Yes |
| Thai | Yes | Yes |
| Indonesian | Yes | Yes |
| Filipino | Yes | Yes |

---

## Use Cases

### Personal Celebrations
- Birthday songs for family and friends
- Anniversary cards with personalized messages
- Holiday greetings with family portraits
- Graduation celebration packages

### Religious & Spiritual
- Gospel songs with scripture references
- Sung prayers for loved ones
- Faith-based greeting cards

### Education
- Classroom celebration songs
- Student recognition cards
- Teacher appreciation content

### Professional
- Team celebration content
- Client appreciation cards
- Corporate milestone recognition

---

## Getting Started

1. **Visit Heartbeat Studio** at your deployed URL
2. **Create an account** using email, magic link, or Google
3. **Accept Terms of Service**
4. **Add loved ones** to your directory with their details
5. **Start creating** songs, cards, or portraits
6. **Share or schedule** your creations for delivery

---

## Contact & Support

**Developed by**: Horton's Tech Innovations

For support, questions, or feedback, contact us through the platform or reach out to our support team.

---

*Heartbeat Studio - Making Every Celebration Unforgettable*

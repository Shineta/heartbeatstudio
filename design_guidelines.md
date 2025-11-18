# Heartbeat Studio Design Guidelines

## Design Approach

**Reference-Based Strategy**: Drawing inspiration from Canva's creative interface, Instagram's visual-first layouts, and Notion's clean organization systems, adapted for emotional celebration experiences.

**Core Principle**: Create a joyful, warm, and instantly delightful interface that makes users feel excited to celebrate their loved ones. Every interaction should spark joy.

---

## Typography System

**Primary Font**: "Inter" (Google Fonts) - Clean, modern, highly readable
**Accent Font**: "Fredoka" (Google Fonts) - Rounded, playful for celebration moments

**Hierarchy**:
- Hero Headlines: Fredoka, 3xl-5xl, semibold - celebratory, warm
- Section Headers: Inter, 2xl-3xl, bold - clear structure
- Card Titles: Fredoka, xl-2xl, medium - personality
- Body Text: Inter, base-lg, regular - readability
- Metadata/Labels: Inter, sm-xs, medium - subtle guidance
- Buttons: Inter, base, semibold - confident actions

---

## Layout & Spacing System

**Tailwind Units**: 4, 6, 8, 12, 16, 24 (p-4, gap-8, mt-12, etc.)
- Tight spacing: 4-6 (related elements)
- Standard spacing: 8-12 (component padding, gaps)
- Section spacing: 16-24 (breathing room)

**Container Strategy**:
- Dashboard/App Views: max-w-7xl (wide workspace)
- Content Sections: max-w-6xl (comfortable reading)
- Forms/Creation Flows: max-w-2xl (focused experience)

**Grid Patterns**:
- Loved One Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Creation Gallery: grid-cols-2 md:grid-cols-3 lg:grid-cols-4
- Feature Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

---

## Component Library

### Navigation
- **Top Bar**: Persistent, max-w-7xl, logo left, user profile/settings right
- **Dashboard Sidebar** (desktop): Fixed left, 240px width, navigation + quick stats
- **Mobile Nav**: Bottom tab bar for main sections (Create, Loved Ones, Scheduled, Profile)

### Loved One Profiles
- **Profile Cards**: Elevated cards with avatar, name, relationship badge, quick stats (upcoming events, total creations)
- **Quick Action Buttons**: "Create Song", "Create Card", "Create Animation" as prominent CTAs
- **Detail View**: Modal/slide-over with full profile info, edit capabilities, creation history

### Creation Tools
- **AI Creator Interface**: Step-by-step wizard with progress indicator (1. Choose Type → 2. Personalize → 3. Generate → 4. Preview → 5. Schedule/Send)
- **Generation Loading**: Animated celebration graphics (confetti, hearts, sparkles) during AI processing
- **Preview Cards**: Large preview area with play button (songs), zoom (cards), video player (animations)
- **Edit Panel**: Side drawer with customization options, tone selectors, style toggles

### Dashboard
- **Quick Stats Bar**: Cards showing upcoming celebrations (7 days), total loved ones, creations this month
- **Timeline View**: Chronological list of scheduled deliveries with edit/cancel options
- **Creation Gallery**: Masonry grid of past creations with filters (type, recipient, date)

### Scheduling Interface
- **Delivery Options**: Toggle group for "Send Now" / "Schedule" / "Recurring"
- **Date Picker**: Calendar interface with celebration date highlights
- **Channel Selection**: Icon buttons for Email / SMS / Link with visual distinction

### Forms & Inputs
- **Input Fields**: Rounded corners (rounded-lg), generous padding (p-3), subtle borders
- **Text Areas**: For personal messages, inside jokes - expandable with character count
- **Dropdowns/Selectors**: Custom styled with icons, smooth transitions
- **Toggle Switches**: For preferences, notification settings - clear on/off states

### Buttons & CTAs
- **Primary Actions**: Rounded-full, bold text, generous padding (px-8 py-3)
- **Secondary Actions**: Rounded-lg, outlined style
- **Destructive Actions**: Subtle red treatment, confirmation modals
- **Icon Buttons**: Circular, consistent size (40px × 40px), clear hover states

### Cards & Containers
- **Elevated Cards**: Subtle shadows, rounded-xl, hover lift effect
- **Content Cards**: Clean borders, rounded-lg, organized information hierarchy
- **Celebration Cards**: Special treatment with gradient borders, sparkle accents

---

## Visual Treatments

**Elevation System**:
- Base cards: shadow-sm
- Hover states: shadow-md with 2px lift
- Active/Selected: shadow-lg with subtle glow
- Modals/Overlays: shadow-2xl

**Borders & Radius**:
- Cards: rounded-xl
- Buttons: rounded-full (primary), rounded-lg (secondary)
- Inputs: rounded-lg
- Images: rounded-lg
- Modals: rounded-2xl

**Iconography**:
- Use Heroicons throughout for consistency
- Celebration icons: heart, gift, sparkles, music note, cake, calendar
- Action icons: play, pause, download, share, edit, trash
- Size: 20px (small), 24px (standard), 32px (featured)

---

## Page-Specific Guidelines

### Landing Page
**Hero Section**: Full-width gradient background with celebratory illustration, centered headline "Create magic for the people you love—instantly", sub-headline, dual CTAs ("Start Creating Free" + "See How It Works")

**Features Section** (3 columns):
- AI Song Creator card with music icon, description, example preview
- AI Card Maker card with card icon, description, example preview  
- Scheduling card with calendar icon, description, benefits

**How It Works** (4 steps):
- Numbered cards with icons showing: 1. Add Loved One → 2. Choose Creation → 3. Personalize → 4. Send/Schedule

**Social Proof**: Testimonial cards with avatars, quotes, relationship context

**Pricing Section**: 2-column comparison (Free vs Pro) with feature lists

**Footer**: Logo, quick links, social media, newsletter signup

### Dashboard
**Layout**: Sidebar (desktop) + main content area
- Sidebar: Navigation, upcoming events widget, loved ones count
- Main: Quick action cards at top, tabs for "Scheduled", "Past Creations", "All Loved Ones"

### Creation Wizard
**Progressive Disclosure**: Show one step at a time with clear progress bar
- Step headers with Fredoka font for warmth
- Large, visual option selectors (tone, genre, style as cards)
- Real-time preview as options change
- Prominent "Generate" button at each step

### Loved One Profile Page
**Header**: Large avatar, name, relationship badge, quick stats
**Content Tabs**: About, Upcoming Events, Creation History, Edit
**Quick Actions**: Floating action button for "Create for [Name]"

---

## Images

**Hero Section**: Large, joyful illustration showing diverse people celebrating - birthday party, anniversary dinner, family gathering - positioned as full-width background with gradient overlay for text readability

**Feature Cards**: Each AI creator type should have an example preview image:
- Song creator: Cute album cover with musical notes
- Card maker: Beautiful greeting card preview  
- Animation: Video thumbnail with play button

**Loved One Profile Cards**: Avatar/photo placeholders, with default celebratory icons if no photo uploaded

**Creation Gallery**: Thumbnails of generated content - cards, song covers, animation previews in a clean grid

---

## Animations & Motion

**Minimal & Purposeful**:
- Page transitions: Subtle fade (200ms)
- Card hover: Gentle lift (150ms ease-out)
- Loading states: Pulsing celebration icons (confetti, sparkles)
- Success states: Brief confetti burst or heart animation
- Button clicks: Slight scale down (scale-95, 100ms)

**Avoid**: Excessive scroll animations, parallax effects, or distracting movements

---

## Accessibility

- Minimum touch targets: 44px × 44px
- Maintain 4.5:1 contrast ratios for all text
- Focus indicators: 2px ring offset for keyboard navigation
- ARIA labels for all icons and actions
- Form validation with clear error messages

---

This design creates a warm, joyful, and efficient experience that makes celebrating loved ones feel effortless and delightful.
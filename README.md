# Eloity — All-in-One Platform for Africa

> **A product of Neocreb LTD (RC 9016855)** — A private limited company registered in Nigeria under CAMA 2020.

Eloity is a comprehensive super-app combining social networking, fintech, marketplace, freelance services, content creation, crypto, and more — purpose-built for Africa and optimized as a Progressive Web App (PWA) for low-data and offline-first usage.

**Live:** [https://eloity.com)

---

## Table of Contents

- [Platform Pillars](#platform-pillars)
- [Feature Overview](#feature-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Deployment](#deployment)
- [Legal & Compliance](#legal--compliance)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

---

## Platform Pillars

| Pillar | Description |
|--------|-------------|
| 🏦 **Digital Wallet & Bill Manager** | Fintech hub — deposits, withdrawals, airtime, gift cards, bill payments |
| 💰 **Social Monetization** | Earn while socializing — creator tools, contests, tipping, ad campaigns |
| 🛡️ **Safe-Trade Marketplace** | Escrow-protected transactions for buyers, sellers, and freelancers |
| 📈 **Crypto Market Learning** | Real-time prices, portfolio tracking, and Learn-to-Earn courses |
| 📱 **Mobile Optimization** | PWA with offline support, low data usage, and service worker caching |

---

## Feature Overview

### 🔐 Authentication & User Management
- Supabase-based email/password authentication
- Protected routes with offline-resilient auth (cached sessions in localStorage)
- Role-based access control via dedicated `user_roles` table (admin, moderator, user)
- Terms of Service & Privacy Policy acceptance on sign-up
- Password strength indicator (weak/medium/strong)
- Session management with multi-device tracking
- Profile management with avatar, bio, location, social links
- Referral code system

### 📱 Social Feed & Community
- Rich post creation with text, images, and media
- Feed with likes, comments, bookmarks, and shares
- Post analytics tracking (views, demographics, device breakdown, traffic sources)
- Explore/discover page with trending content
- User profiles with followers/following system
- Blocked users management
- Community groups with roles, rules, and moderation
- Group chat with invite links
- Platform announcements

### 💬 Messaging & Communication
- Real-time 1:1 and group messaging via Supabase Realtime
- Message reactions, replies, and media attachments
- Audio/video calls via LiveKit WebRTC integration
- Call history tracking
- Online/offline status indicators
- Read receipts and typing indicators
- Message search

### 🎬 Creator Studio & Analytics
- **Content Analytics** — Views, engagement, traffic sources, trending analysis, demographic breakdown (age, sex, location, device)
- **Revenue & Earnings** — Real-time earnings dashboard, revenue trends, transaction history, top performers
- **Audience Analytics** — Demographics, growth tracking, follower insights, retention
- **Insights & Performance** — Content performance recommendations
- **Community Management** — Multi-platform analytics
- **Feature Usage** — Platform adoption metrics
- **Shop Analytics** — Product performance, sales funnels, reviews, conversion rates

### 🛒 Marketplace & E-Commerce
- Product listing and management (physical, digital, food, services)
- Shopping cart with persistent state
- Complete checkout flow with order creation
- Escrow-protected transactions (14-day auto-release)
- Order management for buyers and sellers
- Product reviews and ratings with verified purchase badges
- Inventory management and stock tracking
- Seller profiles and analytics
- Category management (admin)

### 💳 Wallet & Payments (Flutterwave)
- **Deposits** — Credit wallet via card, bank transfer, mobile money
- **Withdrawals** — Transfer to linked bank accounts
- **Virtual Accounts** — Create accounts for receiving payments
- **Virtual Cards** — Issue virtual cards for online transactions
- **Peer-to-Peer Transfers** — Send money between users
- **Transaction History** — Full ledger with filtering
- **Multi-currency** — NGN, USD, EUR, GBP, and 130+ currencies
- **Webhook Integration** — Real-time payment verification
- **Commission System** — Configurable platform fees per transaction type

> ⚠️ **Disclaimer:** Eloity does not store user funds. All payment processing is handled by Flutterwave, a CBN-licensed payment provider. The platform wallet is currently in beta — users are advised not to hold large balances.

### 📞 Airtime, Bills & Gift Cards
- Mobile airtime top-ups via Reloadly
- Bill payments (electricity, cable TV, internet)
- Digital gift card purchases
- Beneficiary management for quick repeat payments
- Biller directory with provider logos

### 🏆 Events & Contests
- Event creation with date, location, capacity, and ticketing
- Paid and free event support
- Event registration and participant management
- LiveKit-powered live streaming for events
- Recording and replay support
- Contest creation with voting and entry management
- Paid voting with configurable costs
- Prize distribution via wallet
- Contest analytics and rankings
- Contest messaging between creators and contestants

### 💼 Freelance & Services
- Job posting and discovery
- Proposal submission and management
- Formal contract creation with milestones
- Escrow-held milestone payments
- Dispute resolution system
- Team invites for collaborative projects
- Client and freelancer rating system
- Freelance settings and preferences

### 🎥 Video & Live Streaming
- HLS video playback with adaptive quality
- Video library with categories and discovery
- Browser-based streaming (WebRTC + RTMP ready)
- Streamer engagement tools (chat, tips, viewer count)
- Stream monetization (tips, gifts, donations)
- Stream management and archiving

### 📈 Crypto Features
- Real-time coin prices and market data (CoinGecko)
- Cryptocurrency portfolio tracking
- Price charts and historical data
- Exchange rate conversions
- Crypto wallet infrastructure (CryptoAPIs)
- Market cap, volume, and trend indicators

### 📢 Ad Campaigns
- Self-serve ad campaign creation
- Targeting by audience segments
- Campaign analytics (impressions, clicks, CTR, conversions)
- Budget management (daily and total)
- Multiple ad placements and creative formats
- Campaign status management

### 📝 Blog & Content
- Blog post creation with rich markdown editor
- Categories, tags, and cover images
- SEO metadata (meta title, description, keywords)
- Reading time estimation
- Blog comments with likes and threading
- View count tracking

### 🎓 Courses & Learning
- Course creation and management (admin)
- Course enrollment tracking
- Course revenue analytics
- Certificate generation (PDF via jsPDF)
- Learn-to-earn integration

### 🏅 Achievements & Rewards
- Achievement system with categories and tiers
- Progress tracking per achievement
- Reward points for platform actions
- Achievement rules engine
- Badge icons and visual indicators

### ⚙️ Settings & Preferences
- **Account Settings** — Profile editing, email, display name
- **Notification Settings** — Granular email, push, and in-app notification controls per category (followers, messages, likes, comments, marketplace, freelance, promotional); quiet hours scheduling
- **Privacy & Security** — Profile visibility (public/friends/private), message permissions, online status toggle, search indexing control, two-factor authentication (authenticator/SMS/email), suspicious login alerts, active session management with remote logout
- **Appearance** — Theme preferences
- **Connected Accounts** — Third-party account linking
- **KYC Verification** — Identity verification flow
- **Freelance Settings** — Skills, rates, availability
- **Data Export** — GDPR/NDPR-compliant data export (JSON/CSV)
- **Account Deletion** — Self-service account deletion with confirmation

### 🚀 Startup Showcase
- Submit startup projects with pitch, category, team info, and media
- Admin review and approval workflow
- Public startup discovery page with search and filtering
- Founder dashboard with analytics (views, engagement, demographics)
- Social sharing (Twitter/X, LinkedIn, WhatsApp)
- Comments and likes on startup projects
- Chat with founders directly from project pages

### 🛡️ Admin Panel
- **Dashboard** — Platform-wide metrics and overview
- **User Management** — View, search, suspend, and manage users
- **Financial Dashboard** — Revenue, commissions, payouts, wallet oversight
- **Transaction Management** — View and manage all transactions
- **Content Moderation** — Posts, videos, and marketplace listings
- **Marketplace Management** — Products, sellers, categories
- **Event Management** — Platform events administration
- **Contest Management** — Contest oversight and moderation
- **Freelance Management** — Job and freelancer administration
- **Blog Management** — Posts, comments, moderation
- **Course Management** — Courses, enrollments, revenue
- **KYC Management** — Identity verification review
- **Legal Pages** — Database-managed legal pages (Terms, Privacy) + static pages
- **Platform Announcements** — Create and manage announcements
- **Promotional Banners** — Banner management across the platform
- **Support Tickets** — Customer support system
- **Reports** — User-submitted reports review
- **Staff Management** — Admin roles and permissions
- **Commission Configuration** — Per-transaction-type commission rules
- **Platform Settings** — Global configuration
- **Deleted Accounts** — Audit trail for deleted accounts
- **Analytics** — Platform-wide analytics dashboard
- **Discover/Explore Config** — Curate featured content

### 📧 Notifications & Email
- Centralized notification system via `send-platform-notification` edge function
- 20+ transactional email types via Resend
- Covers: freelance (contracts/proposals), P2P trading, wallet transfers, marketplace events
- In-app notification center
- Configurable notification preferences per user

### 🌐 PWA & Offline Support
- Service worker with strategic caching (CacheFirst for assets, NetworkFirst for API)
- Offline action queue for posts, follows, and messages
- React Query cache persistence to localStorage
- Offline-resilient authentication (cached auth state)
- Install prompt for Add to Home Screen
- Low-data optimization

### 🔗 Legal & Static Pages
- Database-managed legal pages (Terms of Service, Privacy Policy)
- Static pages (About Neocreb LTD, Dispute Resolution Guide, Escrow Policy)
- Resource pages with markdown rendering
- JSON-LD structured data for SEO
- Corporate footer branding on all legal pages

---

## Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | UI framework with type safety |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling with custom design tokens |
| shadcn/ui + Radix UI | Accessible component library |
| TanStack React Query | Server state management with offline persistence |
| React Router v6 | Client-side routing |
| Framer Motion | Animations (where used) |
| Recharts | Data visualization |
| hls.js | HLS video playback |
| Leaflet + React Leaflet | Map integration |
| marked | Markdown rendering |
| jsPDF | PDF certificate generation |
| qrcode.react + html5-qrcode | QR code generation and scanning |
| Zod | Schema validation |
| date-fns | Date formatting |
| Lucide React + React Icons | Icon libraries |
| vite-plugin-pwa | PWA support and service worker |

### Backend & Infrastructure
| Technology | Purpose |
|-----------|---------|
| Supabase | PostgreSQL database, auth, realtime, storage, edge functions |
| Supabase Edge Functions (Deno) | Serverless backend logic |
| Row Level Security (RLS) | Database-level access control |

### External Integrations
| Service | Purpose |
|---------|---------|
| **Flutterwave** | Payment processing, transfers, virtual accounts/cards |
| **Reloadly** | Airtime top-ups, gift cards, bill payments |
| **CoinGecko** | Cryptocurrency market data |
| **CryptoAPIs** | Blockchain wallet infrastructure |
| **LiveKit** | Real-time audio/video communication |
| **Resend** | Transactional email delivery |

---

## Project Structure

```
src/
├── pages/
│   ├── auth/               # Authentication (sign in, sign up, reset)
│   ├── admin/              # 40+ admin pages
│   ├── settings/           # User settings (account, notifications, privacy, etc.)
│   ├── creator-studio/     # Creator analytics and tools
│   ├── freelance/          # Freelance jobs, contracts, proposals
│   ├── marketplace/        # Product pages, checkout
│   ├── wallet/             # Wallet sub-pages
│   ├── crypto/             # Crypto features
│   ├── events/             # Event management
│   ├── contests/           # Contest features
│   ├── videos/             # Video library
│   ├── chat/               # Messaging
│   ├── legal/              # Legal pages (Terms, Privacy)
│   ├── groups/             # Community groups
│   ├── profile/            # User profiles
│   ├── posts/              # Post detail views
│   ├── campaigns/          # Ad campaigns
│   ├── certificates/       # Certificate management
│   ├── explore/            # Discovery pages
│   ├── Feed.tsx            # Social feed
│   ├── Dashboard.tsx       # Main dashboard
│   ├── Marketplace.tsx     # Shop listing
│   ├── Wallet.tsx          # Wallet dashboard
│   ├── Blog.tsx            # Blog listing
│   ├── Notifications.tsx   # Notification center
│   └── ...                 # 50+ other pages
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # App layout, sidebar, navigation
│   ├── feed/               # Feed components
│   ├── chat/               # Messaging components
│   ├── marketplace/        # Shop components
│   ├── admin/              # Admin components
│   ├── video/              # Video and streaming
│   ├── legal/              # Legal page layout
│   ├── seo/                # SEO components
│   └── ...                 # Feature-specific components
├── hooks/                  # 80+ custom React hooks
├── contexts/               # Auth, theme, and app contexts
├── lib/                    # API helpers, utilities, offline queue
├── integrations/supabase/  # Supabase client and generated types
└── App.tsx                 # Main router with 100+ routes

supabase/
├── functions/              # 30+ edge functions
│   ├── flutterwave-*/      # Payment processing suite
│   ├── track-post-view/    # Analytics tracking
│   ├── process-data-export/# GDPR data export
│   ├── send-platform-notification/ # Email system
│   └── ...
├── migrations/             # Database schema migrations
└── config.toml             # Supabase configuration
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm 9+ (or Bun)
- Supabase account with project configured
- Git for version control

### Installation
```bash
# Clone repository
git clone <repository-url>
cd eloity

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Environment Setup

Create a `.env.local` file:

```env
# Supabase (auto-populated )
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>

# Edge Function Secrets (set in Supabase Dashboard > Settings > Functions)
# FLUTTERWAVE_SECRET_KEY=<your-flutterwave-secret-key>
# RESEND_API_KEY=<your-resend-api-key>
# RELOADLY_CLIENT_ID=<your-reloadly-client-id>
# RELOADLY_CLIENT_SECRET=<your-reloadly-client-secret>
# CRYPTOAPIS_API_KEY=<your-cryptoapis-key>
# LIVEKIT_API_KEY=<your-livekit-key>
# LIVEKIT_API_SECRET=<your-livekit-secret>
```

---

## Deployment

Can also be deployed to Vercel, Netlify, or any static hosting:
```bash
npm run build
# Deploy dist/ folder
```

### Backend
- Supabase edge functions deploy automatically
- Database migrations managed through Supabase dashboard
- Secrets configured in Supabase Functions settings

---

## Legal & Compliance

- **Company:** Neocreb LTD (RC 9016855), registered in Nigeria under CAMA 2020
- **Data Protection:** Compliant with Nigeria Data Protection Regulation (NDPR) and NDPA 2023
- **Payment Processing:** All funds handled by Flutterwave (CBN-licensed); Eloity does not store user funds
- **Platform Wallet:** Currently in beta — users advised not to hold large balances
- **Terms of Service:** Managed via database, covers payment disclaimers, wallet beta notice, third-party services, and liability limitations
- **Age Requirement:** Users must be 13+ to create an account

---

## Roadmap

### ✅ Completed
- [x] Full social feed with post analytics
- [x] Marketplace with escrow and order management
- [x] Wallet with Flutterwave integration
- [x] Freelance platform with contracts and milestones
- [x] Events and contests with voting
- [x] Creator Studio with comprehensive analytics
- [x] Admin panel with 40+ management pages
- [x] PWA with offline support
- [x] Notification system with 20+ email types
- [x] Crypto portfolio tracking
- [x] Blog with comments and SEO
- [x] Achievement and rewards system
- [x] Ad campaign management
- [x] Privacy, notification, and security settings
- [x] Data export (GDPR/NDPR compliance)
- [x] Terms acceptance on sign-up
- [x] Startup Showcase with admin review and founder analytics

### 🔜 In Progress
- [ ] Enhanced offline message queue
- [ ] Video transcoding pipeline
- [ ] Advanced marketplace search (full-text)
- [ ] Real-time online presence system

### 📋 Planned
- [ ] Advanced crypto trading integration
- [ ] AI-powered content recommendations
- [ ] Content scheduling and automation
- [ ] Multi-language support
- [ ] Production error monitoring (Sentry)
- [ ] Advanced analytics with ML insights

---

## Contributing

1. Create a feature branch from `main`
2. Follow existing patterns (TypeScript, Tailwind tokens, shadcn/ui components)
3. Write clear commit messages
4. Submit a Pull Request with description

### Code Standards
- TypeScript strict mode
- Semantic Tailwind tokens (no hardcoded colors in components)
- Small, focused components
- Custom hooks for business logic
- RLS policies for all new tables

---

© 2025 Neocreb LTD (RC 9016855) — All rights reserved.

Eloity is a service provided by Neocreb LTD, a registered company in Nigeria. Trusted partners: Flutterwave, Reloadly, CryptoAPIs, CoinGecko, LiveKit.

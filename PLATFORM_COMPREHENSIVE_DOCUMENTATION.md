# ELOITY PLATFORM - COMPREHENSIVE DOCUMENTATION

**Version:** 1.0  
**Date:** 2025  
**Platform Name:** Eloity - Where Everything Connects  
**Tagline:** Unified Ecosystem for Social, Commerce, Crypto, and Freelancing

---

## TABLE OF CONTENTS

1. [Platform Overview](#platform-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema & Data Models](#database-schema--data-models)
5. [Authentication & User Management](#authentication--user-management)
6. [Core Features & Modules](#core-features--modules)
7. [Page-by-Page UI/UX Documentation](#page-by-page-uiux-documentation)
8. [Component Architecture](#component-architecture)
9. [Supabase Integration Patterns](#supabase-integration-patterns)
10. [API & Data Access Patterns](#api--data-access-patterns)
11. [Styling System & Design Tokens](#styling-system--design-tokens)
12. [Real-Time Features](#real-time-features)
13. [Deployment & Configuration](#deployment--configuration)

---

## PLATFORM OVERVIEW

### What is Eloity?

Eloity is an all-in-one unified ecosystem platform that combines:

- **Social Media**: Feed, posts, stories, comments, followers, profiles
- **Marketplace**: E-commerce with products, orders, reviews, wishlists
- **Cryptocurrency**: Wallet management, trading, P2P transactions, KYC
- **Freelance Platform**: Job listings, proposals, contracts, payments
- **Payment & Wallet**: Balance management, transactions, invoices, withdrawals
- **Real-time Chat**: 1:1 messages, group chats, notifications
- **Community**: Groups, pages, events, discussions
- **Creator Economy**: Rewards, referrals, loyalty points, gift cards
- **Admin Suite**: Moderation, analytics, user management, content control

### Key Characteristics

- **Direct Supabase Integration**: Uses Supabase (PostgreSQL) for all data persistence, authentication, and storage
- **React 18 + TypeScript**: Type-safe, modern React application
- **Real-time Capabilities**: Socket.io for live messaging and notifications
- **Mobile-First Design**: Responsive UI using Tailwind CSS
- **Modular Architecture**: Feature-based folder structure with clear separation of concerns

---

## TECHNOLOGY STACK

### Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | React | 18.3.1 | UI library and component framework |
| **Language** | TypeScript | 5.9.3 | Type-safe development |
| **Router** | react-router-dom | 6.24.0 | Client-side routing |
| **Build Tool** | Vite | 7.2.6 | Fast bundler and dev server |
| **Styling** | Tailwind CSS | 3.4.1 | Utility-first CSS framework |
| **UI Components** | Radix UI | Latest | Unstyled, accessible UI primitives |
| **Icons** | Lucide React | 0.454.0 | Icon library |
| **State Management** | React Context + TanStack Query | React Query 5.90.1 | Server state, caching |
| **Forms** | React Hook Form | 7.63.0 | Efficient form handling |
| **Validation** | Zod | 4.2.1 | Schema validation |
| **Animations** | Framer Motion | 11.2.10 | Motion and animation library |
| **HTTP Client** | Axios | 1.7.2 | HTTP requests |
| **Toast Notifications** | Sonner + React Hot Toast | Latest | User notifications |
| **Charts** | Chart.js, Recharts | Latest | Data visualization |
| **Maps** | Leaflet + React Leaflet | Latest | Geolocation features |

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | >=20 | Server runtime |
| **Framework** | Express.js | 5.2.1 | REST API framework |
| **Language** | TypeScript | 5.9.3 | Type-safe backend |
| **ORM** | Drizzle ORM | 0.33.0 | Database abstraction |
| **DB Driver** | pg, postgres | Latest | PostgreSQL connection |
| **Authentication** | Supabase Auth | Latest | User authentication |
| **Real-time** | Socket.io | 4.7.5 | WebSocket communication |
| **Job Queue** | BullMQ | 5.66.4 | Background job processing |
| **Security** | Helmet, CORS, bcryptjs | Latest | Security middleware |
| **Compression** | Compression | 1.7.4 | Response compression |
| **Rate Limiting** | express-rate-limit | 8.2.1 | API rate limiting |
| **Session** | express-session | 1.18.0 | Session management |

### External Services (Integration Ready)

| Service | Purpose | Environment Variable |
|---------|---------|----------------------|
| **Supabase** | PostgreSQL Database, Auth, Storage | VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY |
| **Stripe** | Payment processing | STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY |
| **Reloadly** | Airtime & mobile top-up | RELOADLY_API_KEY, RELOADLY_API_SECRET |
| **CoinGecko** | Cryptocurrency data | COINGECKO_API_KEY |
| **Bybit** | Crypto exchange API | BYBIT_PUBLIC_API, BYBIT_SECRET_API |
| **AWS S3** | File storage (optional) | AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY |
| **OpenAI** | AI features | OPENAI_API_KEY |
| **Replicate** | AI image generation | REPLICATE_API_KEY |
| **Google/Facebook/Twitter** | Social login | OAuth credentials |
| **Twilio** | SMS & communications | TWILIO_SID_KEY, TWILIO_API_SECRET_KEY |

---

## PROJECT STRUCTURE

```
eloity-platform/
├── index.html                          # HTML entry point
├── src/
│   ├── main.tsx                       # React root initialization
│   ├── App.tsx                        # Main app component with routing
│   ├── index.css                      # Global styles & Tailwind imports
│   ├── pages/                         # Page components (organized by feature)
│   │   ├── Feed.tsx                   # Main social feed
│   │   ├── CreatePost.tsx             # Post creation
│   │   ├── PostDetail.tsx             # Single post view
│   │   ├── marketplace/               # Marketplace pages
│   │   │   ├── MarketplaceHomepage.tsx
│   │   │   ├── MarketplaceList.tsx
│   │   │   ├── MarketplaceCart.tsx
│   │   │   ├── MarketplaceCheckout.tsx
│   │   │   ├── MarketplaceOrders.tsx
│   │   │   └── MarketplaceSeller.tsx
│   │   ├── Chat.tsx                   # Chat inbox
│   │   ├── ChatRoom.tsx               # Individual chat room
│   │   ├── freelance/                 # Freelance pages
│   │   │   ├── FreelanceDashboard.tsx
│   │   │   ├── BrowseJobs.tsx
│   │   │   ├── CreateJob.tsx
│   │   │   └── JobDetailPage.tsx
│   │   ├── Wallet.tsx                 # Wallet dashboard
│   │   ├── UnifiedProfile.tsx         # User profile
│   │   ├── CryptoTrading.tsx          # Crypto trading interface
│   │   ├── admin/                     # Admin pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminManagement.tsx
│   │   │   └── ContentModeration.tsx
│   │   └── ... (many more pages)
│   ├── components/
│   │   ├── ui/                        # Reusable UI primitives
│   │   │   ├── button.tsx             # Button component
│   │   │   ├── card.tsx               # Card component
│   │   │   ├── dialog.tsx             # Modal/Dialog
│   │   │   ├── tabs.tsx               # Tabs component
│   │   │   ├── avatar.tsx             # Avatar component
│   │   │   ├── badge.tsx              # Badge component
│   │   │   ├── input.tsx              # Input field
│   │   │   ├── use-toast.ts           # Toast hook
│   │   │   └── ... (20+ more primitives)
│   │   ├── feed/                      # Feed components
│   │   │   ├── EnhancedPostCard.tsx
│   │   │   ├── CommentSection.tsx
│   │   │   ├── CreatePostFlow.tsx
│   │   │   ├── StoryViewer.tsx
│   │   │   └── ... (more feed components)
│   │   ├── marketplace/               # Marketplace components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── ShoppingCart.tsx
│   │   │   └── ... (more marketplace)
│   │   ├── chat/                      # Chat components
│   │   │   ├── UnifiedChatInterface.tsx
│   │   │   ├── ChatListSidebar.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   └── group/ (group chat)
│   │   ├── crypto/                    # Crypto components
│   │   ├── wallet/                    # Wallet components
│   │   ├── profile/                   # Profile components
│   │   ├── admin/                     # Admin components
│   │   └── ... (more feature modules)
│   ├── contexts/                      # React Context providers
│   │   ├── AuthContext.tsx            # Authentication context
│   │   ├── WalletContext.tsx          # Wallet data context
│   │   ├── FeedContext.tsx            # Feed state management
│   │   └── ... (more contexts)
│   ├── hooks/                         # Custom React hooks
│   │   ├── use-feed.ts                # Feed data fetching
│   │   ├── use-wallet.ts              # Wallet operations
│   │   ├── use-realtime-messaging.ts  # Real-time chat
│   │   ├── use-crypto.ts              # Crypto data
│   │   └── ... (40+ custom hooks)
│   ├── services/                      # Business logic & API wrappers
│   │   ├── postService.ts
│   │   ├── profileService.ts
│   │   ├── marketplaceService.ts
│   │   ├── walletService.ts
│   │   ├── cryptoService.ts
│   │   └── ... (domain-specific services)
│   ├── lib/                           # Utility libraries
│   │   ├── supabase.ts / utils.ts     # Helper functions
│   │   └── ... (reusable utilities)
│   ├── integrations/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Supabase client initialization
│   │   │   └── types.ts               # Auto-generated DB types
│   │   └── ... (other integrations)
│   ├── types/                         # TypeScript type definitions
│   │   ├── user.ts
│   │   ├── post.ts
│   │   ├── product.ts
│   │   └── ... (domain types)
│   └── home/                          # Landing page components
│       ├── Header.tsx
│       ├── HeroSection.tsx
│       └── Footer.tsx
├── server/
│   ├── enhanced-index.ts              # Server entry point
│   ├── supabaseServer.ts              # Server-side Supabase client
│   ├── routes/                        # Express routes
│   ├── middleware/                    # Express middleware
│   └── ... (backend implementation)
├── shared/
│   ├── schema.ts                      # Core Drizzle schemas
│   ├── enhanced-schema.ts             # Enhanced schemas
│   ├── crypto-schema.ts               # Crypto tables
│   ├── chat-schema.ts                 # Chat tables
│   ├── freelance-schema.ts            # Freelance tables
│   └── ... (more schemas)
├── migrations/
│   ├── 0000_create_content_analytics.sql
│   ├── 0021_create_posts_and_comments_tables.sql
│   ├── 0031_enable_rls_on_users_table.sql
│   └── ... (many migration files)
├── supabase/
│   └── functions/                     # Edge functions
├── public/                            # Static assets
├── tailwind.config.ts                 # Tailwind configuration
├── vite.config.ts                     # Vite configuration
├── tsconfig.json                      # TypeScript configuration
├── package.json                       # Dependencies
└── README.md                          # Project readme
```

---

## DATABASE SCHEMA & DATA MODELS

### Core Tables

#### 1. **users** (Supabase Auth + Local Metadata)
```typescript
- id: UUID (Primary Key)
- email: string (unique)
- username: string (unique)
- full_name: string
- avatar_url: string
- banner_url: string
- bio: text
- location: string
- website: string
- phone: string
- date_of_birth: string
- gender: string
- is_verified: boolean (default: false)
- points: integer (loyalty/reward points)
- level: string (bronze, silver, gold, platinum)
- role: string (user, moderator, admin)
- reputation: integer
- followers_count: integer
- following_count: integer
- posts_count: integer
- profile_views: integer
- is_online: boolean
- last_active: timestamp
- profile_visibility: string (public, private)
- allow_direct_messages: boolean
- allow_notifications: boolean
- preferred_currency: string (USD, EUR, etc.)
- timezone: string
- created_at: timestamp
- updated_at: timestamp
```

#### 2. **profiles** (Extended User Profiles)
```typescript
- user_id: UUID (Primary Key, references users.id)
- username: string (unique)
- email: string
- full_name: string
- avatar_url: string
- banner_url: string
- bio: text
- location: string
- website: string
- phone: string
- date_of_birth: string
- gender: string
- is_verified: boolean
- points: integer
- level: string
- role: string
- reputation: integer
- followers_count: integer
- following_count: integer
- posts_count: integer
- profile_views: integer
- is_online: boolean
- last_active: timestamp
- profile_visibility: string
- show_email: boolean
- show_phone: boolean
- allow_direct_messages: boolean
- allow_notifications: boolean
- preferred_currency: string
- timezone: string
- tier_level: string (tier_1, tier_2, tier_3, premium)
- kyc_trigger_reason: string
- tier_upgraded_at: timestamp
- font_size: string (small, medium, large)
- ui_language: string
- auto_play_videos: boolean
- reduced_motion: boolean
- high_contrast: boolean
- skills: text[] (array)
- social_links: jsonb (social media URLs)
- professional_info: jsonb
- linkedin_url: string
- github_url: string
- twitter_url: string
- portfolio_url: string
- created_at: timestamp
- updated_at: timestamp
```

#### 3. **posts** (Social Feed Posts)
```typescript
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- content: text (post text content)
- media_urls: jsonb (array of image/video URLs)
- type: string (text, image, video, link, poll)
- privacy: string (public, friends, private)
- location: string
- hashtags: text[] (array of hashtags)
- mentions: text[] (array of mentioned usernames)
- likes_count: integer
- comments_count: integer
- shares_count: integer
- views_count: integer
- is_pinned: boolean
- is_featured: boolean
- is_deleted: boolean
- deleted_at: timestamp
- scheduled_at: timestamp (for scheduled posts)
- created_at: timestamp
- updated_at: timestamp
```

#### 4. **post_comments** (Comments on Posts)
```typescript
- id: UUID (Primary Key)
- post_id: UUID (Foreign Key → posts)
- user_id: UUID (Foreign Key → users)
- content: text
- parent_id: UUID (for comment replies)
- likes_count: integer
- replies_count: integer
- is_deleted: boolean
- deleted_at: timestamp
- created_at: timestamp
- updated_at: timestamp
```

#### 5. **post_likes** (Post Engagement)
```typescript
- id: UUID (Primary Key)
- post_id: UUID (Foreign Key → posts)
- user_id: UUID (Foreign Key → users)
- created_at: timestamp
```

#### 6. **followers** (Follow Relationships)
```typescript
- id: UUID (Primary Key)
- follower_id: UUID (Foreign Key → users)
- following_id: UUID (Foreign Key → users)
- created_at: timestamp
```

### Marketplace Tables

#### 7. **products** (E-commerce Products)
```typescript
- id: UUID (Primary Key)
- seller_id: UUID (Foreign Key → users)
- title: string
- description: text
- price: numeric
- currency: string
- category: string
- stock_quantity: integer
- images: jsonb (array of image URLs)
- is_featured: boolean
- is_active: boolean
- is_digital: boolean
- digital_file_url: string (for digital products)
- views_count: integer
- sales_count: integer
- rating: numeric (1-5)
- created_at: timestamp
- updated_at: timestamp
```

#### 8. **orders** (Marketplace Orders)
```typescript
- id: UUID (Primary Key)
- buyer_id: UUID (Foreign Key → users)
- seller_id: UUID (Foreign Key → users)
- order_number: string (unique)
- status: string (pending, paid, shipped, delivered, cancelled)
- payment_status: string (pending, completed, failed)
- total_amount: numeric
- currency: string
- shipping_address: jsonb
- billing_address: jsonb
- tracking_number: string
- shipped_at: timestamp
- delivered_at: timestamp
- created_at: timestamp
- updated_at: timestamp
```

#### 9. **order_items** (Items in Orders)
```typescript
- id: UUID (Primary Key)
- order_id: UUID (Foreign Key → orders)
- product_id: UUID (Foreign Key → products)
- quantity: integer
- unit_price: numeric
- total_price: numeric
- product_snapshot: jsonb (product data at time of purchase)
- created_at: timestamp
```

#### 10. **product_reviews** (Product Ratings & Reviews)
```typescript
- id: UUID (Primary Key)
- product_id: UUID (Foreign Key → products)
- reviewer_id: UUID (Foreign Key → users)
- rating: integer (1-5)
- title: string
- comment: text
- verified_purchase: boolean
- helpful_count: integer
- created_at: timestamp
- updated_at: timestamp
```

#### 11. **marketplace_profiles** (Seller Store Information)
```typescript
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users, unique)
- store_name: string
- store_description: text
- store_logo: string
- store_banner: string
- business_type: string (individual, business)
- business_registration: string
- tax_id: string
- return_policy: text
- shipping_policy: text
- store_rating: numeric (0-5)
- total_sales: integer
- total_orders: integer
- response_rate: numeric
- response_time: string
- is_active: boolean
- seller_level: string (bronze, silver, gold)
- verification_status: string (pending, verified, rejected)
- created_at: timestamp
- updated_at: timestamp
```

### Crypto Tables

#### 12. **crypto_profiles** (User Crypto Profiles)
```typescript
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users, unique)
- wallet_address: string (unique)
- wallet_provider: string (metamask, ledger, etc.)
- kyc_status: string (pending, verified, rejected)
- kyc_verified_at: timestamp
- trading_volume: numeric
- total_trades: integer
- average_rating: numeric
- is_verified_trader: boolean
- preferred_currencies: text[] (array)
- trading_pairs: jsonb
- risk_tolerance: string (low, medium, high)
- investment_strategy: string
- notification_preferences: jsonb
- security_settings: jsonb (2FA, IP whitelist)
- created_at: timestamp
- updated_at: timestamp
```

#### 13. **crypto_wallets** (User Crypto Wallets)
```typescript
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- wallet_address: string
- chain_type: string (ethereum, bitcoin, polygon, etc.)
- balance: numeric (in smallest unit)
- currency: string (ETH, BTC, etc.)
- is_primary: boolean
- last_synced_at: timestamp
- created_at: timestamp
```

#### 14. **crypto_transactions** (Blockchain Transactions)
```typescript
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- wallet_id: UUID (Foreign Key → crypto_wallets)
- transaction_hash: string (blockchain tx hash)
- from_address: string
- to_address: string
- amount: numeric
- currency: string
- status: string (pending, confirmed, failed)
- transaction_type: string (deposit, withdraw, trade)
- timestamp: timestamp
- confirmations: integer
- metadata: jsonb (gas fees, etc.)
- created_at: timestamp
```

#### 15. **crypto_trades** (Crypto Trading History)
```typescript
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- from_currency: string
- to_currency: string
- from_amount: numeric
- to_amount: numeric
- rate: numeric (exchange rate)
- status: string (pending, completed, failed)
- trade_type: string (buy, sell, swap)
- created_at: timestamp
```

### Chat & Messaging Tables

#### 16. **chat_conversations** (Chat Threads)
```typescript
- id: UUID (Primary Key)
- user_id1: UUID (Foreign Key → users)
- user_id2: UUID (Foreign Key → users)
- last_message: text
- last_message_at: timestamp
- unread_count_user1: integer
- unread_count_user2: integer
- is_archived_user1: boolean
- is_archived_user2: boolean
- created_at: timestamp
- updated_at: timestamp
```

#### 17. **chat_messages** (Individual Messages)
```typescript
- id: UUID (Primary Key)
- conversation_id: UUID (Foreign Key → chat_conversations)
- sender_id: UUID (Foreign Key → users)
- content: text
- attachments: jsonb (array of file URLs)
- status: string (sent, delivered, read)
- read_at: timestamp
- created_at: timestamp
```

#### 18. **group_chat_threads** (Group Chat Rooms)
```typescript
- id: UUID (Primary Key)
- creator_id: UUID (Foreign Key → users)
- name: string
- description: text
- avatar_url: string
- is_private: boolean
- members_count: integer
- created_at: timestamp
- updated_at: timestamp
```

#### 19. **group_chat_participants** (Group Members)
```typescript
- id: UUID (Primary Key)
- group_id: UUID (Foreign Key → group_chat_threads)
- user_id: UUID (Foreign Key → users)
- role: string (member, moderator, admin)
- joined_at: timestamp
```

### Wallet & Payments Tables

#### 20. **wallet_transactions** (Payment Transactions)
```typescript
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- type: string (transfer, deposit, withdrawal, refund)
- from_user_id: UUID (if transfer)
- to_user_id: UUID (if transfer)
- amount: numeric
- currency: string
- description: string
- status: string (pending, completed, failed)
- payment_method: string (wallet, card, bank)
- reference_id: string
- created_at: timestamp
```

#### 21. **invoices** (Payment Invoices)
```typescript
- id: UUID (Primary Key)
- issuer_id: UUID (Foreign Key → users)
- recipient_id: UUID (Foreign Key → users)
- invoice_number: string (unique)
- amount: numeric
- currency: string
- description: text
- items: jsonb (array of line items)
- due_date: timestamp
- status: string (draft, sent, paid, overdue)
- paid_at: timestamp
- created_at: timestamp
- updated_at: timestamp
```

#### 22. **payment_links** (Payment Links for Invoices)
```typescript
- id: UUID (Primary Key)
- invoice_id: UUID (Foreign Key → invoices)
- user_id: UUID (Foreign Key → users)
- unique_code: string (unique)
- amount: numeric
- currency: string
- status: string (active, paid, expired)
- views_count: integer
- expires_at: timestamp
- created_at: timestamp
```

### Freelance Tables

#### 23. **freelance_profiles** (Freelancer Profiles)
```typescript
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users, unique)
- professional_title: string
- overview: text
- hourly_rate: numeric
- availability: string (available, partially_available, unavailable)
- experience_level: string (beginner, intermediate, expert)
- portfolio_url: string
- resume_url: string
- languages: jsonb (array with proficiency)
- education: jsonb (array of education records)
- certifications: jsonb (array of certifications)
- work_history: jsonb (array of work experience)
- services_offered: jsonb (array of services)
- preferred_project_size: string
- response_time: string
- success_rate: numeric (0-100)
- total_earnings: numeric
- completed_projects: integer
- repeat_clients: integer
- profile_completion: integer (0-100)
- is_available: boolean
- is_featured: boolean
- created_at: timestamp
- updated_at: timestamp
```

#### 24. **freelance_jobs** (Job Postings)
```typescript
- id: UUID (Primary Key)
- client_id: UUID (Foreign Key → users)
- title: string
- description: text
- category: string
- budget: numeric (min)
- budget_max: numeric
- currency: string
- duration: string (1-week, 1-month, 2-3-months, ongoing)
- experience_level: string (beginner, intermediate, expert)
- status: string (open, in_progress, completed, cancelled)
- required_skills: text[]
- attachments: jsonb
- views_count: integer
- proposals_count: integer
- created_at: timestamp
- updated_at: timestamp
```

#### 25. **freelance_proposals** (Freelancer Proposals)
```typescript
- id: UUID (Primary Key)
- job_id: UUID (Foreign Key → freelance_jobs)
- freelancer_id: UUID (Foreign Key → users)
- cover_letter: text
- proposed_rate: numeric
- proposed_duration: string
- status: string (pending, accepted, rejected, withdrawn)
- created_at: timestamp
- updated_at: timestamp
```

### Activity & Rewards Tables

#### 26. **referrals** (Referral System)
```typescript
- id: UUID (Primary Key)
- referrer_id: UUID (Foreign Key → users)
- referred_id: UUID (Foreign Key → users)
- referral_code: string (unique)
- status: string (pending, completed)
- reward_amount: numeric
- reward_currency: string
- created_at: timestamp
- completed_at: timestamp
```

#### 27. **user_rewards** (User Reward Points)
```typescript
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- points: integer
- tier: string (bronze, silver, gold, platinum)
- total_earned: integer
- total_redeemed: integer
- created_at: timestamp
- updated_at: timestamp
```

#### 28. **reward_rules** (Configurable Reward Rules)
```typescript
- id: UUID (Primary Key)
- action: string (like_post, comment, follow, purchase, referral)
- points_value: integer
- is_active: boolean
- created_at: timestamp
- updated_at: timestamp
```

### Stories Table

#### 29. **stories** (User Stories)
```typescript
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- media_url: string
- media_type: string (image, video)
- duration: integer (seconds, default 5)
- views_count: integer
- expires_at: timestamp (default: 24 hours)
- created_at: timestamp
```

### Admin & Settings Tables

#### 30. **system_settings** (Platform Configuration)
```typescript
- id: UUID (Primary Key)
- key: string (unique)
- value: jsonb
- description: text
- updated_by: UUID (Foreign Key → users)
- created_at: timestamp
- updated_at: timestamp
```

#### 31. **admin_activity_logs** (Admin Action Logs)
```typescript
- id: UUID (Primary Key)
- admin_id: UUID (Foreign Key → users)
- action: string (user_ban, content_delete, etc.)
- target_type: string (user, post, product)
- target_id: UUID
- details: jsonb
- created_at: timestamp
```

#### 32. **content_moderation_queue** (Flagged Content)
```typescript
- id: UUID (Primary Key)
- content_type: string (post, comment, product, profile)
- content_id: UUID
- reported_by: UUID (Foreign Key → users)
- reason: string
- status: string (pending, reviewed, approved, removed)
- reviewed_by: UUID (Foreign Key → users)
- action_taken: string
- created_at: timestamp
- reviewed_at: timestamp
```

---

## AUTHENTICATION & USER MANAGEMENT

### Authentication Flow

#### 1. User Registration (Sign Up)

**Process:**
1. User enters email, password, and full name
2. Frontend calls `AuthContext.signup(email, password, name, referralCode?)`
3. Backend calls `supabase.auth.signUp({ email, password, data: { full_name: name, username: generated_username } })`
4. Supabase creates auth user in `auth.users` table
5. Server-side trigger or application code creates record in `profiles` table
6. User receives verification email (if enabled)
7. Frontend receives session token and user object
8. User redirected to onboarding flow (optional KYC, profile setup)

**Code Example:**
```typescript
// src/contexts/AuthContext.tsx
const signup = useCallback(async (email: string, password: string, name: string, referralCode?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { 
        full_name: name,
        username: generateUsername(name),
        referral_code: referralCode
      },
    },
  });
  
  if (error) return { error };
  
  // Application code creates profile record
  if (data.user) {
    await ensureProfileExists(data.user.id);
  }
  
  return { error: null };
}, []);
```

#### 2. User Login (Sign In)

**Process:**
1. User enters email and password
2. Frontend calls `AuthContext.login(email, password)`
3. Backend calls `supabase.auth.signInWithPassword({ email, password })`
4. Supabase validates credentials and returns session token
5. Frontend stores session in localStorage (auto-managed by Supabase)
6. Frontend enriches user object with profile data from `profiles` table
7. User redirected to feed or previously visited page

**Code Example:**
```typescript
const login = useCallback(async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) return { error };
  
  // Enrich user data
  if (data.user) {
    const enrichedUser = await enhanceUserData(data.user);
    setUser(enrichedUser);
  }
  
  return { error: null };
}, []);
```

#### 3. Session Management

**Auto-Refresh:**
- Supabase SDK automatically refreshes tokens before expiry
- `persistSession: true` saves session in localStorage
- `autoRefreshToken: true` enables automatic refresh
- Session survives page reloads

**Logout:**
```typescript
const logout = useCallback(async () => {
  await supabase.auth.signOut();
  setUser(null);
  setSession(null);
}, []);
```

#### 4. User Enrichment

Every authenticated user object is enriched with:
```typescript
interface ExtendedUser extends User {
  name: string;
  username: string;
  avatar: string;
  avatar_url: string;
  points: number;
  level: string;
  role: string;
  reputation: number;
}
```

Data sources:
- `auth.users.user_metadata` (Supabase Auth metadata)
- `profiles` table (extended profile info)
- Fallback to generated values if not set

### Authorization & Roles

**User Roles:**
- `user` - Standard user
- `moderator` - Content moderation access
- `admin` - Full platform administration

**Check Admin Status:**
```typescript
const isAdmin = useCallback(() => {
  return user?.role === 'admin' || user?.metadata?.role === 'admin';
}, [user]);
```

**Protected Routes:**
```typescript
// src/App.tsx
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/auth" />;
  
  return children;
};
```

### Row Level Security (RLS)

**Enabled on these tables:**
- `users` - Users can view public info, edit own profile
- `profiles` - Similar to users
- `posts` - Public posts visible to all, private posts to creator
- `chat_messages` - Only conversation participants can view
- `products` - Sellers manage own products
- `orders` - Buyers see own orders, sellers see related orders
- `crypto_wallets` - Users see own wallets only
- And more (see migrations folder for all RLS policies)

**Example RLS Policy:**
```sql
-- Allow users to read public profiles
CREATE POLICY "public_profiles_readable" ON profiles
  FOR SELECT
  USING (profile_visibility = 'public' OR user_id = auth.uid());

-- Allow users to edit own profile
CREATE POLICY "own_profile_editable" ON profiles
  FOR UPDATE
  USING (user_id = auth.uid());
```

---

## CORE FEATURES & MODULES

### 1. SOCIAL FEED MODULE

**Overview:** Main content feed with posts, stories, and social interactions

**Key Features:**
- Create posts (text, images, videos, polls)
- Like posts
- Comment on posts (threaded replies)
- Share posts
- Repost/Quote posts
- Stories (temporary content, 24-hour expiry)
- Feed filtering (for-you, following, trending)
- Explore/discover content
- Save posts

**Database Tables:**
- `posts` - Post content
- `post_comments` - Comments
- `post_likes` - Engagement tracking
- `followers` - Follow relationships
- `stories` - Temporary stories

**Key Pages:**
- `/app/feed` - Main feed with tabs
- `/app/create-post` - Post creation
- `/app/post/:postId` - Post detail with comments
- `/app/saved` - Saved posts collection

**Key Components:**
```
src/components/feed/
├── UnifiedFeedContent.tsx      # Main feed content
├── EnhancedPostCard.tsx        # Post display
├── CommentSection.tsx          # Comments UI
├── CreatePostFlow.tsx          # Post creation form
├── StoryViewer.tsx             # Story viewing
├── EnhancedStoriesSection.tsx  # Stories list
└── ReactionPicker.tsx          # Like/emoji reactions
```

**Key Hooks:**
- `useFeedPosts()` - Fetch feed posts with pagination
- `useStories()` - Fetch user stories
- `useInfiniteScroll()` - Infinite loading

**Typical Flow:**
```typescript
// User creates post
CreatePostFlow → postService.createPost({
  content,
  media_urls,
  privacy,
  hashtags
}) → insert into 'posts' table → notify followers

// User views feed
useFeedPosts() → supabase.from('posts').select(...)
  .order('created_at', { ascending: false })
  .limit(20) → render EnhancedPostCard components
```

---

### 2. MARKETPLACE MODULE

**Overview:** E-commerce platform for buying and selling products

**Key Features:**
- Browse products by category
- Search and filter products
- View product details with images, reviews
- Add to cart
- Wishlist management
- Checkout with shipping address
- Order tracking
- Product reviews and ratings
- Seller storefront
- Seller dashboard with analytics

**Database Tables:**
- `products` - Product listings
- `orders` - Purchase orders
- `order_items` - Items in order
- `product_reviews` - Ratings and reviews
- `marketplace_profiles` - Seller store info
- `shopping_cart` - User cart items
- `wishlist` - Saved products

**Key Pages:**
- `/app/marketplace` - Browse products
- `/app/marketplace/product/:productId` - Product detail
- `/app/marketplace/cart` - Shopping cart
- `/app/marketplace/checkout` - Checkout process
- `/app/marketplace/orders` - Order history
- `/app/marketplace/seller` - Seller dashboard
- `/app/marketplace/list` - Create new product listing

**Key Components:**
```
src/components/marketplace/
├── ProductCard.tsx             # Product card display
├── EnhancedProductDetail.tsx   # Product details page
├── FunctionalShoppingCart.tsx  # Cart UI
├── CheckoutFlow.tsx            # Checkout wizard
├── EnhancedWishlist.tsx        # Wishlist management
├── SellerDashboard.tsx         # Seller analytics
└── ReviewSection.tsx           # Product reviews
```

**Typical Flow:**
```typescript
// User purchases product
ProductDetail → AddToCart → Cart → Checkout
→ orderService.createOrder({
  buyer_id, seller_id, items, shipping_address, total
})
→ insert 'orders' and 'order_items'
→ Process payment (Stripe)
→ Send order confirmation

// Seller creates product
CreateListing → uploadImages to Storage
→ productService.createProduct({
  title, description, price, images, category
})
→ insert into 'products' table
```

---

### 3. CRYPTOCURRENCY MODULE

**Overview:** Crypto wallets, trading, and P2P transactions

**Key Features:**
- Connect crypto wallet (MetaMask, Ledger, etc.)
- View wallet balances across chains
- Buy/sell cryptocurrencies (via DEX or CEX)
- P2P trading marketplace
- Crypto transaction history
- Price charts and market data
- KYC verification for trading
- Portfolio tracking
- Real-time price updates

**Database Tables:**
- `crypto_profiles` - User crypto profile
- `crypto_wallets` - Wallet addresses and balances
- `crypto_transactions` - Transaction history
- `crypto_trades` - Trade records
- `crypto_prices` - Real-time pricing data

**Key Pages:**
- `/app/crypto` - Crypto overview/portfolio
- `/app/crypto/view-all` - All tradable coins
- `/app/crypto/coin/:symbol` - Coin detail with chart
- `/app/crypto/p2p/create-offer` - P2P offer creation
- `/app/crypto/kyc` - KYC verification
- `/app/crypto/deposit` - Deposit crypto
- `/app/crypto/withdraw` - Withdraw crypto

**Key Components:**
```
src/components/crypto/
├── CryptoTradePanel.tsx        # Trading interface
├── CryptoWalletBalanceCard.tsx # Wallet display
├── PriceChart.tsx              # Price visualization
├── CryptoDepositModal.tsx      # Deposit UI
├── CryptoWithdrawModal.tsx     # Withdraw UI
├── P2PMarketplace.tsx          # P2P listing
└── CryptoKYCModal.tsx          # KYC form
```

**External Integrations:**
- **CoinGecko API** - Real-time crypto prices
- **Bybit API** - Trading and market data
- **Wallet Providers** - MetaMask, WalletConnect

**Typical Flow:**
```typescript
// User trades crypto
CryptoTradePanel → cryptoService.executeTrade({
  from_currency, to_currency, amount
})
→ Call CoinGecko/Bybit API for rates
→ Execute trade on blockchain/CEX
→ Record transaction in 'crypto_transactions'
→ Update wallet balance in 'crypto_wallets'
```

---

### 4. CHAT & MESSAGING MODULE

**Overview:** Real-time 1:1 and group messaging

**Key Features:**
- 1:1 direct messages (DMs)
- Group chat rooms
- Real-time message delivery
- Message status (sent, delivered, read)
- File/image sharing in chats
- Typing indicators
- Message search
- Chat history
- Group members management
- Notifications for new messages

**Database Tables:**
- `chat_conversations` - 1:1 chat threads
- `chat_messages` - Individual messages
- `group_chat_threads` - Group chat rooms
- `group_chat_participants` - Group members
- `group_messages` - Messages in groups

**Real-Time Technology:**
- **Socket.io** - WebSocket connection for real-time updates
- **Supabase Realtime** - Channel subscriptions for DB changes

**Key Pages:**
- `/app/chat` - Chat inbox/list
- `/app/chat/:threadId` - Chat room
- `/app/chat/create-group` - Create group chat
- `/app/chat/find-users` - User search for DM

**Key Components:**
```
src/components/chat/
├── UnifiedChatInterface.tsx    # Main chat UI
├── ChatListSidebar.tsx         # Chat list
├── ChatMessage.tsx             # Message bubble
├── ChatInput.tsx               # Message input
├── TypingIndicator.tsx         # User typing indicator
├── ImageUploadModal.tsx        # Media upload
└── group/
    ├── GroupSettingsModal.tsx  # Group config
    └── GroupParticipantsManager.tsx
```

**Key Hooks:**
- `useRealtimeMessaging()` - Socket.io subscription
- `useChatHistory()` - Load chat messages

**Typical Flow:**
```typescript
// User sends message
ChatInput → onSendMessage()
→ emit('message.send', { conversationId, content })
→ Socket.io sends to server
→ Server inserts into 'chat_messages'
→ Broadcast to all participants via Socket.io
→ Subscribers receive message in real-time
→ UI updates ChatMessage list
```

---

### 5. FREELANCE MARKETPLACE MODULE

**Overview:** Job posting and freelancer hiring platform

**Key Features:**
- Post jobs with requirements and budget
- Browse available jobs
- Submit proposals as freelancer
- Messaging with clients/freelancers
- Contract management
- Escrow payments (via wallet)
- Invoice generation
- Milestone-based payments
- Freelancer ratings and reviews
- Dashboard with analytics (earnings, projects)

**Database Tables:**
- `freelance_profiles` - Freelancer profiles
- `freelance_jobs` - Job postings
- `freelance_proposals` - Freelancer proposals
- `freelance_payments` - Payment records
- `freelance_stats` - Performance metrics

**Key Pages:**
- `/app/freelance` - Freelance overview
- `/app/freelance/dashboard` - Freelancer/Client dashboard
- `/app/freelance/create-job` - Create job posting
- `/app/freelance/:jobId` - Job detail
- `/app/freelance/apply/:jobId` - Apply to job
- `/app/freelance/withdraw` - Payment withdrawal
- `/app/freelance/create-invoice` - Invoice creation

**Key Components:**
```
src/components/freelance/
├── FreelanceWalletCard.tsx     # Earnings display
├── JobListCard.tsx             # Job listing card
├── JobDetailView.tsx           # Job details
├── ProposalForm.tsx            # Proposal submission
├── FreelancerDashboard.tsx     # Analytics dashboard
├── InvoiceGenerator.tsx        # Invoice creation
└── EscrowManager.tsx           # Payment escrow
```

**Typical Flow:**
```typescript
// Client creates job
CreateJob → jobService.createJob({
  title, description, budget, skills_required
})
→ insert into 'freelance_jobs'
→ Notify freelancers

// Freelancer applies
JobDetail → ProposalForm → proposalService.submitProposal({
  job_id, freelancer_id, cover_letter, proposed_rate
})
→ insert into 'freelance_proposals'
→ Notify client

// Client accepts & pays
FreelanceDashboard → selectProposal()
→ walletService.createEscrow({
  freelancer_id, amount, job_id
})
→ Funds held in escrow until completion
```

---

### 6. WALLET & PAYMENTS MODULE

**Overview:** User wallet management, transactions, and payments

**Key Features:**
- Wallet balance display (primary currency)
- Send money to other users
- Request money from other users
- Deposit funds (via payment gateway)
- Withdraw funds (to bank or crypto)
- Transaction history and export
- Payment links for invoices
- Invoice management
- Recurring payments
- Multi-currency support
- Purchase tracking

**Database Tables:**
- `wallet_transactions` - All transactions
- `invoices` - Invoice records
- `payment_links` - Shareable payment links
- `receipts` - Transaction receipts
- `payouts` - Withdrawal records

**Payment Gateways:**
- **Stripe** - Credit card payments
- **Bank Transfer** - Direct bank transfers
- **Crypto Wallets** - Cryptocurrency deposits
- **Airtime/Mobile** - Top-up via Reloadly

**Key Pages:**
- `/app/wallet` - Wallet overview
- `/app/wallet/transactions` - Transaction history
- `/app/wallet/send-money` - Send money form
- `/app/wallet/request` - Request money
- `/app/wallet/deposit` - Add funds
- `/app/wallet/withdraw` - Withdraw funds
- `/app/wallet/invoices` - Invoice management
- `/app/wallet/payment-links` - Payment link creation

**Key Components:**
```
src/components/wallet/
├── WalletCard.tsx              # Balance display
├── UnifiedWalletDashboard.tsx  # Main dashboard
├── TransactionsTable.tsx       # Transaction list
├── DepositModal.tsx            # Deposit funds
├── WithdrawModal.tsx           # Withdraw funds
├── InvoiceForm.tsx             # Create invoice
├── SendMoneyForm.tsx           # Send money
└── PaymentMethodSelector.tsx   # Payment method choice
```

**Typical Flow:**
```typescript
// User sends money
SendMoneyForm → walletService.sendMoney({
  recipient_id, amount, description
})
→ Create transaction record
→ Deduct from sender wallet
→ Add to recipient wallet
→ Notify both users
→ Record in 'wallet_transactions'

// User creates invoice
InvoiceForm → invoicingService.createInvoice({
  recipient_id, amount, description, items
})
→ insert into 'invoices'
→ Generate payment_link
→ Send link to recipient
→ Recipient clicks link to pay
```

---

### 7. USER PROFILES MODULE

**Overview:** User profiles and social connections

**Key Features:**
- View public/private profiles
- Edit profile information (bio, avatar, cover image)
- Follow/unfollow users
- View follower/following lists
- Profile statistics (posts, followers, engagement)
- User verification badges
- User level/tier display
- Skills and professional info
- Social media links
- Profile tabs (posts, media, likes, followers, following)

**Database Tables:**
- `profiles` - User profile information
- `followers` - Follow relationships
- `users` - User metadata

**Key Pages:**
- `/app/profile` - Current user's profile
- `/app/profile/:username` - View user profile
- `/app/profile/:username/posts` - User's posts
- `/app/profile/:username/followers` - Follower list
- `/app/profile/:username/following` - Following list
- `/app/profile/:username/stats` - Profile statistics
- `/app/profile/edit` - Edit profile

**Key Components:**
```
src/components/profile/
├── ProfileHeader.tsx           # Profile info header
├── ProfilePostCard.tsx         # User's posts
├── ProfileStatsCarousel.tsx    # Stats display
├── EditProfileForm.tsx         # Edit form
├── FollowersList.tsx           # Followers/following
└── ProfileTabs.tsx             # Tab navigation
```

**Typical Flow:**
```typescript
// User views profile
useProfile(username) → supabase.from('profiles')
  .select(...)
  .eq('username', username)
→ Render ProfileHeader, stats, posts tabs
→ useInfiniteScroll for post loading

// User edits profile
EditProfileForm → profileService.updateProfile({
  bio, avatar_url, banner_url, skills
})
→ update 'profiles' table
→ Update local cache
→ Show success toast
```

---

### 8. ADMIN & MODERATION MODULE

**Overview:** Platform management and content moderation

**Key Features:**
- Admin dashboard with KPIs
- User management (ban, promote, permissions)
- Content moderation (flag/remove posts, products)
- Analytics and reporting
- System settings configuration
- Feature toggles
- Audit logs
- User reports handling
- Marketplace management
- Crypto transaction monitoring
- Blog/announcement management

**Database Tables:**
- `admin_activity_logs` - Admin action tracking
- `content_moderation_queue` - Flagged content
- `system_settings` - Platform configuration
- `user_reports` - User-reported content

**Key Pages:**
- `/admin/dashboard` - Admin overview
- `/admin/users` - User management
- `/admin/management` - General management
- `/admin/moderation` - Content moderation
- `/admin/settings` - System settings
- `/admin/analytics` - Platform analytics
- `/admin/marketplace` - Marketplace management
- `/admin/crypto` - Crypto monitoring
- `/admin/kyc` - KYC verification queue

**Key Components:**
```
src/components/admin/
├── AdminDashboard.tsx          # Overview metrics
├── UserManagementTable.tsx     # User management
├── ModerationQueue.tsx         # Flagged content
├── AnalyticsCharts.tsx         # Charts & graphs
├── AdminSidebar.tsx            # Admin navigation
└── SystemSettingsPanel.tsx     # Configuration
```

---

### 9. REWARDS & LOYALTY MODULE

**Overview:** Points system, referrals, and gamification

**Key Features:**
- Earn points for actions (posts, purchases, referrals)
- Point redemption for rewards/gifts
- Referral system with commissions
- Loyalty tiers (bronze, silver, gold, platinum)
- Leaderboard rankings
- Achievement badges
- Gift card purchasing with points
- Send gifts to other users
- Reward history tracking

**Database Tables:**
- `referrals` - Referral records
- `user_rewards` - User reward points
- `reward_rules` - Configurable rewards
- `reward_transactions` - Reward history
- `pioneer_badges` - Achievement badges

**Key Pages:**
- `/app/rewards` - Rewards overview
- `/app/rewards/leaderboard` - Top users
- `/app/rewards/history` - Reward history
- `/app/rewards/send-gifts` - Send gifts
- `/app/referral` - Referral dashboard

**Reward Actions:**
- Like post: 5 points
- Comment: 10 points
- Create post: 25 points
- Purchase: 1 point per currency unit
- Referral: Variable based on referee's activity
- Course completion: 100 points
- Verified purchase review: 50 points

---

### 10. SETTINGS & PREFERENCES MODULE

**Overview:** User settings and preferences

**Key Features:**
- Account settings (email, password, 2FA)
- Privacy settings (profile visibility, DM restrictions)
- Notification preferences
- App preferences (theme, language, font size)
- Currency and timezone settings
- Account deletion
- Data export

**Key Pages:**
- `/app/settings` - Main settings
- `/app/settings/account` - Account settings
- `/app/settings/privacy` - Privacy controls
- `/app/settings/notifications` - Notification preferences
- `/app/settings/appearance` - Theme and display
- `/app/settings/delete-account` - Account deletion

---

## PAGE-BY-PAGE UI/UX DOCUMENTATION

### Authentication Pages

#### 1. **Landing Page** (`/`)
**URL Path:** `/`  
**Component:** `src/home/Layout.tsx`, `src/home/HeroSection.tsx`, `src/home/Header.tsx`

**Purpose:** Marketing/onboarding page for new visitors

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│        HEADER (Sticky/Fixed)            │
│  Logo    Navigation    Sign In/Sign Up  │
└─────────────────────────────────────────┘
│                                         │
│         HERO SECTION                    │
│   • Hero image/background gradient      │
│   • Main headline with gradient text    │
│   • Subheadline                         │
│   • CTA buttons (Start Earning)         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│       FEATURES SHOWCASE                 │
│   • 3-4 feature cards with icons        │
│   • Feature descriptions                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│       HOW IT WORKS (Steps)              │
│   • Step 1: Create Account              │
│   • Step 2: Complete Profile            │
│   • Step 3: Start Earning               │
│   • Step 4: Grow with Community         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│        TESTIMONIALS/SOCIAL PROOF        │
│   • User quotes                         │
│   • Stats/metrics                       │
│                                         │
├─────────────────────────────────────────┤
│         FOOTER                          │
│  Links, Copyright, Social Icons         │
└─────────────────────────────────────────┘
```

**UI Elements:**
- **Header:** Logo, nav links (Home, Features, FAQ), Sign In/Join buttons
- **Hero:** Gradient background, large headline, description text, CTA button
- **Features:** Icon + title + description grid (3-4 items)
- **Steps:** Numbered cards with icons and explanations
- **Colors:** Primary (accent), secondary (neutral grays), gradient overlays

**Responsive Design:**
- **Desktop:** Multi-column layouts
- **Mobile:** Single column, stacked components

---

#### 2. **Authentication Page** (`/auth`)
**URL Path:** `/auth`  
**Component:** `src/pages/AuthPage.tsx`

**Purpose:** User login/signup

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│                                         │
│     CENTERED AUTH CARD (max-w-md)       │
│  ┌───────────────────────────────────┐  │
│  │    Eloity Logo                    │  │
│  │                                   │  │
│  │    Tab: Sign In | Sign Up         │  │
│  │                                   │  │
│  │  [Form Fields]                    │  │
│  │  • Email/Username input           │  │
│  │  • Password input                 │  │
│  │  • Remember me (checkbox)         │  │
│  │                                   │  │
│  │  [Sign In Button]                 │  │
│  │                                   │  │
│  │  Or continue with:                │  │
│  │  [Google] [Facebook]              │  │
│  │                                   │  │
│  │  Don't have an account? Sign Up   │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**UI Elements:**
- **Tabs:** Sign In / Sign Up toggle
- **Form Fields:**
  - Sign In: Email, Password
  - Sign Up: Email, Password, Confirm Password, Full Name
- **Social Login Buttons:** Google, Facebook, Twitter icons
- **Links:** "Forgot password?", "Sign Up/In" toggle
- **Validation:** Real-time error messages below inputs

**Form Validation:**
- Email: Valid email format
- Password: Min 8 characters
- Password confirmation: Must match

**Error Handling:**
- Invalid credentials → "Email or password incorrect" message
- Email already exists → "Email already in use"
- Network error → "Something went wrong, please try again"

---

### Protected App Pages

#### 3. **Feed Page** (`/app/feed`)
**URL Path:** `/app/feed?tab=for-you`  
**Component:** `src/pages/Feed.tsx`

**Purpose:** Main social media feed with posts and stories

**Layout Structure:**
```
┌──────────────────────────────────────────────────────────┐
│            APP HEADER (Navigation Bar)                   │
│  Logo  [Search]  Notifications  Messages  [Avatar ▼]     │
└──────────────────────────────────────────────────────────┘
│
├─────────────────┬────────────────────────┬──────────────┐
│                 │                        │              │
│  LEFT SIDEBAR   │   MAIN FEED (600px)    │  RIGHT SIDEBAR
│  (Sticky)       │                        │  (1024px+)
│                 │                        │
│ [Home]          │  ┌────────────────────┐│  Suggested
│ [Explore]       │  │ STORIES CAROUSEL   ││  Users
│ [Saved]         │  │ [👤 Your] [👤 U2] ││  • @user1
│ [Messages]      │  │ [👤 U3] [👤 U4]   ││    2.5k followers
│ [Chat]          │  └────────────────────┘│  [Follow]
│ [Marketplace]   │                        │
│ [Freelance]     │  TABS: For You | Following
│ [Wallet]        │                        │  • @user2
│ [Crypto]        │  ┌────────────────────┐│    1.2k followers
│ [Profile]       │  │ CREATE POST BOX    ││  [Follow]
│ [Settings]      │  │ [Avatar] What's on ││
│                 │  │ your mind?         ││  Trending
│ [Logout]        │  │ [📷] [🎥] [😊] [📍]││  #crypto
│                 │  └────────────────────┘│  #nft
│                 │                        │  #gaming
│                 │  ┌────────────────────┐│  View More
│                 │  │  POST CARD 1       ││
│                 │  │  ┌──────────────┐  ││
│                 │  │  │ Avatar | Name│  ││
│                 │  │  │ @username    │  ││
│                 │  │  ├──────────────┤  ││
│                 │  │  │ Post content │  ││
│                 │  │  │ text here... │  ││
│                 │  │  │ [Image] [V]  │  ││
│                 │  │  ├──────────────┤  ││
│                 │  │  │ ❤️ 234      │  ││
│                 │  │  │ 💬 45   📤 12│  ││
│                 │  │  │ 🔖 8   ••• 🔽 │  ││
│                 │  │  └──────────────┘  ││
│                 │  │                    ││
│                 │  │  More posts...     ││
│                 │  │  (infinite scroll) ││
│                 │  └────────────────────┘│
│                 │                        │
└─────────────────┴────────────────────────┴──────────────┘
```

**Key Components:**
1. **Stories Carousel**
   - Horizontal scrolling carousel
   - Each story is user avatar + name
   - Click to open StoryViewer
   - "+ Add story" option for current user

2. **Create Post Box**
   - User avatar + "What's on your mind?" placeholder
   - Media upload buttons: 📷 Image, 🎥 Video, 😊 Emoji, 📍 Location
   - "Post" button (appears when text entered)

3. **Post Card**
   - Header: Avatar, username, handle, timestamp, ... menu
   - Content: Post text
   - Media: Image gallery or video player
   - Engagement: Like count, comment count, share count
   - Action Buttons: ❤️ Like, 💬 Comment, 📤 Share, 🔖 Bookmark, ⋮ More
   - Hover Effect: Highlight on hover, show more options

4. **Left Sidebar**
   - Navigation items (Home, Explore, Saved, etc.)
   - User status indicator
   - Logout button at bottom

5. **Right Sidebar** (Desktop only)
   - "Suggested For You" section (2-5 users)
   - Each item: Avatar + name + followers count + Follow button
   - "Trending" section with hashtags
   - "View More" link to explore page

**Tabs:**
- **For You:** Algorithm-based personalized feed
- **Following:** Posts from followed users only

**Interactions:**
- Scroll down → infinite load more posts (lazy loading)
- Click post → Navigate to `/app/post/:postId`
- Click comment → Open comment section (inline or modal)
- Click like → Toggle like state, update count
- Click avatar → Navigate to `/app/profile/:username`

**Loading States:**
- First load: Skeleton cards (post count: 3)
- Infinite scroll: Small skeleton card appended
- Pull-to-refresh: Refresh icon

**Responsive Behavior:**
- **Desktop (1024px+):** Full 3-column layout
- **Tablet (768px-1023px):** Main + right sidebar (if space), left sidebar collapsed
- **Mobile (< 768px):** Single column, hamburger menu for sidebar, bottom nav bar

**Performance:**
- Virtual scrolling for feed items
- Lazy load images (intersection observer)
- Memoized components (React.memo for post cards)

---

#### 4. **Create Post Page** (`/app/create-post`)
**URL Path:** `/app/create-post`  
**Component:** `src/pages/CreatePost.tsx`, `src/components/feed/CreatePostFlow.tsx`

**Purpose:** Compose and publish new posts

**Layout Structure:**
```
┌──────────────────────────────────────────┐
│         Create Post Modal/Page           │
│  ┌──────────────────────────────────────┐│
│  │ ✕                                    ││
│  │ CREATE A POST                        ││
│  ├──────────────────────────────────────┤│
│  │                                      ││
│  │ [Avatar] Username                    ││
│  │          Public ▼                    ││
│  │                                      ││
│  │ [Textarea: Write your post...]       ││
│  │                                      ││
│  │ [Image previews if selected]         ││
│  │ ┌──────────┐ ┌──────────┐           ││
│  │ │ Image 1  │ │ Image 2  │           ││
│  │ │      [✕] │ │      [✕] │           ││
│  │ └──────────┘ └──────────┘           ││
│  │                                      ││
│  │ [Toolbar]                            ││
│  │ [📷] [🎥] [😊] [📍] [Aa]            ││
│  │                                      ││
│  │ Post visibility:                     ││
│  │ ◉ Public  ○ Friends  ○ Private      ││
│  │                                      ││
│  │ Add hashtags: [#]                    ││
│  │                                      ││
│  │                    [Cancel]  [Post] ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

**Key Features:**
1. **Text Editor**
   - Textarea with auto-expand
   - Character count (if limit)
   - Mention suggestions (@username)
   - Hashtag suggestions (#hashtag)

2. **Media Upload**
   - Click to upload or drag-drop images/videos
   - Preview with remove button (✕)
   - Multiple image support (gallery)
   - Video preview with play icon

3. **Privacy Settings**
   - Radio buttons: Public, Friends Only, Private
   - Privacy help text

4. **Formatting Toolbar**
   - 📷 Image/Video upload
   - 🎥 Video
   - 😊 Emoji picker
   - 📍 Location tag
   - Aa Font styling

5. **Action Buttons**
   - [Cancel] - Close without saving
   - [Post] - Disabled until content entered, shows loading state while posting

**Validation:**
- Content required (min 1 character)
- Max 5 media files
- Media file size limits (images: 10MB, videos: 100MB)

**Success Feedback:**
- Toast notification: "Post published successfully"
- Redirect to feed or stay on page

**Error Handling:**
- Upload failure → Show retry button
- Network error → Show error toast with retry

---

#### 5. **Post Detail Page** (`/app/post/:postId`)
**URL Path:** `/app/post/:postId`  
**Component:** `src/pages/PostDetail.tsx`

**Purpose:** View single post with full comments thread

**Layout Structure:**
```
┌──────────────────────────────────────────────┐
│       Post Detail View                       │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ [← Back to Feed]                         ││
│  │                                          ││
│  │ ┌────────────────────────────────────┐  ││
│  │ │ POST (FULL WIDTH)                  │  ││
│  │ │ Avatar | Username @handle          │  ││
│  │ │ 2 hours ago  • •                   │  ││
│  │ │                                    │  ││
│  │ │ Full post content here...          │  ││
│  │ │                                    │  ││
│  │ │ [Full image/video gallery]         │  ││
│  │ │ ┌──────────────┐ ┌──────────────┐ │  ││
│  │ │ │   Image 1    │ │   Image 2    │ │  ││
│  │ │ └──────────────┘ └──────────────┘ │  ││
│  │ │                                    │  ││
│  │ │ Engagement:                        │  ││
│  │ │ ❤️ 1.2k   💬 234   📤 89          │  ││
│  │ │ 🔖 45    ↗️ Share                  │  ││
│  │ │                                    │  ││
│  │ │ ┌──────────────────────────────┐  │  ││
│  │ │ │ Like | Comment | Share | ... │  │  ││
│  │ │ └──────────────────────────────┘  │  ││
│  │ └────────────────────────────────────┘  ││
│  │                                          ││
│  │ ┌────────────────────────────────────┐  ││
│  │ │ COMMENTS SECTION                   │  ││
│  │ │                                    │  ││
│  │ │ [Write a comment...]               │  ││
│  │ │                                    │  ││
│  │ │ ┌────────────────────────────────┐ │  ││
│  │ │ │ COMMENT 1                      │ │  ││
│  │ │ │ Avatar | Name @handle          │ │  ││
│  │ │ │ "Comment text here..."         │ │  ││
│  │ │ │ 1 hour ago                     │ │  ││
│  │ │ │ ❤️ 45  💬 2 replies  ↗️ Reply   │ │  ││
│  │ │ │                                │ │  ││
│  │ │ │ [Show 2 replies ▼]             │ │  ││
│  │ │ │                                │ │  ││
│  │ │ │ ┌────────────────────────────┐ │ │  ││
│  │ │ │ │ REPLY 1 (Indented)         │ │ │  ││
│  │ │ │ │ Avatar | Name @handle      │ │ │  ││
│  │ │ │ │ "Reply text..."            │ │ │  ││
│  │ │ │ │ 30 min ago                 │ │ │  ││
│  │ │ │ │ ❤️ 12  ↗️ Reply             │ │ │  ││
│  │ │ │ └────────────────────────────┘ │ │  ││
│  │ │ │                                │ │  ││
│  │ │ │ ┌────────────────────────────┐ │ │  ││
│  │ │ │ │ REPLY 2 (Indented)         │ │ │  ││
│  │ │ │ │ Avatar | Name @handle      │ │ │  ││
│  │ │ │ │ "Reply text..."            │ │ │  ││
│  │ │ │ │ 15 min ago                 │ │ │  ││
│  │ │ │ │ ❤️ 5   ↗️ Reply             │ │ │  ││
│  │ │ │ └────────────────────────────┘ │ │  ││
│  │ │ │                                │ │  ││
│  │ │ └────────────────────────────────┘ │  ││
│  │ │                                    │  ││
│  │ │ ┌────────────────────────────────┐ │  ││
│  │ │ │ COMMENT 2                      │ │  ││
│  │ │ │ Avatar | Name @handle          │ │  ││
│  │ │ │ "Another comment..."           │ │  ││
│  │ │ │ 45 min ago                     │ │  ││
│  │ │ │ ❤️ 23  💬 0 replies  ↗️ Reply   │ │  ││
│  │ │ └────────────────────────────────┘ │  ││
│  │ │                                    │  ││
│  │ │ [Load more comments]               │  ││
│  │ │                                    │  ││
│  │ └────────────────────────────────────┘  ││
│  │                                          ││
│  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

**Key Sections:**
1. **Post Display** (Full Width)
   - User info + timestamp
   - Post content and media
   - Engagement metrics
   - Action buttons

2. **Comment Input**
   - User avatar
   - Textarea with placeholder
   - Submit button
   - Emoji picker

3. **Comments Thread**
   - Sorted by most recent/popular
   - Threaded replies (indented)
   - Expandable "Show X replies" button
   - Each comment shows: avatar, name, handle, timestamp, text, like count, reply button
   - Infinite scroll for more comments

4. **Reply UI**
   - Replies nested under parent comment
   - Same structure as parent comment
   - Reply input appears inline when "Reply" clicked

**Interactions:**
- Click avatar → Navigate to user profile
- Click like → Toggle like, update count
- Click reply → Show reply input box
- Submit comment → Add to thread, update count
- Scroll down → Load more comments

---

#### 6. **Marketplace Page** (`/app/marketplace`)
**URL Path:** `/app/marketplace`  
**Component:** `src/pages/marketplace/MarketplaceHomepage.tsx`

**Purpose:** Browse and discover products

**Layout Structure:**
```
┌──────────────────────────────────────────────────────┐
│         APP HEADER                                   │
└──────────────────────────────────────────────────────┘
│
│ ┌────────────────────────────────────────────────────┐
│ │ HERO SECTION                                       │
│ │ [Search Bar]      [Category Filter ▼]             │
│ │ [Sort: Latest ▼]  [Filter ⚙️]                     │
│ └────────────────────────────────────────────────────┘
│
│ ┌────────────────────────────────────────────────────┐
│ │ FEATURED PRODUCTS (Carousel)                       │
│ │ < [Product 1] [Product 2] [Product 3] >           │
│ └────────────────────────────────────────────────────┘
│
│ ┌────────────────────────────────────────────────────┐
│ │ CATEGORY TABS                                      │
│ │ [All] [Electronics] [Fashion] [Books] [Art] [More]│
│ └────────────────────────────────────────────────────┘
│
│ PRODUCT GRID (3-4 columns based on width)
│ ┌──────────────┬──────────────┬──────────────┐
│ │ PRODUCT 1    │ PRODUCT 2    │ PRODUCT 3    │
│ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │
│ │ │          │ │ │          │ │ │          │ │
│ │ │ [Image]  │ │ │ [Image]  │ │ │ [Image]  │ │
│ │ │          │ │ │          │ │ │          │ │
│ │ └──────────┘ │ └──────────┘ │ └──────────┘ │
│ │ Title        │ Title        │ Title        │
│ │ $99.99       │ $49.99       │ $199.99      │
│ │ ⭐⭐⭐⭐⭐   │ ⭐⭐⭐⭐     │ ⭐⭐⭐      │
│ │ (234 reviews)│ (89 reviews) │ (45 reviews) │
│ │ [♥ Add]      │ [♥ Add]      │ [♥ Add]      │
│ │ [⊕ Cart]     │ [⊕ Cart]     │ [⊕ Cart]     │
│ └──────────────┴──────────────┴──────────────┘
│
│ ┌──────────────┬──────────────┬──────────────┐
│ │ PRODUCT 4    │ PRODUCT 5    │ PRODUCT 6    │
│ │ ... (similar layout)                      │
│ └──────────────┴──────────────┴──────────────┘
│
│ [Load More Products]
│
└──────────────────────────────────────────────────────┘
```

**Key Components:**

1. **Search & Filter Bar**
   - Search input: "Search products..."
   - Category dropdown
   - Sort options: Latest, Popular, Price (Low→High), Price (High→Low), Rating
   - Filter button (opens modal/panel): By price, rating, seller, brand, etc.

2. **Product Cards**
   - Product image (with hover zoom)
   - Product name (truncated with ellipsis)
   - Price
   - Star rating + review count
   - Seller info (optional)
   - Wishlist icon (♥ outline/filled)
   - Add to cart button (⊕)
   - Badge for "Sale", "New", "Featured" (if applicable)

3. **Responsive Grid**
   - Desktop (1280px+): 4 columns
   - Tablet (768px-1279px): 3 columns
   - Mobile (<768px): 2 columns

**Interactions:**
- Click product → Navigate to `/app/marketplace/product/:productId`
- Click wishlist → Add/remove from wishlist, toggle icon
- Click cart → Add to cart, show toast confirmation
- Scroll down → Infinite load more products
- Apply filters → Update product grid

**Loading State:**
- Skeleton cards while loading
- Smooth fade-in animation

---

#### 7. **Product Detail Page** (`/app/marketplace/product/:productId`)
**URL Path:** `/app/marketplace/product/:productId`  
**Component:** `src/pages/marketplace/MarketplaceProductDetail.tsx`

**Purpose:** View product details and make purchase decision

**Layout Structure:**
```
┌──────────────────────────────────────────────────────────┐
│ [← Back to Marketplace]                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────────────┬──────────────────────────┐  │
│ │                         │                          │  │
│ │   PRODUCT IMAGE         │  PRODUCT INFO            │  │
│ │   (Main Image Large)    │                          │  │
│ │                         │  Title                   │  │
│ │ ┌───────────────────┐   │  "Product Title Here"    │  │
│ │ │                   │   │                          │  │
│ │ │    [Main Image]   │   │  Rating: ⭐⭐⭐⭐⭐       │  │
│ │ │                   │   │  (234 reviews)           │  │
│ │ │                   │   │                          │  │
│ │ │    Click for      │   │  Price: $99.99           │  │
│ │ │    full view      │   │  Discount: -10% ($89.99) │  │
│ │ │                   │   │  Stock: 5 items left     │  │
│ │ │                   │   │                          │  │
│ │ └───────────────────┘   │  Seller: @seller_name    │  │
│ │                         │  ✓ Verified Seller       │  │
│ │ Thumbnail Gallery:      │  4.8 store rating        │  │
│ │ [Thumb1][Thumb2]...     │                          │  │
│ │                         │  Options:                │  │
│ │                         │  Size: [S] [M] [L] [XL]  │  │
│ │                         │  Color: [Red] [Blue]...  │  │
│ │                         │  Qty: [1] [▲▼]           │  │
│ │                         │                          │  │
│ │                         │  [❤ Add to Wishlist]     │  │
│ │                         │  [⊕ Add to Cart] (Blue)  │  │
│ │                         │  [⚡ Buy Now]            │  │
│ │                         │                          │  │
│ │                         │  Shipping:               │  │
│ │                         │  ✓ Free shipping         │  │
│ │                         │  ✓ Same-day delivery     │  │
│ │                         │  ✓ Easy returns          │  │
│ │                         │                          │  │
│ └─────────────────────────┴──────────────────────────┘  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ DESCRIPTION TABS                                         │
│ [Description] [Specifications] [Reviews] [Q&A]          │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ DESCRIPTION (Active Tab)                             ││
│ │                                                      ││
│ │ Product description text here...                     ││
│ │ Long form content about features, benefits...        ││
│ │ With images embedded in description if needed.       ││
│ │                                                      ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ REVIEWS SECTION                                      ││
│ │                                                      ││
│ │ Average Rating: 4.5 ⭐ (234 reviews)                ││
│ │ 5★ ████████ 180 reviews                             ││
│ │ 4★ ███ 34 reviews                                   ││
│ │ 3★ ██ 15 reviews                                    ││
│ │ 2★ 2 reviews                                        ││
│ │ 1★ 3 reviews                                        ││
│ │                                                      ││
│ │ [Write a Review] Button                             ││
│ │                                                      ││
│ │ ┌────────────────────────────────────────────────┐  ││
│ │ │ REVIEW 1 (Most Helpful)                        │  ││
│ │ │ ⭐⭐⭐⭐⭐ "Great product!"                      │  ││
│ │ │ By @reviewer1 • Verified Purchase • 2 days ago│  ││
│ │ │ "This product exceeded my expectations..."     │  ││
│ │ │ 👍 Helpful (45)  👎 Not Helpful (2)           │  ││
│ │ └────────────────────────────────────────────────┘  ││
│ │                                                      ││
│ │ ┌────────────────────────────────────────────────┐  ││
│ │ │ REVIEW 2                                       │  ││
│ │ │ ⭐⭐⭐⭐ "Good quality"                         │  ││
│ │ │ By @reviewer2 • Verified Purchase • 1 week ago│  ││
│ │ │ "Product arrived in good condition..."        │  ││
│ │ │ 👍 Helpful (12)  👎 Not Helpful (1)           │  ││
│ │ └────────────────────────────────────────────────┘  ││
│ │                                                      ││
│ │ [Load More Reviews]                                ││
│ │                                                      ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ RELATED PRODUCTS (Below)                                │
│ ┌──────────────┬──────────────┬──────────────┐         │
│ │ Similar 1    │ Similar 2    │ Similar 3    │         │
│ │ ... (grid)                                 │         │
│ └──────────────┴──────────────┴──────────────┘         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Key Sections:**

1. **Product Image Gallery**
   - Large main image
   - Thumbnail carousel below
   - Lightbox/modal for full view
   - Image zoom on hover

2. **Product Information**
   - Title, price, discount (if any)
   - Rating stars + review count
   - Seller name + verification badge
   - Stock status
   - Options (size, color, etc.) with selectors
   - Quantity selector
   - Action buttons: Add to Wishlist, Add to Cart, Buy Now

3. **Description Tabs**
   - Description (main content)
   - Specifications (table format)
   - Reviews (with ratings)
   - Q&A (if available)

4. **Reviews Section**
   - Star distribution chart
   - "Write a Review" button
   - Review cards: author, date, rating, text, helpful votes
   - Sort/filter reviews by rating, helpfulness, date

5. **Related Products**
   - Grid of similar products
   - Same card structure as marketplace grid

**Interactions:**
- Click thumbnail → Update main image
- Change options → Update preview/price
- Change quantity → Update cart/buy price
- Click "Add to Cart" → Add item, show toast
- Click "Add to Wishlist" → Toggle wishlist, icon changes
- Click "Buy Now" → Skip cart, go to checkout
- Click review helpful → Vote up/down

**Responsive:**
- Desktop: 2-column layout (image left, info right)
- Mobile: Single column (image stacked on top)

---

#### 8. **Shopping Cart Page** (`/app/marketplace/cart`)
**URL Path:** `/app/marketplace/cart`  
**Component:** `src/pages/marketplace/MarketplaceCart.tsx`

**Purpose:** Review and manage items before checkout

**Layout Structure:**
```
┌──────────────────────────────────────────────────┐
│           SHOPPING CART                          │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌─────────────────────┬──────────────────────┐  │
│ │                     │    ORDER SUMMARY     │  │
│ │  CART ITEMS         │    ┌──────────────┐  │  │
│ │                     │    │ Subtotal:    │  │  │
│ │  ┌────────────────┐ │    │ $99.99       │  │  │
│ │  │ ☑ ITEM 1       │ │    │              │  │  │
│ │  │ [Thumb]        │ │    │ Shipping:    │  │  │
│ │  │ "Product Title"│ │    │ Free         │  │  │
│ │  │ Color: Blue    │ │    │              │  │  │
│ │  │ Size: M        │ │    │ Tax:         │  │  │
│ │  │ Qty: 1  [▲▼]   │ │    │ $7.99        │  │  │
│ │  │ $99.99         │ │    │              │  │  │
│ │  │ [👁 View]      │ │    │ Total:       │  │  │
│ │  │ [✕ Remove]     │ │    │ $107.98      │  │  │
│ │  └────────────────┘ │    │              │  │  │
│ │                     │    │ ☐ Gift Wrap  │  │  │
│ │  ┌────────────────┐ │    │   +$5.00     │  │  │
│ │  │ ☑ ITEM 2       │ │    │              │  │  │
│ │  │ [Thumb]        │ │    │ [Continue to │  │  │
│ │  │ "Product Title"│ │    │  Checkout]   │  │  │
│ │  │ Color: Red     │ │    │              │  │  │
│ │  │ Size: L        │ │    │ [Continue    │  │  │
│ │  │ Qty: 2  [▲▼]   │ │    │  Shopping]   │  │  │
│ │  │ $199.98        │ │    └──────────────┘  │  │
│ │  │ [👁 View]      │ │                     │  │
│ │  │ [✕ Remove]     │ │    APPLY COUPON     │  │
│ │  └────────────────┘ │    ┌──────────────┐  │  │
│ │                     │    │ [Coupon Code]│  │  │
│ │  ☐ Save for Later   │    │ [Apply] [?]  │  │  │
│ │  (0 items)          │    └──────────────┘  │  │
│ │                     │                     │  │
│ └─────────────────────┴──────────────────────┘  │
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │ RECOMMENDED FOR YOU                          ││
│ │ [Product] [Product] [Product] [Product]      ││
│ └──────────────────────────────────────────────┘│
│                                                  │
└──────────────────────────────────────────────────┘
```

**Key Sections:**

1. **Cart Items List**
   - Checkbox to select/deselect items
   - Item thumbnail image
   - Product title (linked to product)
   - Selected options (color, size, etc.)
   - Quantity selector with +/- buttons
   - Item total price
   - View button (navigate to product)
   - Remove button (delete from cart)
   - "Save for Later" section (separate)

2. **Order Summary (Sticky on Desktop)**
   - Subtotal
   - Shipping cost (free or calculated)
   - Tax
   - Applied discounts
   - **Total** (large, bold)
   - Gift wrap checkbox (optional)
   - Coupon/promo code input
   - "Continue to Checkout" button (primary)
   - "Continue Shopping" button (secondary)

3. **Empty Cart State**
   - If cart is empty:
     ```
     🛒 Your cart is empty
     [Continue Shopping] button
     Link to featured products
     ```

4. **Recommended Products**
   - "Recommended for You" section
   - Product cards from related items
   - "Add to Cart" buttons

**Interactions:**
- Change quantity → Update subtotal/total
- Remove item → Delete from cart
- Apply coupon → Validate and apply discount
- Click product → Navigate to detail page
- Click Checkout → Navigate to `/app/marketplace/checkout`
- Select items → Partial checkout (if supported)

**Validation:**
- Coupon code format check
- Stock availability check (disable if out of stock)

**Cart Persistence:**
- Cart saved in localStorage and/or database
- Survives page reload

---

#### 9. **Checkout Page** (`/app/marketplace/checkout`)
**URL Path:** `/app/marketplace/checkout`  
**Component:** `src/pages/marketplace/MarketplaceCheckout.tsx`

**Purpose:** Complete purchase with shipping and payment

**Layout Structure:**
```
┌──────────────────────────────────────────────────────┐
│         CHECKOUT (Step 1 of 3)                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Progress: [Step 1: Shipping] → Step 2 → Step 3      │
│                                                      │
│ ┌────────────────────────────┬──────────────────┐  │
│ │                            │  Order Summary   │  │
│ │  SHIPPING ADDRESS          │  ┌────────────┐ │  │
│ │                            │  │ Items: 2   │ │  │
│ │  ☑ Use saved address       │  │ Subtotal:  │ │  │
│ │  ☐ Use billing address     │  │ $299.97    │ │  │
│ │                            │  │            │ │  │
│ │  OR Enter new address:     │  │ Shipping:  │ │  │
│ │                            │  │ $10.00     │ │  │
│ │  Name: [___________]       │  │            │ │  │
│ │  Street: [_____________]   │  │ Tax:       │ │  │
│ │  City: [_____]             │  │ $23.99     │ │  │
│ │  State: [___]              │  │            │ │  │
│ │  ZIP: [_______]            │  │ Total:     │ │  │
│ │  Country: [Select ▼]       │  │ $333.96    │ │  │
│ │                            │  └────────────┘ │  │
│ │  [← Back] [Continue →]     │                │  │
│ │                            │  [Edit Cart]   │  │
│ └────────────────────────────┴──────────────────┘  │
│                                                      │
│ ════════════════════════════════════════════════════ │
│         (Step 2: Shipping Method)                    │
│                                                      │
│ ┌────────────────────────────┬──────────────────┐  │
│ │                            │                  │  │
│ │  SELECT SHIPPING METHOD    │                  │  │
│ │                            │                  │  │
│ │  ◉ Standard (5-7 days)     │                  │  │
│ │     Free shipping          │                  │  │
│ │                            │                  │  │
│ │  ○ Express (2-3 days)      │                  │  │
│ │     $15.00                 │                  │  │
│ │                            │                  │  │
│ │  ○ Overnight (Next day)    │                  │  │
│ │     $30.00                 │                  │  │
│ │                            │                  │  │
│ │  [← Back] [Continue →]     │                  │  │
│ │                            │                  │  │
│ └────────────────────────────┴──────────────────┘  │
│                                                      │
│ ════════════════════════════════════════════════════ │
│         (Step 3: Payment)                            │
│                                                      │
│ ┌────────────────────────────┬──────────────────┐  │
│ │                            │                  │  │
│ │  PAYMENT METHOD            │                  │  │
│ │                            │                  │  │
│ │  ◉ Credit/Debit Card       │                  │  │
│ │     Card Number: [________]│                  │  │
│ │     Expiry: [__/____]      │                  │  │
│ │     CVC: [___]             │                  │  │
│ │     Name: [__________]     │                  │  │
│ │                            │                  │  │
│ │  ○ Digital Wallet          │                  │  │
│ │     [Google Pay] [Apple Pay]                 │  │
│ │                            │                  │  │
│ │  ○ Bank Transfer           │                  │  │
│ │     (3-5 business days)    │                  │  │
│ │                            │                  │  │
│ │  ☑ Save payment method     │                  │  │
│ │                            │                  │  │
│ │  [← Back] [Complete Order]│                  │  │
│ │                            │                  │  │
│ └────────────────────────────┴──────────────────┘  │
│                                                      │
│ By placing an order, you agree to our Terms        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Key Sections:**

1. **Step 1: Shipping Address**
   - Select from saved addresses
   - Or enter new address
   - Form validation
   - Back/Continue buttons

2. **Step 2: Shipping Method**
   - Radio buttons for shipping options
   - Estimated delivery dates
   - Pricing for each option
   - Real-time cost calculation

3. **Step 3: Payment**
   - Payment method options:
     - Credit/Debit Card (with form)
     - Digital Wallets (Google Pay, Apple Pay)
     - Bank Transfer
   - Billing address (same as shipping or different)
   - Save payment method checkbox
   - Security badges (Stripe certified, etc.)

4. **Order Summary** (Right Sidebar, Sticky on Desktop)
   - Item list with prices
   - Shipping cost
   - Tax calculation
   - Discount/coupon applied
   - **Total** in large text
   - Edit cart button

**Interactions:**
- Fill form fields → Validate in real-time
- Select shipping method → Update total
- Select payment method → Show relevant fields
- Click "Complete Order" → Process payment, show loading
- Payment success → Navigate to order confirmation page

**Security:**
- SSL/HTTPS encryption
- PCI compliance (Stripe handles)
- No sensitive data stored
- 3D Secure support (for card payments)

**Error Handling:**
- Validation errors below fields (red text)
- Payment failure → Show error message + retry option
- Network error → Show retry button

---

#### 10. **Wallet Page** (`/app/wallet`)
**URL Path:** `/app/wallet`  
**Component:** `src/pages/Wallet.tsx`, `src/pages/wallet/WalletDashboard.tsx`

**Purpose:** Manage user balance, send money, and view transactions

**Layout Structure:**
```
┌──────────────────────────────────────────────────┐
│              WALLET DASHBOARD                    │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │ BALANCE CARD (Gradient Background)           ││
│ │                                              ││
│ │ Available Balance                            ││
│ │ $2,450.50                                    ││
│ │                                              ││
│ │ Card Number: •••• •••• •••• 1234 (masked)  ││
│ │ Expiry: 12/25                                ││
│ │                                              ││
│ │ [Lock Icon] Tap to reveal more               ││
│ │                                              ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ QUICK ACTIONS (4 buttons)                        │
│ ┌──────────────┬──────────────┬──────────────┐  │
│ │ [📤 Send]    │ [📥 Request] │ [⬇️  Deposit] │  │
│ │ Send Money   │ Request $    │ Add Funds    │  │
│ └──────────────┴──────────────┴──────────────┘  │
│ │ [↗️  Withdraw] │                               │
│ │ Withdraw $    │                               │
│ └──────────────┘                                │
│                                                  │
│ WALLET STATS                                     │
│ ┌──────────────┬──────────────┬──────────────┐  │
│ │ This Month   │ Last Month   │ This Year    │  │
│ │ +$450.25     │ +$320.10     │ +$4,230.50   │  │
│ │ 12 Txns      │ 8 Txns       │ 156 Txns     │  │
│ └──────────────┴──────────────┴──────────────┘  │
│                                                  │
│ RECENT TRANSACTIONS                              │
│ ┌──────────────────────────────────────────────┐│
│ │ [Sort] [Filter] [Export]                     ││
│ │                                              ││
│ │ ┌────────────────────────────────────────┐  ││
│ │ │ 🔵 Transfer to John                    │  ││
│ │ │ Sent via Wallet Transfer               │  ││
│ │ │ 2 hours ago                            │  ││
│ │ │                        -$100.00 USD   │  ││
│ │ │ Status: ✓ Completed                   │  ││
│ │ └────────────────────────────────────────┘  ││
│ │                                              ││
│ │ ┌────────────────────────────────────────┐  ││
│ │ │ 🟢 Received from Jane                  │  ││
│ │ │ Received via Wallet Transfer           │  ││
│ │ │ 5 hours ago                            │  ││
│ │ │                        +$250.00 USD   │  ││
│ │ │ Status: ✓ Completed                   │  ││
│ │ └────────────────────────────────────────┘  ││
│ │                                              ││
│ │ ┌────────────────────────────────────────┐  ││
│ │ │ 💳 Card Withdrawal                     │  ││
│ │ │ Withdrawn to Bank Account ending ...78 │  ││
│ │ │ 1 day ago                              │  ││
│ │ │                        -$500.00 USD   │  ││
│ │ │ Status: ⏳ Processing                  │  ││
│ │ └────────────────────────────────────────┘  ││
│ │                                              ││
│ │ ┌────────────────────────────────────────┐  ││
│ │ │ 🛒 Marketplace Purchase                │  ││
│ │ │ Product: Camera Stand                  │  ││
│ │ │ 2 days ago                             │  ││
│ │ │                        -$45.99 USD    │  ││
│ │ │ Status: ✓ Completed                   │  ││
│ │ │ [Receipt] [Refund]                    │  ││
│ │ └────────────────────────────────────────┘  ││
│ │                                              ││
│ │ [Load More Transactions]                    ││
│ │                                              ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ TABS: [Overview] [Transactions] [Cards] ...      │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Key Components:**

1. **Balance Card**
   - Large, gradient background
   - Display balance in primary currency
   - Card number (masked)
   - Expiry date
   - Lock/reveal button for security

2. **Quick Actions (Buttons)**
   - 📤 Send Money → `/app/wallet/send-money`
   - 📥 Request Money → `/app/wallet/request`
   - ⬇️ Deposit Funds → `/app/wallet/deposit`
   - ↗️ Withdraw → `/app/wallet/withdraw`

3. **Wallet Stats**
   - Net income this month/year
   - Transaction count
   - Compare month-over-month

4. **Recent Transactions List**
   - Transaction icon (type-specific)
   - Description (recipient/sender name, category)
   - Timestamp
   - Amount (+ or - and color coded)
   - Status (Completed, Processing, Failed)
   - Actions (View Receipt, Refund if applicable)
   - Infinite scroll or pagination

5. **Tabs** (If available)
   - Overview (current view)
   - Transactions (full history)
   - Cards (payment methods)
   - Invoices
   - Payment Links

**Interactions:**
- Click quick action → Navigate to relevant modal/page
- Click transaction → Show detailed receipt/information modal
- Apply filter → Update transaction list
- Sort by date/amount → Reorder list
- Export → Download CSV/PDF of transactions

**Responsive:**
- Desktop: Full layout with sidebar
- Mobile: Stack components vertically

---

## REMAINING PAGES & FEATURES

Due to length constraints, here's a summary of other major pages:

**Chat Module** (`/app/chat`, `/app/chat/:threadId`)
- Inbox-style list of conversations
- Message thread with real-time updates
- Typing indicators
- Message read status
- Group chat support
- File sharing

**Freelance Module** (`/app/freelance/*`)
- Job listings with filters
- Job detail with proposals
- Freelancer dashboard with earnings
- Invoice generation
- Payment escrow

**Crypto Module** (`/app/crypto/*`)
- Portfolio view with balances
- Trading interface with charts
- P2P marketplace
- KYC verification flow
- Deposit/withdraw crypto

**Profile Module** (`/app/profile/:username`)
- User info header
- Post grid
- Follower/following lists
- Profile stats
- Follow/message buttons

**Admin Dashboard** (`/admin/dashboard`)
- KPI cards (users, posts, revenue)
- Charts and analytics
- User management table
- Content moderation queue
- System settings

---

## COMPONENT ARCHITECTURE

### UI Component Library (`src/components/ui/`)

**Core Primitives** (Built with Radix UI + Tailwind):

```typescript
// Button Component
<Button 
  variant="primary" | "secondary" | "outline" | "ghost" | "destructive"
  size="sm" | "md" | "lg"
  disabled={boolean}
  onClick={handler}
>
  Label
</Button>

// Card Component
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>

// Dialog/Modal
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    Content...
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Tabs
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>

// Form Input
<Input 
  type="text" | "email" | "password"
  placeholder="Placeholder"
  value={value}
  onChange={handleChange}
/>

// Avatar
<Avatar>
  <AvatarImage src="url" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// Toast Notification
const { toast } = useToast();
toast({
  title: "Success",
  description: "Action completed",
  variant: "default" | "destructive"
});
```

All UI components follow:
- **Accessibility:** ARIA attributes, keyboard navigation
- **Responsive:** Mobile-first, responsive breakpoints
- **Themeable:** CSS variables for colors
- **Composable:** Built with Radix UI slots

---

## SUPABASE INTEGRATION PATTERNS

### Client Initialization

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export { supabase };
```

### Authentication Pattern

```typescript
// Sign Up
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: name,
      username: generateUsername(name),
    },
  },
});

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Get Session
const { data, error } = await supabase.auth.getSession();

// Sign Out
await supabase.auth.signOut();

// Listen to Auth Changes
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (event === 'SIGNED_IN') {
      // Handle sign in
    }
  }
);
```

### Data Operations Pattern

```typescript
// SELECT
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20);

// INSERT
const { data, error } = await supabase
  .from('posts')
  .insert({
    user_id: userId,
    content: postContent,
    media_urls: mediaUrls,
    privacy: 'public',
    created_at: new Date().toISOString(),
  })
  .select()
  .single();

// UPDATE
const { data, error } = await supabase
  .from('profiles')
  .update({
    bio: newBio,
    updated_at: new Date().toISOString(),
  })
  .eq('user_id', userId)
  .select()
  .single();

// DELETE
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId);
```

### Real-Time Subscriptions

```typescript
// Listen to Real-Time Changes
const channel = supabase
  .channel(`realtime:posts:user_id=eq.${userId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'posts',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log('Change:', payload);
      // Update UI
    }
  )
  .subscribe();

// Clean up
supabase.removeChannel(channel);
```

### File Upload Pattern

```typescript
// Upload File to Storage
const { data, error } = await supabase.storage
  .from('post-images')
  .upload(`${userId}/${Date.now()}_${file.name}`, file);

// Get Public URL
const { data } = supabase.storage
  .from('post-images')
  .getPublicUrl(`${userId}/filename.jpg`);

const publicUrl = data.publicUrl;

// Delete File
const { error } = await supabase.storage
  .from('post-images')
  .remove([`${userId}/filename.jpg`]);
```

---

## API & DATA ACCESS PATTERNS

### Service Layer Pattern

```typescript
// src/services/postService.ts
import { supabase } from '@/integrations/supabase/client';

export const postService = {
  async createPost(userId: string, postData: CreatePostData) {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: postData.content,
        media_urls: postData.media_urls,
        privacy: postData.privacy,
        hashtags: postData.hashtags,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async fetchFeedPosts(userId: string, limit = 20, offset = 0) {
    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .or(`privacy=eq.public,user_id=in(${followingIds.join(',')})`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { posts: data, total: count };
  },

  async deletePost(postId: string) {
    const { error } = await supabase
      .from('posts')
      .update({ is_deleted: true })
      .eq('id', postId);

    if (error) throw error;
  },
};
```

### Hook Pattern (Data Fetching)

```typescript
// src/hooks/use-feed.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { postService } from '@/services/postService';

export const useFeedPosts = (userId: string) => {
  return useInfiniteQuery({
    queryKey: ['feed-posts', userId],
    queryFn: ({ pageParam = 0 }) => 
      postService.fetchFeedPosts(userId, 20, pageParam),
    getNextPageParam: (lastPage, allPages) => 
      lastPage.posts.length === 20 ? allPages.length * 20 : null,
    initialPageParam: 0,
  });
};

// Usage in component
const { data, fetchNextPage, hasNextPage } = useFeedPosts(userId);

return (
  <InfiniteScroll
    dataLength={data?.pages.flatMap(p => p.posts).length || 0}
    next={() => fetchNextPage()}
    hasMore={hasNextPage || false}
    loader={<Skeleton />}
  >
    {data?.pages.map(page => 
      page.posts.map(post => <PostCard key={post.id} post={post} />)
    )}
  </InfiniteScroll>
);
```

### Context Pattern (Shared State)

```typescript
// src/contexts/AuthContext.tsx
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth
    const initializeAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(enrichUserData(data.session.user));
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(enrichUserData(session.user));
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error };
      setUser(enrichUserData(data.user));
      return { error: null };
    },
    logout: async () => {
      await supabase.auth.signOut();
      setUser(null);
    },
    // ... more methods
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## STYLING SYSTEM & DESIGN TOKENS

### Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        accent: "hsl(var(--accent))",
        // ... more colors
        eloity: {
          primary: "hsl(var(--eloity-primary))",
          cyan: "#00D2FF",
          purple: "#B84FFF",
          dark: "#1A1B23",
        },
      },
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "0.8125rem",
        lg: "1.125rem",
        // ... more sizes
      },
    },
  },
};
```

### Global Styles

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Colors */
  --primary: 262 80% 50%;
  --primary-foreground: 210 40% 98%;
  --secondary: 220 13% 91%;
  --secondary-foreground: 222 47% 11%;
  --accent: 262 80% 50%;
  --accent-foreground: 210 40% 98%;
  --background: 210 40% 98%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --muted: 220 13% 91%;
  --muted-foreground: 215 16% 47%;
  --border: 220 13% 91%;
  --radius: 0.5rem;
}

[data-theme="dark"] {
  --background: 222 84% 5%;
  --foreground: 210 40% 98%;
  --card: 222 84% 8%;
  --card-foreground: 210 40% 98%;
  /* ... dark mode adjustments */
}
```

### Component Styling Example

```typescript
// src/components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
```

### Responsive Patterns

```typescript
// Mobile-first approach with Tailwind breakpoints
export const ResponsiveGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* 1 column on mobile, 2 on tablet, 3 on desktop, 4 on xl */}
      {items.map(item => (
        <Card key={item.id}>{item.name}</Card>
      ))}
    </div>
  );
};

// Conditional rendering for responsive
export const ConditionalLayout = () => {
  return (
    <div className="flex flex-col lg:flex-row">
      <aside className="hidden lg:block w-64">Sidebar</aside>
      <main className="flex-1">Main Content</main>
    </div>
  );
};
```

---

## REAL-TIME FEATURES

### Socket.io Integration

```typescript
// src/hooks/use-realtime-messaging.ts
import io from 'socket.io-client';

export const useRealtimeMessaging = (userId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      query: { userId },
    });

    // Connect
    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    // Receive message
    newSocket.on('message.received', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Typing indicator
    newSocket.on('user.typing', (data) => {
      console.log(`${data.username} is typing...`);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [userId]);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    socket?.emit('message.send', { conversationId, content });
  }, [socket]);

  const sendTyping = useCallback((conversationId: string) => {
    socket?.emit('user.typing', { conversationId });
  }, [socket]);

  return { messages, sendMessage, sendTyping };
};
```

### Supabase Real-Time Subscriptions

```typescript
// Subscribe to new posts
const channel = supabase
  .channel('public-posts')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'posts' },
    (payload) => {
      // New post created
      setFeedPosts(prev => [payload.new as Post, ...prev]);
    }
  )
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'posts' },
    (payload) => {
      // Post updated (like count, etc.)
      setFeedPosts(prev =>
        prev.map(post =>
          post.id === payload.new.id ? (payload.new as Post) : post
        )
      );
    }
  )
  .subscribe();

// Clean up
return () => supabase.removeChannel(channel);
```

---

## DEPLOYMENT & CONFIGURATION

### Environment Variables

```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_API_URL=http://localhost:5000

# Backend (.env)
DATABASE_URL=postgresql://...
SUPABASE_SERVICE_ROLE_KEY=your-service-key
JWT_SECRET=your-secret
STRIPE_SECRET_KEY=sk_test_...
# ... other secrets
```

### Build & Deployment

```bash
# Development
npm run dev              # Runs frontend (Vite) + backend (Express)

# Production Build
npm run build            # Builds frontend
npm run build:backend    # Builds backend

# Preview
npm run preview          # Preview production build

# Start Production Server
npm start               # Runs compiled backend (serves frontend)
```

### Deployment Targets

- **Frontend:** Vercel, Netlify, AWS S3 + CloudFront
- **Backend:** Vercel Serverless, AWS Lambda, Heroku, Railway
- **Database:** Supabase (managed PostgreSQL)
- **Storage:** Supabase Storage, AWS S3

---

## SUMMARY & NEXT STEPS FOR BUILDING A CLONE

To build an exact clone of this platform:

### Phase 1: Foundation
1. Set up React 18 + TypeScript + Vite
2. Configure Tailwind CSS + Radix UI
3. Set up Supabase project (PostgreSQL database)
4. Implement authentication (signup, login, password reset)
5. Create base layout and navigation

### Phase 2: Core Features
1. Implement social feed (posts, comments, likes)
2. Add user profiles (creation, editing, following)
3. Build marketplace (product listing, shopping cart, checkout)
4. Integrate payment processing (Stripe)

### Phase 3: Advanced Features
1. Implement real-time chat (Socket.io)
2. Add crypto integration (wallet, trading)
3. Build freelance platform (jobs, proposals, payments)
4. Add admin dashboard and moderation tools

### Phase 4: Polish & Launch
1. Performance optimization (code splitting, lazy loading, caching)
2. Testing (unit, integration, E2E)
3. Security audit and hardening
4. Analytics and monitoring setup
5. Deployment and scaling

---

## CONCLUSION

The Eloity platform is a comprehensive, feature-rich ecosystem that combines social media, e-commerce, cryptocurrency, and freelancing in a single application. This documentation provides developers with a complete blueprint to understand the architecture, replicate the UI/UX, implement the features, and deploy the platform successfully.

Key takeaways:
- **Direct Supabase Integration:** All data flows through Supabase (no separate backend required)
- **Component-Based Architecture:** Modular, reusable components make development faster
- **Type-Safe Development:** TypeScript ensures fewer runtime errors
- **Responsive Design:** Mobile-first approach with Tailwind CSS
- **Scalable Structure:** Easy to add new features and modules

---

**End of Documentation**

*For questions or updates to this documentation, consult the project's README files and existing code patterns.*

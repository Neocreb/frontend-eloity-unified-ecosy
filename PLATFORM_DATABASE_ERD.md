# ELOITY PLATFORM - DATABASE ERD & SCHEMA REFERENCE

## Database Architecture Overview

The Eloity platform uses **PostgreSQL** (via Supabase) as its primary database. All user authentication is handled by Supabase Auth (`auth.users` table), while application data is stored in public schema.

---

## Entity Relationship Diagram (Text Format)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          ELOITY PLATFORM DATABASE ERD                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────────┐
                                    │  auth.users      │
                                    │  (Supabase Auth) │
                                    │─────────────────│
                                    │ • id (UUID) PK  │
                                    │ • email         │
                                    │ • password_hash │
                                    │ • user_metadata │
                                    └─────────┬────────┘
                                              │
                    ┌─────────────────────────┼──────────────────────────┐
                    │                         │                          │
                    ↓                         ↓                          ↓
        ┌─────────────────────┐   ┌─────────────────────┐   ┌──────────────────────┐
        │   profiles          │   │  followers          │   │  wallet_transactions │
        │─────────────────────│   │─────────────────────│   │──────────────────────│
        │ • user_id (PK)      │   │ • id (UUID) PK      │   │ • id (UUID) PK       │
        │ • username (UNIQUE) │   │ • follower_id (FK)  │   │ • user_id (FK)       │
        │ • full_name         │   │ • following_id (FK) │   │ • from_user_id (FK)  │
        │ • avatar_url        │   │ • created_at        │   │ • to_user_id (FK)    │
        │ • banner_url        │   └─────────────────────┘   │ • amount             │
        │ • bio               │                              │ • currency           │
        │ • location          │                              │ • type               │
        │ • website           │                              │ • status             │
        │ • points            │                              │ • created_at         │
        │ • level             │                              └──────────────────────┘
        │ • tier_level        │
        │ • created_at        │
        │ • updated_at        │
        └──────────┬──────────┘
                   │
            ┌──────┴──────┐
            ↓             ↓
    ┌────────────────┐  ┌──────────────────────────┐
    │  posts         │  │  marketplace_profiles    │
    │────────────────│  │──────────────────────────│
    │ • id (PK)      │  │ • id (PK)                │
    │ • user_id (FK) │  │ • user_id (FK) UNIQUE   │
    │ • content      │  │ • store_name             │
    │ • media_urls   │  │ • store_logo             │
    │ • type         │  │ • store_rating           │
    │ • privacy      │  │ • total_sales            │
    │ • likes_count  │  │ • seller_level           │
    │ • created_at   │  │ • verification_status    │
    │ • updated_at   │  │ • created_at             │
    └────────┬───────┘  └──────────────────────────┘
             │
         ┌───┴─────┐
         ↓         ↓
┌──────────────────────┐  ┌─────────────────────────┐
│ post_comments        │  │ post_likes              │
│──────────────────────│  │─────────────────────────│
│ • id (PK)            │  │ • id (PK)               │
│ • post_id (FK)       │  │ • post_id (FK)          │
│ • user_id (FK)       │  │ • user_id (FK)          │
│ • content            │  │ • created_at            │
│ • parent_id (FK)     │  │ UNIQUE(post_id, user_id)│
│ • likes_count        │  └─────────────────────────┘
│ • created_at         │
│ • updated_at         │
└──────────────────────┘
             │
             ↓
    ┌─────────────────────┐
    │ post_comments       │ (Self-referencing for replies)
    │ (Recursive)         │
    └─────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     MARKETPLACE MODULE                           │
└──────────────────────────────────────────────────────────────────┘

    ┌────────────────────┐         ┌─────────────────────┐
    │  products          │         │  shopping_cart      │
    │────────────────────│         │─────────────────────│
    │ • id (PK)          │         │ • id (PK)           │
    │ • seller_id (FK)   │         │ • user_id (FK)      │
    │ • title            │         │ • product_id (FK)   │
    │ • description      │         │ • quantity          │
    │ • price            │         │ • created_at        │
    │ • category         │         └─────────────────────┘
    │ • stock_quantity   │
    │ • images           │         ┌─────────────────────┐
    │ • rating           │         │  wishlist           │
    │ • sales_count      │         │─────────────────────│
    │ • created_at       │         │ • id (PK)           │
    │ • updated_at       │         │ • user_id (FK)      │
    └────────┬───────────┘         │ • product_id (FK)   │
             │                     │ • created_at        │
         ┌───┴─────┐               └─────────────────────┘
         ↓         ↓
    ┌──────────────────┐    ┌─────────────────────────┐
    │  orders          │    │  product_reviews       │
    │──────────────────│    │─────────────────────────│
    │ • id (PK)        │    │ • id (PK)               │
    │ • buyer_id (FK)  │    │ • product_id (FK)       │
    │ • seller_id (FK) │    │ • reviewer_id (FK)      │
    │ • status         │    │ • rating (1-5)          │
    │ • total_amount   │    │ • title                 │
    │ • currency       │    │ • comment               │
    │ • created_at     │    │ • helpful_count         │
    │ • updated_at     │    │ • created_at            │
    └────────┬─────────┘    │ • updated_at            │
             │              └─────────────────────────┘
             ↓
    ┌──────────────────┐
    │  order_items     │
    │──────────────────│
    │ • id (PK)        │
    │ • order_id (FK)  │
    │ • product_id (FK)│
    │ • quantity       │
    │ • unit_price     │
    │ • total_price    │
    │ • created_at     │
    └──────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     CRYPTO MODULE                                │
└──────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐    ┌────────────────────────┐
    │ crypto_profiles     │    │ crypto_wallets         │
    │─────────────────────│    │────────────────────────│
    │ • id (PK)           │    │ • id (PK)              │
    │ • user_id (FK)      │    │ • user_id (FK)         │
    │ • wallet_address    │    │ • wallet_address       │
    │ • kyc_status        │    │ • chain_type           │
    │ • trading_volume    │    │ • balance              │
    │ • total_trades      │    │ • currency             │
    │ • created_at        │    │ • is_primary           │
    │ • updated_at        │    │ • last_synced_at       │
    └──────────┬──────────┘    │ • created_at           │
               │               └────────────┬───────────┘
               │                            │
         ┌─────┴────────┬───────────────────┘
         ↓              ↓
┌──────────────────┐  ┌─────────────────────────┐
│ crypto_trades    │  │ crypto_transactions     │
│──────────────────│  │─────────────────────────│
│ • id (PK)        │  │ • id (PK)               │
│ • user_id (FK)   │  │ • user_id (FK)          │
│ • from_currency  │  │ • wallet_id (FK)        │
│ • to_currency    │  │ • transaction_hash      │
│ • from_amount    │  │ • from_address          │
│ • to_amount      │  │ • to_address            │
│ • rate           │  │ • amount                │
│ • status         │  │ • currency              │
│ • created_at     │  │ • status                │
└──────────────────┘  │ • confirmations         │
                      │ • created_at            │
                      └─────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     CHAT & MESSAGING MODULE                      │
└──────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────┐    ┌─────────────────────────┐
    │ chat_conversations       │    │ group_chat_threads      │
    │──────────────────────────│    │─────────────────────────│
    │ • id (PK)                │    │ • id (PK)               │
    │ • user_id1 (FK)          │    │ • creator_id (FK)       │
    │ • user_id2 (FK)          │    │ • name                  │
    │ • last_message           │    │ • description           │
    │ • last_message_at        │    │ • avatar_url            │
    │ • unread_count_user1     │    │ • is_private            │
    │ • created_at             │    │ • members_count         │
    │ • updated_at             │    │ • created_at            │
    └──────────┬───────────────┘    │ • updated_at            │
               │                    └────────────┬────────────┘
               │                                 │
               ↓                             ┌───┴─────┐
        ┌──────────────────┐                ↓         ↓
        │ chat_messages    │        ┌────────────────────────┐
        │──────────────────│        │group_chat_participants │
        │ • id (PK)        │        │────────────────────────│
        │ • conversation.. │        │ • id (PK)              │
        │   _id (FK)       │        │ • group_id (FK)        │
        │ • sender_id (FK) │        │ • user_id (FK)         │
        │ • content        │        │ • role                 │
        │ • attachments    │        │ • joined_at            │
        │ • status         │        └────────────────────────┘
        │ • read_at        │
        │ • created_at     │        ┌────────────────────────┐
        └──────────────────┘        │ group_messages         │
                                    │────────────────────────│
                                    │ • id (PK)              │
                                    │ • group_id (FK)        │
                                    │ • sender_id (FK)       │
                                    │ • content              │
                                    │ • attachments          │
                                    │ • created_at           │
                                    └────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     FREELANCE MODULE                             │
└──────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐        ┌──────────────────────┐
    │ freelance_profiles   │        │ freelance_jobs       │
    │──────────────────────│        │──────────────────────│
    │ • id (PK)            │        │ • id (PK)            │
    │ • user_id (FK)       │        │ • client_id (FK)     │
    │ • professional_title │        │ • title              │
    │ • hourly_rate        │        │ • description        │
    │ • experience_level   │        │ • budget             │
    │ • success_rate       │        │ • budget_max         │
    │ • total_earnings     │        │ • category           │
    │ • completed_projects │        │ • duration           │
    │ • created_at         │        │ • required_skills    │
    │ • updated_at         │        │ • status             │
    └──────────┬───────────┘        │ • created_at         │
               │                    │ • updated_at         │
               └────────────────────┼─────────────────────┘
                                    │
                            ┌───────┴──────┐
                            ↓              ↓
                    ┌──────────────────┐  ┌──────────────────────┐
                    │freelance_proposals│  │freelance_payments    │
                    │──────────────────│  │──────────────────────│
                    │ • id (PK)        │  │ • id (PK)            │
                    │ • job_id (FK)    │  │ • user_id (FK)       │
                    │ • freelancer_id  │  │ • freelancer_id (FK) │
                    │   (FK)           │  │ • amount             │
                    │ • cover_letter   │  │ • status             │
                    │ • proposed_rate  │  │ • payment_method     │
                    │ • status         │  │ • transaction_id     │
                    │ • created_at     │  │ • created_at         │
                    └──────────────────┘  └──────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     PAYMENTS & INVOICES                          │
└──────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐        ┌──────────────────────┐
    │ invoices             │        │ payment_links        │
    │──────────────────────│        │──────────────────────│
    │ • id (PK)            │        │ • id (PK)            │
    │ • issuer_id (FK)     │        │ • invoice_id (FK)    │
    │ • recipient_id (FK)  │        │ • user_id (FK)       │
    │ • invoice_number     │        │ • unique_code        │
    │ • amount             │        │ • amount             │
    │ • currency           │        │ • status             │
    │ • items              │        │ • expires_at         │
    │ • due_date           │        │ • created_at         │
    │ • status             │        └──────────────────────┘
    │ • paid_at            │
    │ • created_at         │        ┌──────────────────────┐
    │ • updated_at         │        │ receipts             │
    └──────────────────────┘        │──────────────────────│
                                    │ • id (PK)            │
                                    │ • transaction_id (FK)│
                                    │ • amount             │
                                    │ • currency           │
                                    │ • receipt_number     │
                                    │ • created_at         │
                                    └──────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     REWARDS & LOYALTY                            │
└──────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐        ┌──────────────────────┐
    │ referrals            │        │ user_rewards         │
    │──────────────────────│        │──────────────────────│
    │ • id (PK)            │        │ • id (PK)            │
    │ • referrer_id (FK)   │        │ • user_id (FK)       │
    │ • referred_id (FK)   │        │ • points             │
    │ • referral_code      │        │ • tier               │
    │ • status             │        │ • total_earned       │
    │ • reward_amount      │        │ • total_redeemed     │
    │ • created_at         │        │ • created_at         │
    │ • completed_at       │        │ • updated_at         │
    └──────────────────────┘        └──────────────────────┘
                                    │
                                    ↓
                            ┌──────────────────────┐
                            │ reward_rules         │
                            │──────────────────────│
                            │ • id (PK)            │
                            │ • action             │
                            │ • points_value       │
                            │ • is_active          │
                            │ • created_at         │
                            │ • updated_at         │
                            └──────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     ADMIN & MODERATION                           │
└──────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────┐    ┌──────────────────────────┐
    │ admin_activity_logs      │    │content_moderation_queue  │
    │──────────────────────────│    │──────────────────────────│
    │ • id (PK)                │    │ • id (PK)                │
    │ • admin_id (FK)          │    │ • content_type           │
    │ • action                 │    │ • content_id             │
    │ • target_type            │    │ • reported_by (FK)       │
    │ • target_id              │    │ • reason                 │
    │ • details                │    │ • status                 │
    │ • created_at             │    │ • reviewed_by (FK)       │
    └──────────────────────────┘    │ • action_taken           │
                                    │ • created_at             │
                            ┌───────┴─────────────────────────┘
                            │
                            ↓
                    ┌──────────────────────┐
                    │ system_settings      │
                    │──────────────────────│
                    │ • id (PK)            │
                    │ • key (UNIQUE)       │
                    │ • value              │
                    │ • description        │
                    │ • updated_by (FK)    │
                    │ • created_at         │
                    │ • updated_at         │
                    └──────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     CONTENT & MEDIA                              │
└──────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐        ┌──────────────────────┐
    │ stories              │        │ videos               │
    │──────────────────────│        │──────────────────────│
    │ • id (PK)            │        │ • id (PK)            │
    │ • user_id (FK)       │        │ • user_id (FK)       │
    │ • media_url          │        │ • title              │
    │ • media_type         │        │ • description        │
    │ • views_count        │        │ • video_url          │
    │ • expires_at         │        │ • thumbnail_url      │
    │ • created_at         │        │ • duration           │
    └──────────────────────┘        │ • views_count        │
                                    │ • likes_count        │
                                    │ • created_at         │
                                    │ • updated_at         │
                                    └──────────────────────┘

```

---

## Table Relationships Summary

### Primary Foreign Keys

| Foreign Key | References | Purpose |
|-------------|-----------|---------|
| `profiles.user_id` | `auth.users.id` | Link app profile to auth user |
| `posts.user_id` | `auth.users.id` | Link post to author |
| `post_comments.user_id` | `auth.users.id` | Link comment to author |
| `post_comments.post_id` | `posts.id` | Link comment to post |
| `post_likes.user_id` | `auth.users.id` | Link like to user |
| `post_likes.post_id` | `posts.id` | Link like to post |
| `followers.follower_id` | `auth.users.id` | User following someone |
| `followers.following_id` | `auth.users.id` | User being followed |
| `products.seller_id` | `auth.users.id` | Link product to seller |
| `orders.buyer_id` | `auth.users.id` | Link order to buyer |
| `orders.seller_id` | `auth.users.id` | Link order to seller |
| `order_items.order_id` | `orders.id` | Link items to order |
| `order_items.product_id` | `products.id` | Link item to product |
| `marketplace_profiles.user_id` | `auth.users.id` | Link seller profile to user (UNIQUE) |
| `crypto_profiles.user_id` | `auth.users.id` | Link crypto profile to user (UNIQUE) |
| `crypto_wallets.user_id` | `auth.users.id` | Link wallet to user |
| `crypto_transactions.wallet_id` | `crypto_wallets.id` | Link transaction to wallet |
| `chat_conversations.user_id1` | `auth.users.id` | First user in conversation |
| `chat_conversations.user_id2` | `auth.users.id` | Second user in conversation |
| `chat_messages.conversation_id` | `chat_conversations.id` | Link message to conversation |
| `chat_messages.sender_id` | `auth.users.id` | Link message to sender |
| `group_chat_threads.creator_id` | `auth.users.id` | Link group to creator |
| `group_chat_participants.group_id` | `group_chat_threads.id` | Link participant to group |
| `group_chat_participants.user_id` | `auth.users.id` | Link participant to user |
| `group_messages.group_id` | `group_chat_threads.id` | Link message to group |
| `group_messages.sender_id` | `auth.users.id` | Link message to sender |
| `freelance_profiles.user_id` | `auth.users.id` | Link freelancer profile to user (UNIQUE) |
| `freelance_jobs.client_id` | `auth.users.id` | Link job to client |
| `freelance_proposals.job_id` | `freelance_jobs.id` | Link proposal to job |
| `freelance_proposals.freelancer_id` | `auth.users.id` | Link proposal to freelancer |
| `invoices.issuer_id` | `auth.users.id` | Who issued the invoice |
| `invoices.recipient_id` | `auth.users.id` | Who receives the invoice |
| `payment_links.invoice_id` | `invoices.id` | Link payment link to invoice |
| `payment_links.user_id` | `auth.users.id` | Link payment link to user |
| `referrals.referrer_id` | `auth.users.id` | Person who referred |
| `referrals.referred_id` | `auth.users.id` | Person who was referred |
| `user_rewards.user_id` | `auth.users.id` | Link rewards to user |
| `wallet_transactions.user_id` | `auth.users.id` | Link transaction to user |
| `wallet_transactions.from_user_id` | `auth.users.id` | Sender (optional) |
| `wallet_transactions.to_user_id` | `auth.users.id` | Recipient (optional) |
| `stories.user_id` | `auth.users.id` | Link story to user |
| `videos.user_id` | `auth.users.id` | Link video to creator |
| `product_reviews.product_id` | `products.id` | Link review to product |
| `product_reviews.reviewer_id` | `auth.users.id` | Link review to reviewer |

---

## Cascade Behavior

All foreign keys use **ON DELETE CASCADE**, meaning:
- When a user is deleted, all their posts, comments, profiles, wallets, etc. are automatically deleted
- When a post is deleted, all comments and likes are automatically deleted
- When an order is deleted, all order items are automatically deleted

---

## Indexes (For Performance)

Key indexes that should be created:

```sql
-- Posts indexing
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_privacy ON posts(privacy);

-- Comments indexing
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX idx_post_comments_parent_id ON post_comments(parent_id);

-- Likes indexing
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- Followers indexing
CREATE INDEX idx_followers_follower_id ON followers(follower_id);
CREATE INDEX idx_followers_following_id ON followers(following_id);

-- Products indexing
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Orders indexing
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Chat indexing
CREATE INDEX idx_chat_conversations_user_id1 ON chat_conversations(user_id1);
CREATE INDEX idx_chat_conversations_user_id2 ON chat_conversations(user_id2);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Wallet indexing
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- Crypto indexing
CREATE INDEX idx_crypto_wallets_user_id ON crypto_wallets(user_id);
CREATE INDEX idx_crypto_transactions_user_id ON crypto_transactions(user_id);
CREATE INDEX idx_crypto_transactions_created_at ON crypto_transactions(created_at DESC);
```

---

## Row Level Security (RLS) Policies

RLS policies control data access at the database level:

```sql
-- Example: Users can only view posts that are public or their own
CREATE POLICY "posts_select_policy" ON posts
  FOR SELECT USING (
    privacy = 'public' OR 
    auth.uid() = user_id OR
    user_id IN (SELECT following_id FROM followers WHERE follower_id = auth.uid())
  );

-- Example: Users can only insert posts as themselves
CREATE POLICY "posts_insert_policy" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Example: Users can only update their own posts
CREATE POLICY "posts_update_policy" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Example: Users can only delete their own posts
CREATE POLICY "posts_delete_policy" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Example: Users can only view their own wallet transactions
CREATE POLICY "wallet_transactions_select" ON wallet_transactions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = from_user_id OR 
    auth.uid() = to_user_id
  );
```

---

## Data Integrity Constraints

### Unique Constraints

```sql
ALTER TABLE profiles ADD CONSTRAINT unique_username UNIQUE (username);
ALTER TABLE profiles ADD CONSTRAINT unique_user_id UNIQUE (user_id);
ALTER TABLE marketplace_profiles ADD CONSTRAINT unique_marketplace_user_id UNIQUE (user_id);
ALTER TABLE crypto_profiles ADD CONSTRAINT unique_crypto_user_id UNIQUE (user_id);
ALTER TABLE crypto_wallets ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);
ALTER TABLE freelance_profiles ADD CONSTRAINT unique_freelance_user_id UNIQUE (user_id);
ALTER TABLE invoices ADD CONSTRAINT unique_invoice_number UNIQUE (invoice_number);
ALTER TABLE payment_links ADD CONSTRAINT unique_payment_code UNIQUE (unique_code);
ALTER TABLE followers ADD CONSTRAINT unique_follow_pair UNIQUE (follower_id, following_id);
ALTER TABLE post_likes ADD CONSTRAINT unique_post_like UNIQUE (post_id, user_id);
```

### Check Constraints

```sql
ALTER TABLE products ADD CONSTRAINT check_price CHECK (price >= 0);
ALTER TABLE orders ADD CONSTRAINT check_total CHECK (total_amount >= 0);
ALTER TABLE wallet_transactions ADD CONSTRAINT check_amount CHECK (amount > 0);
ALTER TABLE user_rewards ADD CONSTRAINT check_points CHECK (points >= 0);
ALTER TABLE product_reviews ADD CONSTRAINT check_rating CHECK (rating >= 1 AND rating <= 5);
```

---

## Common Query Patterns

### Get User's Feed (Posts from followed users)

```sql
SELECT p.* FROM posts p
WHERE p.privacy = 'public' 
  OR p.user_id = $1  -- current user
  OR p.user_id IN (
    SELECT following_id FROM followers 
    WHERE follower_id = $1
  )
ORDER BY p.created_at DESC
LIMIT 20;
```

### Get User's Profile with Stats

```sql
SELECT 
  p.*,
  COUNT(DISTINCT f1.id) as followers_count,
  COUNT(DISTINCT f2.id) as following_count,
  COUNT(DISTINCT po.id) as posts_count
FROM profiles p
LEFT JOIN followers f1 ON f1.following_id = p.user_id
LEFT JOIN followers f2 ON f2.follower_id = p.user_id
LEFT JOIN posts po ON po.user_id = p.user_id
WHERE p.username = $1
GROUP BY p.user_id;
```

### Get Top Sellers

```sql
SELECT 
  p.user_id,
  p.username,
  COUNT(DISTINCT o.id) as total_orders,
  AVG(pr.rating) as average_rating,
  SUM(o.total_amount) as total_revenue
FROM marketplace_profiles mp
JOIN profiles p ON p.user_id = mp.user_id
LEFT JOIN orders o ON o.seller_id = p.user_id
LEFT JOIN product_reviews pr ON pr.product_id IN (
  SELECT id FROM products WHERE seller_id = p.user_id
)
WHERE mp.is_active = TRUE
GROUP BY p.user_id
ORDER BY total_revenue DESC
LIMIT 10;
```

### Get Trending Posts

```sql
SELECT 
  p.*,
  COUNT(DISTINCT pl.id) as likes,
  COUNT(DISTINCT pc.id) as comments
FROM posts p
LEFT JOIN post_likes pl ON pl.post_id = p.id
LEFT JOIN post_comments pc ON pc.post_id = p.id
WHERE p.privacy = 'public'
  AND p.created_at > NOW() - INTERVAL '7 days'
GROUP BY p.id
ORDER BY (COUNT(DISTINCT pl.id) + COUNT(DISTINCT pc.id)) DESC
LIMIT 20;
```

---

## Migration Strategy

### Phase 1: Core Tables
Create `auth.users`, `profiles`, `posts`, `followers`, `post_likes`, `post_comments`

### Phase 2: Marketplace
Create marketplace, products, orders, reviews

### Phase 3: Crypto
Create crypto tables, wallets, transactions

### Phase 4: Social
Create chat, groups, messages, real-time features

### Phase 5: Advanced
Create freelance, invoices, payments, admin tables

---

## Backup & Recovery

PostgreSQL backup command via Supabase:
```bash
pg_dump postgresql://user:password@host/dbname > backup.sql
```

Restore:
```bash
psql postgresql://user:password@host/dbname < backup.sql
```

---

**End of Database ERD Documentation**

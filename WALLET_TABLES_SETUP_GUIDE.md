# Wallet Features - Database Tables Setup Guide

This guide walks you through setting up all the database tables needed for the new wallet features:
- **Receipts** - Generate and manage transaction receipts
- **Payment Links** - Create shareable payment request links
- **Invoices** - Create and manage invoices

---

## Quick Start (Recommended)

Run **ONE** SQL script that creates all three tables at once:

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy & Run Complete Migration
Copy the entire contents of `scripts/setup-all-wallet-tables.sql` and paste it into the SQL Editor.

Click **Run** (or press `Ctrl+Enter`)

You should see: **"Executed successfully"**

---

## Individual Table Setup (If Preferred)

If you want to set up tables one at a time, use these individual scripts:

### Table 1: Receipts
**File:** `scripts/setup-receipts-table.sql`

Handles transaction receipt generation and management.

**Features:**
- Generate receipts for transactions
- Download receipts as PDF
- Email receipts to users
- Track receipt history

**Tables Schema:**
```
receipts
├── id (UUID, Primary Key)
├── transaction_id (UUID)
├── user_id (UUID, Foreign Key → auth.users)
├── receipt_number (TEXT, Unique)
├── generated_at (Timestamp)
├── file_path (TEXT)
├── created_at (Timestamp)
└── updated_at (Timestamp)
```

---

### Table 2: Payment Links
**File:** `scripts/setup-payment-links-table.sql`

Enables creating shareable payment request links.

**Features:**
- Create shareable payment links
- Set amounts and expiry dates
- Track link usage
- Activate/deactivate links
- Copy links to clipboard

**Tables Schema:**
```
payment_links
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key → auth.users)
├── code (TEXT, Unique) - Short code for the link
├── amount (NUMERIC) - Optional payment amount
├── description (TEXT) - Link description
├── expires_at (Timestamp) - Expiry date (optional)
├── max_uses (INTEGER) - Maximum uses allowed (optional)
├── current_uses (INTEGER) - Times the link was used
├── is_active (BOOLEAN) - Whether link is still active
├── share_url (TEXT) - Full shareable URL
├── created_at (Timestamp)
└── updated_at (Timestamp)
```

---

### Table 3: Invoices
**File:** `scripts/setup-invoices-table.sql`

Complete invoice management system.

**Features:**
- Create invoices with line items
- Track invoice status (draft, sent, paid, overdue, cancelled)
- Send invoices via email
- Mark as paid
- Download as PDF
- Set due dates
- Add notes

**Tables Schema:**
```
invoices
├── id (UUID, Primary Key)
├── invoice_number (TEXT, Unique) - Auto-generated invoice #
├── user_id (UUID, Foreign Key → auth.users)
├── recipient_email (TEXT)
├── recipient_name (TEXT)
├── items (JSONB) - Line items array
├── subtotal (NUMERIC)
├── tax (NUMERIC)
├── total (NUMERIC)
├── status (TEXT) - draft|sent|paid|overdue|cancelled
├── notes (TEXT)
├── due_date (Timestamp)
├── paid_at (Timestamp)
├── created_at (Timestamp)
└── updated_at (Timestamp)
```

---

## What Gets Created

### Indexes (For Performance)
Each table includes indexes on commonly queried fields:
- `user_id` - For finding user's data
- `status` - For filtering by status
- `created_at` - For sorting by date
- Other relevant fields for each table

### Row Level Security (RLS)
All tables have RLS enabled with policies ensuring:
- ✅ Users can only view their own records
- ✅ Users can only create records for themselves
- ✅ Users can only update/delete their own records
- ✅ Public read access for payment links (needed for payment page)

### Foreign Keys
- All tables reference `auth.users(id)` for the user
- Cascade delete - deleting a user also deletes their records
- Maintains data integrity

---

## Verification

After running the migration, verify the tables were created:

### In Supabase Dashboard:
1. Go to **Table Editor** (left sidebar)
2. You should see three new tables:
   - `receipts`
   - `payment_links`
   - `invoices`

### Test in Your App:
1. Navigate to: `/app/wallet/receipts`
2. Navigate to: `/app/wallet/payment-links`
3. Navigate to: `/app/wallet/invoices`

You should see "No data yet" or be able to create new items without 404 errors.

---

## Troubleshooting

### ❌ "relation already exists"
This is fine! The table already exists. Just refresh your browser.

### ❌ Still getting 404 or "No table" errors
1. Verify you're using admin/owner credentials in Supabase
2. Check the SQL had no syntax errors (errors shown in Supabase UI)
3. Refresh your browser cache (`Ctrl+Shift+R`)
4. Try reopening the page in a new incognito window

### ❌ "Permission denied"
Make sure you're logged into Supabase with your project owner account, not a service role key.

### ❌ "Foreign key violation"
This is normal if you're testing. The issue is that `auth.users` table might not have that user. Log in properly through the app first.

---

## What's Next?

Once tables are created:

### 1. **Receipts** (`/app/wallet/receipts`)
- Make transactions first
- Generate receipts for them
- Download or email receipts

### 2. **Payment Links** (`/app/wallet/payment-links`)
- Create shareable payment links
- Set amounts and expiry
- Share links via email/chat
- Track payment status

### 3. **Invoices** (`/app/wallet/invoices`)
- Create invoices with line items
- Send to customers
- Track payment status
- Download as PDF

---

## Schema Updates

The Drizzle ORM schema has also been updated in `shared/enhanced-schema.ts` with:

```typescript
export const receipts = pgTable('receipts', { ... });
export const payment_links = pgTable('payment_links', { ... });
export const invoices = pgTable('invoices', { ... });
```

This is for future migrations and type safety.

---

## Files Generated

```
scripts/
├── setup-receipts-table.sql          # Individual receipts migration
├── setup-payment-links-table.sql     # Individual payment_links migration
├── setup-invoices-table.sql          # Individual invoices migration
└── setup-all-wallet-tables.sql       # Complete migration (recommended)

shared/
└── enhanced-schema.ts                 # Updated with new table schemas

WALLET_TABLES_SETUP_GUIDE.md          # This file
```

---

## Support

If you encounter issues:
1. Check the **Logs** section in Supabase dashboard
2. Verify SQL syntax in the error message
3. Try running each SQL file separately
4. Ensure you're using the correct Supabase project

---

**Created:** 2024
**Tables:** 3 (Receipts, Payment Links, Invoices)
**Total Indexes:** 13
**Total RLS Policies:** 11

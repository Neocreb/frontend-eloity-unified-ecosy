# Freelance Wallet Synchronization with Unified Wallet

## Overview
The freelance wallet at `/app/freelance/wallet` and the main wallet at `/app/wallet` share a **Single Source of Truth** through the unified wallet system. They are not separate systems—they are different UI views into the same underlying data.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED WALLET SYSTEM                        │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         ┌──────▼────┐ ┌──────▼────┐ ┌──────▼────┐
         │ /app/wallet│ │ /app/      │ │ Other     │
         │ (Main Wallet)        │freelance/ │ Pages     │
         │            │ │wallet     │ │           │
         │ Displays:  │ │(Freelance)│ │           │
         │ • Crypto   │ │           │ │ • Rewards │
         │ • Orders   │ │ Displays: │ │ • Referral│
         │ • Freelance│ │ • Invoices│ │           │
         │ • Rewards  │ │ • Earnings│ │           │
         │ • Referral │ │ • Withdraw│ │           │
         └──────────┬─┘ └──────────┬┘ └───────────┘
                    │              │
                    └──────┬───────┘
                           │
                    ┌──────▼────────────┐
                    │  walletService.   │
                    │getWalletBalance() │
                    └──────┬────────────┘
                           │
                    ┌──────▼──────────────┐
                    │  /api/wallet/balance│
                    │      endpoint       │
                    └──────┬──────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌──────▼─────┐     ┌─────▼─────┐
   │  Crypto │      │ Freelance  │     │ Other     │
   │ Wallets │      │ Payments   │     │ Sources   │
   │  Table  │      │ Table      │     │           │
   └─────────┘      └────────────┘     └───────────┘
```

---

## How Synchronization Works

### 1. **Shared Backend Endpoint**
Both pages call the **same API endpoint**: `/api/wallet/balance`

**Frontend Code (walletService.ts):**
```typescript
async getWalletBalance(): Promise<WalletBalance> {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Both /app/wallet and /app/freelance/wallet call this
  const response = await apiCall(`/api/wallet/balance?userId=${user.id}`);
  
  return {
    total: response.data.balances.total,
    crypto: response.data.balances.crypto,
    ecommerce: response.data.balances.marketplace,
    rewards: response.data.balances.rewards,
    freelance: response.data.balances.freelance  // ← Freelance earnings
  };
}
```

### 2. **Backend Balance Calculation**
The `/api/wallet/balance` endpoint (server/routes/wallet.ts) calculates balances from the actual database:

```typescript
// Get freelance balance from freelance_payments table
const freelanceResult = await db
  .select({ total: sum(freelance_payments.amount) })
  .from(freelance_payments)
  .where(
    and(
      eq(freelance_payments.payee_id, userId),
      eq(freelance_payments.status, 'completed')
    )
  );

balances.freelance = parseFloat(freelanceResult[0]?.total || '0');
```

### 3. **Data Sources**
Each balance category pulls from specific tables:

| Balance Type | Source Table | Key Condition |
|---|---|---|
| **crypto** | `crypto_wallets` | `user_id = {userId}` |
| **marketplace** | `orders` | `seller_id = {userId}` AND `status = 'completed'` |
| **freelance** | `freelance_payments` | `payee_id = {userId}` AND `status = 'completed'` |
| **rewards** | `user_rewards` | `user_id = {userId}` |
| **referral** | `referral_events` | `user_id = {userId}` |

---

## Real-Time Sync Flow

### When a Freelance Invoice is Paid:

```
1. User marks invoice as "Paid"
   ↓
2. freelanceInvoiceIntegrationService.markInvoicePaid()
   ↓
3. Creates entry in freelance_payments table (status: 'completed')
   ↓
4. Makes API call to /api/wallet/update-balance
   ↓
5. Updates wallet_transactions table (records the transaction)
   ↓
6. Next time getWalletBalance() is called:
   - /api/wallet/balance endpoint fetches freelance_payments again
   - Includes the newly completed payment in the sum
   - Returns updated balance.freelance value
   ↓
7. Both /app/wallet and /app/freelance/wallet see the new balance
   (both call the same endpoint)
```

### When a Freelancer Requests Withdrawal:

```
1. User clicks "Withdraw" in /app/freelance/wallet
   ↓
2. freelanceWithdrawalIntegrationService.requestWithdrawal()
   ↓
3. Validates balance using walletService.getWalletBalance()
   ↓
4. Creates entry in withdrawals table (status: 'pending')
   ↓
5. Records in wallet_transactions table
   ↓
6. When withdrawal completes (backend processing):
   - freelance_payments balance is adjusted OR
   - Separate balance tracking handles withdrawal
   ↓
7. Next getWalletBalance() call reflects the new freelance balance
```

---

## Key Integration Points

### 1. **Common Hook: useFreelanceUnifiedWallet**
The freelance dashboard uses a custom hook that centralizes all wallet operations:

```typescript
// src/hooks/useFreelanceUnifiedWallet.ts
const useFreelanceUnifiedWallet = () => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  
  // Fetches from walletService.getWalletBalance()
  // which calls /api/wallet/balance endpoint
  const loadBalance = async () => {
    const walletBalance = await walletService.getWalletBalance();
    setBalance(walletBalance);
  };
  
  // Similar hooks for invoices and withdrawals
  // All pull from unified tables
};
```

### 2. **Shared Tables Structure**

The data is NOT duplicated. Instead:
- ✅ **Single `freelance_payments` table** for completed payments
- ✅ **Single `withdrawals` table** with `withdrawal_type: 'freelance_earnings'`
- ✅ **Single `wallet_transactions` table** for all transaction history
- ❌ **No duplicate tables** like `freelance_invoices` or `freelance_withdrawals`

### 3. **Database Query Pattern**

Both pages query the unified system:
```typescript
// Main wallet queries this endpoint
const balance = await walletService.getWalletBalance();
// Gets all balance categories including freelance

// Freelance wallet queries the same endpoint
const balance = await walletService.getWalletBalance();
// Gets the same balance object, filters for freelance UI display
```

---

## Synchronization Guarantee

### Why They Always Stay in Sync:

1. **Single Endpoint**: Both use `/api/wallet/balance`
2. **Live Calculation**: Balance is calculated from actual database state
3. **No Caching**: Each call fetches fresh data (or uses short-lived cache)
4. **Atomic Updates**: When freelance payment completes, it updates one table (`freelance_payments`) that's included in the balance calculation
5. **Unified ID**: Same `user_id` is used for all queries

### Example: If Balance is $500 in Freelance Wallet...

```
At time T:
- /app/wallet shows: Freelance: $500
- /app/freelance/wallet shows: Available: $500
- Database query: SELECT SUM(amount) FROM freelance_payments WHERE payee_id = 'user123' = $500
```

When an invoice is marked paid:
```
At time T+1:
- freelance_payments table updated with new completed entry
- Both pages call getWalletBalance() → /api/wallet/balance
- Database query: SELECT SUM(amount) FROM freelance_payments = $510 (new amount)
- /app/wallet shows: Freelance: $510
- /app/freelance/wallet shows: Available: $510
```

---

## Currency Handling

Both pages support **dynamic currency detection**:

```typescript
// freelanceInvoiceIntegrationService.ts & freelanceWithdrawalIntegrationService.ts
private static async getUserCurrency(userId: string): Promise<string> {
  // 1. Check user_settings table for preferred_currency
  // 2. Fall back to Intl.DateTimeFormat() timezone detection
  // 3. Default to 'USD'
  
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Maps timezone to currency (e.g., 'Europe/London' → 'GBP')
}
```

When a freelance transaction occurs, it's recorded with the detected currency in `wallet_transactions`, so both pages see consistent currency formatting.

---

## No Minimum Withdrawal for Internal Transfers

The unified system treats freelance payouts as **internal wallet transfers**, so:
- ✅ No $10 minimum requirement
- ✅ Instant processing (to unified wallet)
- ✅ Tracked in wallet_transactions with `withdrawal_type: 'freelance_earnings'`

---

## Summary

| Aspect | /app/wallet | /app/freelance/wallet |
|---|---|---|
| **Data Source** | `/api/wallet/balance` endpoint | `/api/wallet/balance` endpoint |
| **Balance Calculation** | Sums all sources | Sums all sources, filters for `freelance` |
| **Freelance Data** | `freelance_payments` table | `freelance_payments` table |
| **Invoices** | `invoices` table (all types) | `invoices` table with `type = 'freelance'` |
| **Withdrawals** | `withdrawals` table (all types) | `withdrawals` table with `withdrawal_type = 'freelance_earnings'` |
| **Real-Time Sync** | Live (calls API) | Live (calls same API) |

**Bottom Line:** They are synchronized because they share the same backend endpoint, which calculates balances from the actual database state in real-time. When freelance earnings increase, both pages show the updated balance automatically because they query the same source of truth.

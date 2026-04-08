# 🏦 FREELANCE PLATFORM - UNIFIED WALLET INTEGRATION PLAN

**Objective**: Integrate freelance invoicing, payments, and payouts with the existing unified wallet system  
**Status**: Architecture finalized, ready for implementation  
**Approach**: Enhance existing wallet infrastructure, NO duplicates  
**Timeline**: 2-3 days for full integration

---

## 🎯 ARCHITECTURE OVERVIEW

### Current Unified Wallet System ✅
The platform already has:
- ✅ **Unified Wallet** with multiple balance categories:
  - `total` - Sum of all balances
  - `crypto` - Cryptocurrency balance
  - `ecommerce` / `marketplace` - Shopping balance
  - `rewards` - Creator rewards balance
  - `freelance` - Freelance earnings balance
  
- ✅ **Invoice System** (`invoices` table) for all invoice types
- ✅ **Payment Links** for collecting payments
- ✅ **Withdrawal/Payout System** for fund transfers
- ✅ **Invoice/Payment Sync Service** for recording transactions
- ✅ **Unified Wallet API** (`/api/wallet/balance`) that aggregates all balances

### Freelance Integration Strategy
Instead of creating separate tables (`freelance_invoices`, `freelance_withdrawals`), we will:

1. **Extend the existing `invoices` table** with a `type` field
2. **Use existing Payment Links** for freelance payment collections
3. **Use existing Withdrawal System** for freelance payouts
4. **Sync freelance earnings** into the `freelance` balance category
5. **Create freelance-specific UI** that filters/displays wallet features as freelance

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Database Schema Enhancement (15 minutes)

#### Add `type` and `source` Fields to Invoices Table
```sql
-- Add fields to categorize invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general' CHECK (type IN ('general', 'freelance', 'marketplace', 'service')),
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'direct' CHECK (source_type IN ('direct', 'freelance_project', 'marketplace_order', 'payment_link')),
ADD COLUMN IF NOT EXISTS project_id UUID,
ADD COLUMN IF NOT EXISTS freelancer_id UUID,
ADD COLUMN IF NOT EXISTS client_id UUID;

-- Index for faster filtering
CREATE INDEX idx_invoices_type ON invoices(type);
CREATE INDEX idx_invoices_freelance ON invoices(type, freelancer_id) WHERE type = 'freelance';
```

#### Create Invoice Type Field (Optional - for future flexibility)
If we need more detailed categorization, we can add this to track invoice relationship to freelance projects:

```sql
-- Create freelance_invoice_mapping table to link invoices to freelance projects
CREATE TABLE IF NOT EXISTS freelance_invoice_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES freelance_projects(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES freelance_proposals(id),
  milestone_id UUID REFERENCES milestones(id),
  invoice_type TEXT CHECK (invoice_type IN ('project_invoice', 'milestone_payment', 'final_payment')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_freelance_invoices_project ON freelance_invoice_mappings(project_id);
CREATE INDEX idx_freelance_invoices_proposal ON freelance_invoice_mappings(proposal_id);
```

---

### Phase 2: Service Layer Integration (1-2 hours)

#### A. Update Invoice Service to Support Freelance Type
**File**: `src/services/invoiceService.ts`

```typescript
// Extend CreateInvoiceInput interface
export interface CreateInvoiceInput {
  // ... existing fields
  type?: 'general' | 'freelance' | 'marketplace' | 'service';
  sourceType?: 'direct' | 'freelance_project' | 'marketplace_order' | 'payment_link';
  projectId?: string;
  freelancerId?: string;
  clientId?: string;
}

// Update createInvoice method
async createInvoice(userId: string, input: CreateInvoiceInput): Promise<Invoice> {
  try {
    const invoiceNumber = this.generateInvoiceNumber();
    const subtotal = input.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = input.tax || 0;
    const total = subtotal + tax;

    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
          invoice_number: invoiceNumber,
          user_id: userId,
          recipient_email: input.recipientEmail,
          recipient_name: input.recipientName,
          items: input.items,
          subtotal,
          tax,
          total,
          status: 'draft',
          notes: input.notes,
          due_date: input.dueDate?.toISOString(),
          type: input.type || 'general',
          source_type: input.sourceType,
          project_id: input.projectId,
          freelancer_id: input.freelancerId,
          client_id: input.clientId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDatabase(data);
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw new Error('Failed to create invoice');
  }
}

// Add method to get freelance invoices
async getFreelanceInvoices(userId: string, role: 'freelancer' | 'client'): Promise<Invoice[]> {
  try {
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('type', 'freelance');

    if (role === 'freelancer') {
      query = query.eq('freelancer_id', userId);
    } else {
      query = query.eq('client_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(d => this.mapFromDatabase(d));
  } catch (error) {
    console.error('Error fetching freelance invoices:', error);
    return [];
  }
}
```

#### B. Create Freelance Invoice Service
**File**: `src/services/freelanceInvoiceIntegrationService.ts`

```typescript
import { invoiceService } from './invoiceService';
import { freelancePaymentService } from './freelancePaymentService';
import { invoicePaymentSyncService } from './invoicePaymentSyncService';

export class FreelanceInvoiceIntegrationService {
  /**
   * Create a freelance project invoice
   * Integrates with unified wallet system
   */
  static async createProjectInvoice(
    freelancerId: string,
    clientId: string,
    projectId: string,
    projectTitle: string,
    amount: number,
    description?: string
  ): Promise<string | null> {
    try {
      // Create invoice using unified invoice system
      const invoice = await invoiceService.createInvoice(freelancerId, {
        recipientEmail: '', // Will be filled from client profile
        recipientName: '', // Will be filled from client profile
        items: [
          {
            description: description || `Payment for: ${projectTitle}`,
            quantity: 1,
            unitPrice: amount,
            amount: amount,
          },
        ],
        type: 'freelance',
        sourceType: 'freelance_project',
        projectId: projectId,
        freelancerId: freelancerId,
        clientId: clientId,
      });

      // Record transaction in wallet sync service
      await invoicePaymentSyncService.recordInvoicePayment(
        clientId,
        invoice.id,
        amount,
        'invoice_received' // Client receives invoice
      );

      return invoice.id;
    } catch (error) {
      console.error('Error creating freelance invoice:', error);
      return null;
    }
  }

  /**
   * Create milestone payment invoice
   * Called when freelancer completes a milestone
   */
  static async createMilestoneInvoice(
    freelancerId: string,
    clientId: string,
    projectId: string,
    milestoneId: string,
    milestoneTitle: string,
    milestoneAmount: number
  ): Promise<string | null> {
    try {
      return await this.createProjectInvoice(
        freelancerId,
        clientId,
        projectId,
        `Milestone: ${milestoneTitle}`,
        milestoneAmount,
        `Payment for milestone: ${milestoneTitle}`
      );
    } catch (error) {
      console.error('Error creating milestone invoice:', error);
      return null;
    }
  }

  /**
   * Mark invoice as paid and update wallet balance
   */
  static async markInvoiceAsPaid(
    invoiceId: string,
    freelancerId: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Update invoice status
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', invoiceId);

      if (invoiceError) throw invoiceError;

      // Record payment in wallet sync service
      await invoicePaymentSyncService.recordInvoicePayment(
        freelancerId,
        invoiceId,
        amount,
        'invoice_paid'
      );

      // Update freelancer balance in wallet service
      await this.updateFreelancerBalance(freelancerId, amount);

      return true;
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      return false;
    }
  }

  /**
   * Update freelancer's balance in unified wallet
   */
  private static async updateFreelancerBalance(freelancerId: string, amount: number): Promise<void> {
    try {
      // This will trigger the unified wallet API to update the freelance balance
      await fetch(`/api/wallet/update-balance?userId=${freelancerId}&amount=${amount}&type=freelance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error updating freelancer balance:', error);
    }
  }
}

export const freelanceInvoiceIntegrationService = new FreelanceInvoiceIntegrationService();
```

---

### Phase 3: Payment Integration (1-2 hours)

#### Use Existing Payment Links for Freelance Collections
**File**: `src/services/freelancePaymentIntegrationService.ts`

```typescript
import { paymentLinkService } from './paymentLinkService';
import { invoicePaymentSyncService } from './invoicePaymentSyncService';

export class FreelancePaymentIntegrationService {
  /**
   * Create payment link for freelance invoice
   * Uses unified payment link system
   */
  static async createPaymentLink(
    invoiceId: string,
    freelancerId: string,
    clientId: string,
    amount: number,
    description: string
  ): Promise<string | null> {
    try {
      // Use existing payment link service
      const paymentLink = await paymentLinkService.createPaymentLink(
        freelancerId, // Receiver
        {
          amount: amount.toString(),
          description: description,
          invoiceId: invoiceId,
          type: 'freelance_payment',
        }
      );

      // Record in sync service
      await invoicePaymentSyncService.recordPaymentLinkCreated(
        clientId,
        paymentLink.id,
        amount
      );

      return paymentLink.publicUrl;
    } catch (error) {
      console.error('Error creating payment link:', error);
      return null;
    }
  }

  /**
   * Process payment when client pays invoice
   */
  static async processInvoicePayment(
    invoiceId: string,
    freelancerId: string,
    clientId: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Record payment
      const paymentRecord = await invoicePaymentSyncService.recordInvoicePayment(
        freelancerId,
        invoiceId,
        amount,
        'invoice_paid'
      );

      if (!paymentRecord) throw new Error('Failed to record payment');

      // Update wallet balance
      await this.updateWalletBalance(freelancerId, amount);

      // Update invoice status
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      return !error;
    } catch (error) {
      console.error('Error processing invoice payment:', error);
      return false;
    }
  }

  /**
   * Update wallet with payment amount
   */
  private static async updateWalletBalance(
    freelancerId: string,
    amount: number
  ): Promise<void> {
    try {
      const response = await fetch(`/api/wallet/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: freelancerId,
          type: 'freelance',
          amount: amount,
          action: 'add',
        }),
      });

      if (!response.ok) throw new Error('Failed to update balance');
    } catch (error) {
      console.error('Error updating wallet balance:', error);
    }
  }
}

export const freelancePaymentIntegrationService = new FreelancePaymentIntegrationService();
```

---

### Phase 4: Withdrawal/Payout Integration (1-2 hours)

#### Use Existing Withdrawal System for Freelance Payouts
**File**: `src/services/freelanceWithdrawalIntegrationService.ts`

```typescript
import { walletService } from './walletService';
import { supabase } from '@/integrations/supabase/client';

export class FreelanceWithdrawalIntegrationService {
  /**
   * Create withdrawal request from freelance earnings
   * Uses unified wallet withdrawal system
   */
  static async requestWithdrawal(
    freelancerId: string,
    amount: number,
    withdrawalMethod: 'bank_transfer' | 'paypal' | 'crypto' | 'mobile_money',
    withdrawalDetails: {
      bankName?: string;
      accountNumber?: string;
      routingNumber?: string;
      paypalEmail?: string;
      cryptoAddress?: string;
      mobileMoneyNumber?: string;
    }
  ): Promise<string | null> {
    try {
      // Get current freelance balance
      const balance = await walletService.getWalletBalance();
      
      if (balance.freelance < amount) {
        throw new Error('Insufficient freelance balance');
      }

      // Create withdrawal request in the unified system
      // This should integrate with existing withdrawals table
      const { data, error } = await supabase
        .from('withdrawals')
        .insert([
          {
            user_id: freelancerId,
            amount: amount,
            withdrawal_method: withdrawalMethod,
            withdrawal_details: withdrawalDetails,
            status: 'pending',
            withdrawal_type: 'freelance_earnings', // New field to differentiate
            metadata: {
              source: 'freelance_platform',
              processed_at: new Date().toISOString(),
            },
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Record in wallet transaction history
      await this.recordWithdrawalTransaction(
        freelancerId,
        amount,
        'freelance',
        data.id
      );

      return data.id;
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      return null;
    }
  }

  /**
   * Record withdrawal in wallet transaction history
   */
  private static async recordWithdrawalTransaction(
    userId: string,
    amount: number,
    type: string,
    withdrawalId: string
  ): Promise<void> {
    try {
      await supabase
        .from('wallet_transactions')
        .insert([
          {
            user_id: userId,
            transaction_type: 'withdrawal',
            amount: amount,
            balance_type: type,
            withdrawal_id: withdrawalId,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ]);
    } catch (error) {
      console.error('Error recording withdrawal transaction:', error);
    }
  }

  /**
   * Get freelancer's pending and completed withdrawals
   */
  static async getFreelancerWithdrawals(freelancerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', freelancerId)
        .eq('withdrawal_type', 'freelance_earnings')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      return [];
    }
  }

  /**
   * Check freelancer withdrawal eligibility
   */
  static async checkWithdrawalEligibility(freelancerId: string): Promise<{
    isEligible: boolean;
    balance: number;
    minimumWithdrawal: number;
    reason?: string;
  }> {
    try {
      const balance = await walletService.getWalletBalance();
      const minimumWithdrawal = 10; // Minimum $10

      return {
        isEligible: balance.freelance >= minimumWithdrawal,
        balance: balance.freelance,
        minimumWithdrawal,
        reason: balance.freelance < minimumWithdrawal 
          ? `Minimum withdrawal is $${minimumWithdrawal}` 
          : undefined,
      };
    } catch (error) {
      console.error('Error checking withdrawal eligibility:', error);
      return {
        isEligible: false,
        balance: 0,
        minimumWithdrawal: 10,
        reason: 'Error checking eligibility',
      };
    }
  }
}

export const freelanceWithdrawalIntegrationService = new FreelanceWithdrawalIntegrationService();
```

---

### Phase 5: UI Component Integration (1-2 hours)

#### Update Freelance Invoice Service to Use Wallet Infrastructure
**File**: `src/services/freelanceInvoiceService.ts` (Updated)

```typescript
// Replace the separate freelance invoice service with integration helpers

import { freelanceInvoiceIntegrationService } from './freelanceInvoiceIntegrationService';
import { invoiceService } from './invoiceService';

export class FreelanceInvoiceService {
  /**
   * Create invoice for freelance work
   * Automatically syncs with unified wallet
   */
  static async createInvoice(invoiceData: {
    freelancerId: string;
    clientId: string;
    projectId: string;
    amount: number;
    description?: string;
  }): Promise<string | null> {
    return freelanceInvoiceIntegrationService.createProjectInvoice(
      invoiceData.freelancerId,
      invoiceData.clientId,
      invoiceData.projectId,
      invoiceData.description || 'Freelance Work',
      invoiceData.amount,
      invoiceData.description
    );
  }

  /**
   * Get freelancer's invoices
   * Uses unified invoice system
   */
  static async getFreelancerInvoices(freelancerId: string): Promise<any[]> {
    return invoiceService.getFreelanceInvoices(freelancerId, 'freelancer');
  }

  /**
   * Get client's invoices (invoices they need to pay)
   */
  static async getClientInvoices(clientId: string): Promise<any[]> {
    return invoiceService.getFreelanceInvoices(clientId, 'client');
  }

  /**
   * Download invoice (uses unified system)
   */
  static async downloadInvoice(invoiceId: string): Promise<string | null> {
    // Use the existing invoice download functionality
    // This will work automatically since we're using the unified system
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/download`, {
        method: 'GET',
      });

      if (response.ok) {
        return await response.text();
      }
      return null;
    } catch (error) {
      console.error('Error downloading invoice:', error);
      return null;
    }
  }

  // All other methods use the unified wallet infrastructure
}

export const freelanceInvoiceService = new FreelanceInvoiceService();
```

---

### Phase 6: Frontend Component Updates (2-3 hours)

#### Update Freelance Invoices Page
**File**: `src/pages/freelance/FreelancerInvoices.tsx` (New/Updated)

```typescript
import { useInvoices } from '@/hooks/useInvoices';
import { useWallet } from '@/hooks/use-wallet';
import { useUser } from '@/hooks/useUser';
import { freelanceInvoiceIntegrationService } from '@/services/freelanceInvoiceIntegrationService';

export default function FreelancerInvoices() {
  const { user } = useUser();
  const { getFreelanceInvoices } = useInvoices();
  const { getWalletBalance } = useWallet();
  const [invoices, setInvoices] = useState([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      // Get freelance invoices from unified system
      const invoicesList = await getFreelanceInvoices(user.id);
      setInvoices(invoicesList);

      // Get freelance balance from wallet
      const walletBalance = await getWalletBalance();
      setBalance(walletBalance.freelance);
    };

    loadData();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Freelance Balance</CardTitle>
          <CardDescription>Your earnings from freelance work</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${balance.toFixed(2)}</div>
          <p className="text-sm text-gray-600 mt-2">
            Synced with your wallet
          </p>
          {balance > 0 && (
            <Button 
              className="mt-4"
              onClick={() => navigate('/app/wallet/withdraw?type=freelance')}
            >
              Withdraw Earnings
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>My Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-gray-500">No invoices yet</p>
          ) : (
            <div className="space-y-2">
              {invoices.map(invoice => (
                <div key={invoice.id} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-semibold">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-600">${invoice.total}</p>
                  </div>
                  <Badge>{invoice.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📊 UNIFIED SYSTEM BENEFITS

By integrating with the existing wallet system:

| Feature | Benefit |
|---------|---------|
| **Single Balance** | All earnings tracked in one place |
| **Unified Invoices** | One invoice system for all platforms |
| **Integrated Payments** | Use existing payment links for collection |
| **Wallet Sync** | Automatic balance updates |
| **Withdrawals** | Use proven withdrawal system |
| **Transaction History** | Complete history across all services |
| **No Duplicates** | No conflicting data or tables |
| **Consistent UX** | Same experience across platform |

---

## 🗂️ DATABASE SCHEMA CHANGES

### Required Migrations

**Migration 1**: Extend invoices table (15 min)
```sql
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS source_type TEXT,
ADD COLUMN IF NOT EXISTS project_id UUID,
ADD COLUMN IF NOT EXISTS freelancer_id UUID,
ADD COLUMN IF NOT EXISTS client_id UUID;

CREATE INDEX idx_invoices_type ON invoices(type);
```

**Migration 2**: Add freelance_invoice_mappings (optional)
```sql
CREATE TABLE IF NOT EXISTS freelance_invoice_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES freelance_projects(id),
  proposal_id UUID REFERENCES freelance_proposals(id),
  milestone_id UUID REFERENCES milestones(id),
  invoice_type TEXT CHECK (invoice_type IN ('project_invoice', 'milestone_payment', 'final_payment')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Migration 3**: Update withdrawals table (if needed)
```sql
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS withdrawal_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS freelance_project_id UUID;
```

---

## 🔄 DATA FLOW

```
Freelancer completes work
    ↓
Create Invoice (unified system + tag as freelance)
    ↓
Send payment link to client
    ↓
Client pays invoice
    ↓
Record payment in invoice_payment_sync
    ↓
Update wallet freelance balance
    ↓
Freelancer can view in wallet + freelance dashboard
    ↓
Request withdrawal
    ↓
Use existing withdrawal system
```

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] **Phase 1**: Add `type`, `source_type`, `project_id` fields to invoices table
- [ ] **Phase 2**: Update invoiceService to handle freelance type
- [ ] **Phase 2**: Create freelanceInvoiceIntegrationService
- [ ] **Phase 3**: Create freelancePaymentIntegrationService
- [ ] **Phase 4**: Create freelanceWithdrawalIntegrationService
- [ ] **Phase 5**: Update freelanceInvoiceService to use integration layer
- [ ] **Phase 6**: Update UI components to use unified system
- [ ] **Phase 6**: Update FreelancerInvoices page to show wallet balance
- [ ] **Phase 6**: Update FreelancerEarnings page to link to wallet
- [ ] **Testing**: Verify invoices appear in wallet
- [ ] **Testing**: Verify balance updates when invoice is paid
- [ ] **Testing**: Verify withdrawal uses correct balance

---

## 🎯 FINAL STATE

After implementation:

✅ Freelance invoices are created in the unified `invoices` table  
✅ Tagged as `type: 'freelance'` for easy filtering  
✅ Payments recorded in invoice_payment_sync service  
✅ Freelance earnings automatically update wallet balance  
✅ Freelancers withdraw using existing wallet withdrawal system  
✅ All data available in wallet analytics and history  
✅ No duplicate invoice or withdrawal tables  
✅ Single source of truth for all platform transactions

---

## 🔗 RELATED DOCUMENTATION

- **FREELANCE_IMPLEMENTATION_COMPLETION_GUIDE.md** - Original implementation plan
- **FREELANCE_IMMEDIATE_ACTION_GUIDE.md** - User action items
- **SESSION_COMPLETION_SUMMARY.md** - Current progress

---

**Status**: Documentation ready for implementation  
**Next Step**: Run Phase 1 database migrations  
**Timeline**: 2-3 days for complete integration  
**Approach**: Enhanced integration, no duplicates ✅

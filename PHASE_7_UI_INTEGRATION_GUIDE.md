# Phase 7 UI Components Integration Guide

## Overview

This guide provides comprehensive instructions for integrating Phase 7 UI components into your freelance dashboard. All components are production-ready and follow your existing design patterns.

## Components Created

### 1. **AdvancedInvoiceSearch** (`src/components/freelance/AdvancedInvoiceSearch.tsx`)
Advanced filtering and search component with fuzzy search, multi-criteria filtering, and statistics.

**Features:**
- Full-text search with fuzzy matching
- Status, date range, and amount filtering
- Smart sorting (by date, amount, status, client)
- Real-time statistics (total, average, highest, by-status breakdown)
- Built-in pagination
- Visual filters display with active filter count

**Usage:**
```typescript
import { AdvancedInvoiceSearch } from '@/components/freelance/AdvancedInvoiceSearch';

export function InvoiceManagement() {
  const [invoices] = useState<Invoice[]>([...]);
  
  return (
    <AdvancedInvoiceSearch
      invoices={invoices}
      onFilterChange={(filtered) => console.log('Filtered:', filtered)}
      pageSize={10}
    />
  );
}
```

**Props:**
- `invoices`: `Invoice[]` - Array of invoices to filter
- `onFilterChange?`: `(filtered: Invoice[]) => void` - Callback when filters change
- `pageSize?`: `number` - Items per page (default: 10)

---

### 2. **FreelanceExportPanel** (`src/components/freelance/FreelanceExportPanel.tsx`)
Comprehensive export component supporting PDF and CSV formats.

**Features:**
- Single and batch PDF export
- CSV export with customization options
- Multiple export types (invoices, withdrawals, combined history)
- Date format options (ISO, US, EU)
- CSV delimiter options (comma, semicolon, tab)
- Custom filename support
- Visual export summary
- Export tips and best practices

**Usage:**
```typescript
import { FreelanceExportPanel } from '@/components/freelance/FreelanceExportPanel';

export function ExportPage() {
  const [invoices] = useState<Invoice[]>([...]);
  const [withdrawals] = useState<Withdrawal[]>([...]);
  
  return (
    <FreelanceExportPanel
      invoices={invoices}
      withdrawals={withdrawals}
      transactions={transactions}
    />
  );
}
```

**Props:**
- `invoices?`: `Invoice[]` - Array of invoices to export
- `withdrawals?`: `Withdrawal[]` - Array of withdrawals to export
- `transactions?`: `any[]` - Array of transactions to export

---

### 3. **PaymentRemindersManager** (`src/components/freelance/PaymentRemindersManager.tsx`)
Payment reminder and automation management component.

**Features:**
- Real-time statistics (pending, overdue, upcoming, active rules)
- Overdue invoice tracking with urgent styling
- Upcoming due date alerts
- Automation rule creation dialog
- Auto-schedule all reminders
- Visual rule management
- Multiple trigger types (overdue, upcoming, unpaid, payment received)
- Multiple action types (email, SMS, in-app, webhooks)

**Usage:**
```typescript
import { PaymentRemindersManager } from '@/components/freelance/PaymentRemindersManager';

export function ReminderPage() {
  const [invoices] = useState<Invoice[]>([...]);
  
  return (
    <PaymentRemindersManager
      invoices={invoices}
      onReminderSent={(invoiceId) => {
        console.log('Reminder sent for:', invoiceId);
      }}
    />
  );
}
```

**Props:**
- `invoices?`: `Invoice[]` - Array of invoices for reminder management
- `onReminderSent?`: `(invoiceId: string) => void` - Callback when reminder is sent

---

### 4. **Phase7IntegratedDashboard** (`src/components/freelance/Phase7IntegratedDashboard.tsx`)
Complete integrated dashboard combining all Phase 7 features with tabbed interface.

**Features:**
- Tabbed interface for search, export, and reminders
- Dashboard statistics overview
- Feature highlights
- Pro tips section
- Integration status display
- Responsive design

**Usage:**
```typescript
import { Phase7IntegratedDashboard } from '@/components/freelance/Phase7IntegratedDashboard';

export function FreelanceDashboard() {
  const [invoices] = useState<Invoice[]>([...]);
  
  return (
    <Phase7IntegratedDashboard
      invoices={invoices}
      withdrawals={withdrawals}
      transactions={transactions}
      onInvoiceSelect={(invoice) => {
        console.log('Selected:', invoice);
      }}
    />
  );
}
```

**Props:**
- `invoices`: `Invoice[]` - Array of invoices (required)
- `withdrawals?`: `Withdrawal[]` - Array of withdrawals
- `transactions?`: `any[]` - Array of transactions
- `onInvoiceSelect?`: `(invoice: Invoice) => void` - Callback when invoice is selected

---

## Integration Paths

### Path 1: Quick Integration (Recommended)
Replace existing dashboard with the integrated dashboard:

```typescript
// src/pages/freelance/FreelanceDashboard.tsx
import { Phase7IntegratedDashboard } from '@/components/freelance/Phase7IntegratedDashboard';

export default function FreelanceDashboard() {
  const { invoices, withdrawals, transactions } = useFreelanceData();
  
  return (
    <div className="space-y-6">
      <Phase7IntegratedDashboard
        invoices={invoices}
        withdrawals={withdrawals}
        transactions={transactions}
      />
    </div>
  );
}
```

### Path 2: Modular Integration
Add individual components to existing pages:

```typescript
// Add to earnings/invoicing page
import { AdvancedInvoiceSearch } from '@/components/freelance/AdvancedInvoiceSearch';
import { FreelanceExportPanel } from '@/components/freelance/FreelanceExportPanel';
import { PaymentRemindersManager } from '@/components/freelance/PaymentRemindersManager';

export default function FinancialPage() {
  return (
    <Tabs>
      <TabsContent value="invoices">
        <AdvancedInvoiceSearch invoices={invoices} />
      </TabsContent>
      <TabsContent value="export">
        <FreelanceExportPanel invoices={invoices} />
      </TabsContent>
      <TabsContent value="reminders">
        <PaymentRemindersManager invoices={invoices} />
      </TabsContent>
    </Tabs>
  );
}
```

### Path 3: Sidebar Widget Integration
Add components as collapsible widgets:

```typescript
// Create a sidebar widget
import { FreelanceExportPanel } from '@/components/freelance/FreelanceExportPanel';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function ExportWidget({ invoices }) {
  return (
    <Collapsible>
      <CollapsibleTrigger>Export Invoices</CollapsibleTrigger>
      <CollapsibleContent>
        <FreelanceExportPanel invoices={invoices} />
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

## Data Types

### Invoice Interface
```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue" | "draft";
  issueDate: Date | string;
  dueDate: Date | string;
  items?: {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  subtotal?: number;
  tax?: number;
  total?: number;
  notes?: string;
}
```

### Withdrawal Interface
```typescript
interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  createdAt: Date | string;
}
```

---

## Styling & Customization

All components use your existing design system:

- **Colors**: Dark mode support via `dark:` utilities
- **Components**: Radix UI + shadcn/ui components
- **Typography**: Consistent font sizing and weights
- **Icons**: Lucide React icons
- **Spacing**: Tailwind spacing scale

### Custom Styling Example
```typescript
// Extend card styling
<Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
  <AdvancedInvoiceSearch invoices={invoices} />
</Card>
```

---

## Hook Dependencies

All components use these hooks that must be available:

### Required Hooks
1. **useAdvancedFilter** - Advanced filtering and search
2. **useCsvExport** - CSV export functionality
3. **useInvoicePdfExport** - PDF generation
4. **usePaymentReminders** - Reminder management
5. **useToast** - Toast notifications

### Verify Hook Availability
```bash
# Check if hooks exist
ls -la src/hooks/useAdvancedFilter.ts
ls -la src/hooks/useCsvExport.ts
ls -la src/hooks/useInvoicePdfExport.ts
ls -la src/hooks/usePaymentReminders.ts
```

---

## Performance Considerations

### For Large Datasets
- **Pagination**: Use pageSize prop to limit items per page
- **Filtering**: Filters are applied client-side; use debouncing for search
- **Export**: Large exports (>10K items) may take time; show loading state

### Memory Optimization
```typescript
// Use useMemo for expensive computations
const filteredInvoices = useMemo(() => {
  return filterInvoices(invoices);
}, [invoices, criteria]);

// Use useCallback for stable function references
const handleExport = useCallback(() => {
  exportInvoices(invoices);
}, [invoices]);
```

---

## Error Handling

All components include built-in error handling with toast notifications:

```typescript
try {
  await exportInvoices(invoices);
  toast({
    title: "Success",
    description: "Invoices exported successfully"
  });
} catch (error) {
  toast({
    title: "Error",
    description: error instanceof Error ? error.message : "Export failed",
    variant: "destructive"
  });
}
```

---

## Testing Guide

### Unit Testing Example
```typescript
import { render, screen } from '@testing-library/react';
import { AdvancedInvoiceSearch } from '@/components/freelance/AdvancedInvoiceSearch';

describe('AdvancedInvoiceSearch', () => {
  it('filters invoices by status', () => {
    const invoices = [
      { id: '1', status: 'paid', ... },
      { id: '2', status: 'pending', ... }
    ];
    
    render(<AdvancedInvoiceSearch invoices={invoices} />);
    
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    // Test filtering logic...
  });
});
```

---

## Migration Checklist

- [ ] Install jsPDF if not already installed: `npm install jspdf`
- [ ] Copy components to `src/components/freelance/`
- [ ] Verify hooks exist in `src/hooks/`
- [ ] Update imports in target pages
- [ ] Test filtering functionality
- [ ] Test PDF export
- [ ] Test CSV export
- [ ] Test reminder creation
- [ ] Verify responsive design
- [ ] Update documentation

---

## Database Requirements

For full functionality, ensure these tables exist in your Supabase database:

```sql
-- Invoices table
CREATE TABLE freelance_invoices (
  id UUID PRIMARY KEY,
  invoice_number TEXT UNIQUE,
  client_name TEXT,
  amount NUMERIC,
  status TEXT,
  created_at TIMESTAMP
);

-- Reminders table
CREATE TABLE freelance_reminder_rules (
  id UUID PRIMARY KEY,
  name TEXT,
  triggers JSONB,
  actions JSONB,
  is_active BOOLEAN
);

-- Reminders log
CREATE TABLE freelance_reminders_log (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES freelance_invoices(id),
  sent_at TIMESTAMP,
  status TEXT
);
```

---

## Support & Troubleshooting

### Common Issues

**Issue**: Export button disabled
- **Solution**: Ensure invoices array is not empty

**Issue**: Filters not updating
- **Solution**: Check useAdvancedFilter hook and dependency arrays

**Issue**: Reminders not sending
- **Solution**: Verify usePaymentReminders hook is properly initialized

**Issue**: Toast notifications not showing
- **Solution**: Ensure useToast hook is available and parent component has ToastProvider

---

## Next Steps

1. **Integrate**: Choose integration path and implement
2. **Test**: Verify all features work with your data
3. **Customize**: Adjust styling to match your brand
4. **Deploy**: Push to production
5. **Monitor**: Track user feedback and usage

---

## Additional Resources

- [Advanced Filter Service Docs](FREELANCE_WALLET_PHASE_7_COMPLETE.md#feature-2-advanced-filtering--search)
- [PDF Export Service Docs](FREELANCE_WALLET_PHASE_7_COMPLETE.md#feature-1-invoice-pdf-export)
- [CSV Export Service Docs](FREELANCE_WALLET_PHASE_7_COMPLETE.md#feature-3-bulk-csv-export)
- [Payment Reminders Docs](FREELANCE_WALLET_PHASE_7_COMPLETE.md#feature-4-payment-reminders--automation)

---

## Feedback & Improvements

Have suggestions or found issues? Please report them and we'll address them promptly.

Happy integrating! 🚀

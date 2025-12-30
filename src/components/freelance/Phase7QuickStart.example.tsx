/**
 * Phase 7 Quick Start - Implementation Example
 * 
 * This file demonstrates how to quickly integrate Phase 7 features
 * into your existing freelance dashboard.
 * 
 * IMPORTANT: This is an example file. Copy the code patterns to your actual pages.
 */

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

// Import Phase 7 components
import AdvancedInvoiceSearch from "./AdvancedInvoiceSearch";
import FreelanceExportPanel from "./FreelanceExportPanel";
import PaymentRemindersManager from "./PaymentRemindersManager";
import Phase7IntegratedDashboard from "./Phase7IntegratedDashboard";

// Sample data types
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
}

interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  createdAt: Date | string;
}

/**
 * ============================================================================
 * OPTION 1: Quick Dashboard Integration (Recommended for new projects)
 * ============================================================================
 * 
 * If you're starting fresh or want a complete solution, use the
 * Phase7IntegratedDashboard component which combines all features.
 */
export function QuickDashboardIntegration() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "1",
      invoiceNumber: "INV-2024-001",
      clientName: "Acme Corp",
      clientEmail: "billing@acme.com",
      projectTitle: "Website Redesign",
      amount: 5000,
      currency: "USD",
      status: "pending",
      issueDate: new Date("2024-01-15"),
      dueDate: new Date("2024-02-14"),
    },
    // ... more invoices
  ]);

  return (
    <Phase7IntegratedDashboard
      invoices={invoices}
      withdrawals={[]}
      transactions={[]}
      onInvoiceSelect={(invoice) => {
        console.log("Selected invoice:", invoice);
      }}
    />
  );
}

/**
 * ============================================================================
 * OPTION 2: Modular Integration (For existing dashboards)
 * ============================================================================
 * 
 * If you have an existing dashboard structure, you can add components
 * individually using tabs or sections.
 */
export function ModularDashboardIntegration() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [activeTab, setActiveTab] = useState("search");

  // Simulate fetching data
  useEffect(() => {
    // TODO: Replace with your actual data fetching logic
    const mockInvoices: Invoice[] = [
      {
        id: "1",
        invoiceNumber: "INV-001",
        clientName: "Client A",
        clientEmail: "client-a@example.com",
        projectTitle: "Project A",
        amount: 1000,
        currency: "USD",
        status: "paid",
        issueDate: new Date("2024-01-01"),
        dueDate: new Date("2024-01-31"),
      },
    ];
    setInvoices(mockInvoices);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Financial Management</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="search">Search & Filter</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <AdvancedInvoiceSearch
            invoices={invoices}
            onFilterChange={(filtered) => {
              console.log("Filtered invoices:", filtered);
            }}
            pageSize={10}
          />
        </TabsContent>

        <TabsContent value="export">
          <FreelanceExportPanel
            invoices={invoices}
            withdrawals={withdrawals}
            transactions={[]}
          />
        </TabsContent>

        <TabsContent value="reminders">
          <PaymentRemindersManager
            invoices={invoices}
            onReminderSent={(invoiceId) => {
              console.log("Reminder sent for invoice:", invoiceId);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * ============================================================================
 * OPTION 3: Section-Based Integration (For complex dashboards)
 * ============================================================================
 * 
 * Add features as distinct sections within your existing pages.
 */
export function SectionBasedIntegration() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { toast } = useToast();

  return (
    <div className="space-y-8">
      {/* Search & Filter Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Invoice Management</h2>
        <AdvancedInvoiceSearch
          invoices={invoices}
          onFilterChange={(filtered) => {
            toast({
              description: `Found ${filtered.length} matching invoices`,
            });
          }}
          pageSize={15}
        />
      </section>

      {/* Export Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Export & Reports</h2>
        <FreelanceExportPanel invoices={invoices} withdrawals={[]} />
      </section>

      {/* Reminders Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Payment Reminders</h2>
        <PaymentRemindersManager
          invoices={invoices}
          onReminderSent={(invoiceId) => {
            toast({
              title: "Success",
              description: "Payment reminder sent!",
            });
          }}
        />
      </section>
    </div>
  );
}

/**
 * ============================================================================
 * OPTION 4: Single Component Integration (For standalone pages)
 * ============================================================================
 * 
 * Use just one component if you're building a specific feature.
 */

// Search & Filter Only
export function SearchOnlyPage() {
  const [invoices] = useState<Invoice[]>([
    // Your invoice data
  ]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Search & Filter Invoices</h1>
      <AdvancedInvoiceSearch invoices={invoices} pageSize={20} />
    </div>
  );
}

// Export Only
export function ExportOnlyPage() {
  const [invoices] = useState<Invoice[]>([]);
  const [withdrawals] = useState<Withdrawal[]>([]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Export Your Data</h1>
      <FreelanceExportPanel invoices={invoices} withdrawals={withdrawals} />
    </div>
  );
}

// Reminders Only
export function RemindersOnlyPage() {
  const [invoices] = useState<Invoice[]>([]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Payment Reminders</h1>
      <PaymentRemindersManager invoices={invoices} />
    </div>
  );
}

/**
 * ============================================================================
 * IMPLEMENTATION CHECKLIST
 * ============================================================================
 * 
 * After choosing your integration option:
 * 
 * 1. [ ] Copy the component code to your project
 * 2. [ ] Import the components in your page
 * 3. [ ] Prepare your invoice and withdrawal data
 * 4. [ ] Pass data to components via props
 * 5. [ ] Test filtering functionality
 * 6. [ ] Test export functionality
 * 7. [ ] Test reminder creation
 * 8. [ ] Verify responsive design on mobile
 * 9. [ ] Customize styling if needed
 * 10. [ ] Deploy to production
 */

/**
 * ============================================================================
 * COMMON INTEGRATION PATTERNS
 * ============================================================================
 */

// Pattern 1: With Loading State
export function WithLoadingState() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch invoices
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <AdvancedInvoiceSearch invoices={invoices} />;
}

// Pattern 2: With Error Handling
export function WithErrorHandling() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      // Fetch invoices
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  }, [toast]);

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return <AdvancedInvoiceSearch invoices={invoices} />;
}

// Pattern 3: With Data Synchronization
export function WithDataSync() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Re-fetch data when component mounts or on manual refresh
  const refreshData = async () => {
    // Fetch invoices and update state
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="space-y-4">
      <button onClick={refreshData}>Refresh Data</button>
      <AdvancedInvoiceSearch invoices={invoices} />
    </div>
  );
}

/**
 * ============================================================================
 * STYLING CUSTOMIZATION EXAMPLES
 * ============================================================================
 */

// Custom themed components
export function CustomStyling() {
  const [invoices] = useState<Invoice[]>([]);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 rounded-lg">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-6">
          Professional Dashboard
        </h1>
        <AdvancedInvoiceSearch invoices={invoices} />
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * TIPS & BEST PRACTICES
 * ============================================================================
 * 
 * 1. **Data Preparation**
 *    - Ensure invoice dates are valid Date objects or ISO strings
 *    - Include all required fields (id, invoiceNumber, clientName, etc.)
 *    - Use consistent currency codes (USD, EUR, etc.)
 * 
 * 2. **Performance**
 *    - Use pagination for large invoice lists (>100 items)
 *    - Memoize filtered results if re-rendering frequently
 *    - Lazy-load components if below fold
 * 
 * 3. **User Experience**
 *    - Show loading states during data fetch
 *    - Display success/error toast messages
 *    - Provide clear empty state messages
 *    - Include helpful tooltips for complex features
 * 
 * 4. **Accessibility**
 *    - Use semantic HTML elements
 *    - Include ARIA labels where needed
 *    - Ensure keyboard navigation works
 *    - Test with screen readers
 * 
 * 5. **Mobile Responsiveness**
 *    - Test on different screen sizes
 *    - Use Tailwind's responsive utilities
 *    - Consider touch-friendly button sizes (min 44x44px)
 *    - Test export functionality on mobile
 */

export default QuickDashboardIntegration;

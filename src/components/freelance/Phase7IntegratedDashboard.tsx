import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Search,
  Download,
  Bell,
  BarChart3,
  FileText,
  TrendingUp,
} from "lucide-react";
import AdvancedInvoiceSearch from "./AdvancedInvoiceSearch";
import FreelanceExportPanel from "./FreelanceExportPanel";
import PaymentRemindersManager from "./PaymentRemindersManager";
import { useToast } from "@/components/ui/use-toast";

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
  items?: any[];
  subtotal?: number;
  tax?: number;
  total?: number;
  notes?: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  createdAt: Date | string;
}

interface Phase7DashboardProps {
  invoices: Invoice[];
  withdrawals?: Withdrawal[];
  transactions?: any[];
  onInvoiceSelect?: (invoice: Invoice) => void;
}

/**
 * Phase 7 Integrated Dashboard
 * Combines all Phase 7 features:
 * - Advanced Invoice Search & Filtering
 * - PDF & CSV Export
 * - Payment Reminders & Automation
 * 
 * @param props Dashboard configuration
 * @returns Complete Phase 7 dashboard component
 */
export const Phase7IntegratedDashboard: React.FC<Phase7DashboardProps> = ({
  invoices,
  withdrawals = [],
  transactions = [],
  onInvoiceSelect,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("search");
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>(invoices);
  const [selectedReminders, setSelectedReminders] = useState<string[]>([]);

  // Calculate dashboard statistics
  const stats = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paidInvoices: invoices.filter((inv) => inv.status === "paid").length,
    overdueInvoices: invoices.filter((inv) => inv.status === "overdue").length,
    pendingInvoices: invoices.filter((inv) => inv.status === "pending").length,
    averageInvoice:
      invoices.length > 0
        ? invoices.reduce((sum, inv) => sum + inv.amount, 0) / invoices.length
        : 0,
  };

  const handleFilterChange = (filtered: Invoice[]) => {
    setFilteredInvoices(filtered);
  };

  const handleReminderSent = (invoiceId: string) => {
    setSelectedReminders((prev) => [...prev, invoiceId]);
    toast({
      title: "Reminder sent",
      description: "Payment reminder has been sent to the client",
    });
  };

  const handleExportComplete = () => {
    toast({
      title: "Export successful",
      description: "Your data has been exported and downloaded",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Financial Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Advanced search, filtering, export, and payment automation
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Invoices
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalInvoices}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Amount
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Paid
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.paidInvoices}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.pendingInvoices}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Overdue
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.overdueInvoices}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg. Invoice
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.averageInvoice.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabbed Interface */}
      <Card>
        <Tabs defaultValue="search" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
            <TabsTrigger
              value="search"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400"
            >
              <Search className="w-4 h-4 mr-2" />
              Search & Filter
            </TabsTrigger>
            <TabsTrigger
              value="export"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger
              value="reminders"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400"
            >
              <Bell className="w-4 h-4 mr-2" />
              Reminders
            </TabsTrigger>
          </TabsList>

          {/* Search & Filter Tab */}
          <TabsContent value="search" className="mt-6">
            <AdvancedInvoiceSearch
              invoices={invoices}
              onFilterChange={handleFilterChange}
              pageSize={10}
            />
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="mt-6">
            <FreelanceExportPanel
              invoices={filteredInvoices.length > 0 ? filteredInvoices : invoices}
              withdrawals={withdrawals}
              transactions={transactions}
            />
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="mt-6">
            <PaymentRemindersManager
              invoices={invoices}
              onReminderSent={handleReminderSent}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Search className="w-5 h-5" />
              Smart Search
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 dark:text-gray-400">
            <ul className="space-y-1">
              <li>✓ Fuzzy search with intelligent matching</li>
              <li>✓ Multi-criteria filtering by status, date, amount</li>
              <li>✓ Advanced sorting and pagination</li>
              <li>✓ Real-time statistics generation</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Download className="w-5 h-5" />
              Flexible Export
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 dark:text-gray-400">
            <ul className="space-y-1">
              <li>✓ PDF invoices with professional formatting</li>
              <li>✓ CSV exports for Excel/Google Sheets</li>
              <li>✓ Batch export with custom options</li>
              <li>✓ Multiple date and delimiter formats</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Bell className="w-5 h-5" />
              Automation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 dark:text-gray-400">
            <ul className="space-y-1">
              <li>✓ Automatic reminder scheduling</li>
              <li>✓ Overdue invoice tracking</li>
              <li>✓ Custom automation rules</li>
              <li>✓ Multi-channel notifications</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Pro Tips for Maximum Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                💡 Search Tips
              </p>
              <ul className="space-y-1">
                <li>• Use partial names for fuzzy matching</li>
                <li>• Filter by date range for period analysis</li>
                <li>• Set amount ranges to find high-value invoices</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                📊 Export Tips
              </p>
              <ul className="space-y-1">
                <li>• Use CSV for spreadsheet applications</li>
                <li>• PDF is ideal for client distribution</li>
                <li>• Combine history exports for annual reports</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                🔔 Reminder Tips
              </p>
              <ul className="space-y-1">
                <li>• Set reminders 3-5 days before due date</li>
                <li>• Create rules for recurring automation</li>
                <li>• Track overdue invoices immediately</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                ⚡ Productivity Tips
              </p>
              <ul className="space-y-1">
                <li>• Use auto-schedule for all reminders</li>
                <li>• Export monthly for record-keeping</li>
                <li>• Monitor statistics for trends</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 7 Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Badge variant="default">✓</Badge>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Advanced Invoice Search
                </span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Fully integrated
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Badge variant="default">✓</Badge>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  PDF & CSV Export
                </span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Fully integrated
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Badge variant="default">✓</Badge>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Payment Reminders
                </span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Fully integrated
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Badge variant="default">✓</Badge>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Automation Rules
                </span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Fully integrated
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
            All Phase 7 features are now available in your freelance dashboard.
            Start using them to streamline your financial management workflow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase7IntegratedDashboard;

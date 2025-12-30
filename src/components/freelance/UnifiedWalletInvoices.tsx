import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Download,
  Eye,
  Copy,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Send,
} from "lucide-react";
import { useFreelanceUnifiedWallet, type FreelanceInvoice } from "@/hooks/useFreelanceUnifiedWallet";
import { toast } from "sonner";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const statusIcons = {
  draft: <AlertCircle className="w-4 h-4" />,
  sent: <Send className="w-4 h-4" />,
  paid: <CheckCircle2 className="w-4 h-4" />,
  overdue: <AlertCircle className="w-4 h-4" />,
  cancelled: <AlertCircle className="w-4 h-4" />,
};

interface CreateInvoiceFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

const CreateInvoiceForm: React.FC<CreateInvoiceFormProps> = ({ onSubmit, isLoading }) => {
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId || !projectId || !projectTitle || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await onSubmit({
        clientId,
        projectId,
        projectTitle,
        amount: parsedAmount,
        description,
      });

      // Reset form
      setClientId("");
      setProjectId("");
      setProjectTitle("");
      setAmount("");
      setDescription("");
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Client ID *</label>
        <Input
          placeholder="Enter client user ID"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Project ID *</label>
        <Input
          placeholder="Enter project ID"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Project Title *</label>
        <Input
          placeholder="Enter project title"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Amount *</label>
        <Input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          min="0"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          placeholder="Enter invoice description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Invoice...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </>
        )}
      </Button>
    </form>
  );
};

interface InvoiceCardProps {
  invoice: FreelanceInvoice;
  onCreatePaymentLink: (invoiceId: string) => void;
  onDownload: (invoiceId: string) => void;
  isLoading: boolean;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onCreatePaymentLink,
  onDownload,
  isLoading,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
              <p className="text-sm text-muted-foreground">{invoice.recipientName || "Unknown Client"}</p>
            </div>
          </div>
          <Badge className={statusColors[invoice.status as keyof typeof statusColors] || statusColors.draft}>
            {invoice.status}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="font-semibold">
              {invoice.currency || "USD"} {(invoice.total || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-sm">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-sm">{new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {invoice.status === "draft" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCreatePaymentLink(invoice.id)}
              disabled={isLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          )}
          {invoice.status === "sent" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCreatePaymentLink(invoice.id)}
              disabled={isLoading}
            >
              <Copy className="w-4 h-4 mr-2" />
              Create Link
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownload(invoice.id)}
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const UnifiedWalletInvoices: React.FC = () => {
  const { invoices, loading, createInvoice, createPaymentLink, loadInvoices, getTotalEarned, getPendingEarnings } =
    useFreelanceUnifiedWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreateInvoice = async (data: any) => {
    setIsCreating(true);
    try {
      const result = await createInvoice(
        data.clientId,
        data.projectId,
        data.projectTitle,
        data.amount,
        data.description
      );

      if (result) {
        setShowCreateDialog(false);
        toast.success("Invoice created successfully");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreatePaymentLink = async (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    setIsCreating(true);
    try {
      const link = await createPaymentLink(
        invoiceId,
        invoice.clientId || "",
        invoice.total || 0,
        invoice.notes || "Invoice Payment",
        "Freelance Project"
      );

      if (link) {
        // Copy to clipboard
        await navigator.clipboard.writeText(link);
        toast.success("Payment link copied to clipboard");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    // In a real implementation, this would generate and download a PDF
    toast.info("Invoice download feature coming soon");
  };

  const filteredInvoices =
    selectedStatus === "all" ? invoices : invoices.filter((inv) => inv.status === selectedStatus);

  const totalEarned = getTotalEarned();
  const pendingEarnings = getPendingEarnings();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold">${totalEarned.toLocaleString()}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">${pendingEarnings.toLocaleString()}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Invoices</h2>
          <p className="text-muted-foreground">Manage your project invoices</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <CreateInvoiceForm onSubmit={handleCreateInvoice} isLoading={isCreating} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No invoices found</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onCreatePaymentLink={handleCreatePaymentLink}
              onDownload={handleDownloadInvoice}
              isLoading={isCreating}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UnifiedWalletInvoices;

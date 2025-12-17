import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  Download,
  Send,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader,
  MoreHorizontal,
  FileText,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInvoices } from '@/hooks/useInvoices';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CreateInvoiceInput, InvoiceItem } from '@/services/invoiceService';
import { invoiceTemplateService } from '@/services/invoiceTemplateService';
import ProfessionalInvoiceTemplate from '@/components/invoice/ProfessionalInvoiceTemplate';

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    invoices,
    isLoading,
    isCreating,
    createInvoice,
    sendInvoice,
    markAsPaid,
    cancelInvoice,
    deleteInvoice,
    downloadInvoicePDF,
  } = useInvoices();
  const { toast } = useToast();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [customization, setCustomization] = useState<any>(null);
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [formData, setFormData] = useState<CreateInvoiceInput>({
    items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    recipientName: '',
    recipientEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStatus, setActiveStatus] = useState<string>('all');

  // Load customization on mount
  useEffect(() => {
    if (user?.id) {
      invoiceTemplateService.getInvoiceCustomization(user.id).then(setCustomization);
    }
  }, [user?.id]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    const item = newItems[index];

    if (field === 'unitPrice' || field === 'quantity') {
      const quantity = field === 'quantity' ? value : item.quantity;
      const unitPrice = field === 'unitPrice' ? value : item.unitPrice;
      item.amount = quantity * unitPrice;
    }

    (item as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.recipientName || !formData.items.length) {
      toast({
        title: 'Error',
        description: 'Please fill in recipient name and at least one item',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const invoice = await createInvoice(formData);
      if (invoice) {
        toast({
          title: 'Success',
          description: 'Invoice created successfully',
        });
        setShowCreateForm(false);
        setFormData({
          items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
          recipientName: '',
          recipientEmail: '',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const success = await sendInvoice(invoiceId);
      if (success) {
        toast({
          title: 'Success',
          description: 'Invoice sent successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invoice',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const success = await markAsPaid(invoiceId);
      if (success) {
        toast({
          title: 'Success',
          description: 'Invoice marked as paid',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark invoice as paid',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      await downloadInvoicePDF(invoiceId);
      toast({
        title: 'Success',
        description: 'Invoice opened for download/printing',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const success = await deleteInvoice(invoiceId);
      if (success) {
        toast({
          title: 'Success',
          description: 'Invoice deleted',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive',
      });
    }
  };

  const handleSaveCustomization = async (customizationData: any) => {
    if (!user?.id) return;
    try {
      const updated = await invoiceTemplateService.updateInvoiceCustomization(
        user.id,
        customizationData
      );
      setCustomization(updated);
      setShowCustomization(false);
      toast({
        title: 'Success',
        description: 'Invoice template customization saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save customization',
        variant: 'destructive',
      });
    }
  };

  const handlePreviewInvoice = (invoice: any) => {
    setPreviewInvoice({
      ...invoice,
      createdAt: invoice.created_at || new Date().toISOString(),
      invoiceNumber: invoice.invoice_number || invoice.invoiceNumber || 'PREVIEW-001',
      recipientName: invoice.recipient_name || invoice.recipientName || 'Sample Recipient',
      recipientEmail: invoice.recipient_email || invoice.recipientEmail,
      items: invoice.items || [],
      subtotal: invoice.subtotal || 0,
      tax: invoice.tax || 0,
      total: invoice.total || 0,
      dueDate: invoice.due_date || invoice.dueDate,
      status: invoice.status || 'draft',
    });
    setShowPreview(true);
  };

  const filteredInvoices = invoices.filter(inv =>
    activeStatus === 'all' ? true : inv.status === activeStatus
  );

  const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal + (formData.tax || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
              <p className="text-sm text-gray-600">Create and manage your invoices</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCustomization(!showCustomization)}
              variant="outline"
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Template
            </Button>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Preview Modal */}
        {showPreview && previewInvoice && customization && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 max-h-screen overflow-y-auto">
            <div className="bg-white rounded-lg max-w-3xl w-full my-8">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-bold">Invoice Preview</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreview(false)}
                >
                  ✕
                </Button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[70vh]">
                <ProfessionalInvoiceTemplate
                  invoice={previewInvoice}
                  customization={customization}
                />
              </div>
            </div>
          </div>
        )}

        {/* Customization Form */}
        {showCustomization && (
          <Card className="mb-6 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle>Customize Invoice Template</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveCustomization(customization);
                }}
                className="space-y-6"
              >
                {/* Company Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Company Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={customization?.companyName || ''}
                        onChange={(e) => setCustomization({ ...customization, companyName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax ID
                      </label>
                      <input
                        type="text"
                        value={customization?.taxId || ''}
                        onChange={(e) => setCustomization({ ...customization, taxId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={customization?.companyEmail || ''}
                        onChange={(e) => setCustomization({ ...customization, companyEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={customization?.companyPhone || ''}
                        onChange={(e) => setCustomization({ ...customization, companyPhone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={customization?.companyAddress || ''}
                        onChange={(e) => setCustomization({ ...customization, companyAddress: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={customization?.companyWebsite || ''}
                        onChange={(e) => setCustomization({ ...customization, companyWebsite: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Design Settings */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold text-gray-900">Design Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={customization?.primaryColor || '#2563eb'}
                          onChange={(e) => setCustomization({ ...customization, primaryColor: e.target.value })}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={customization?.primaryColor || '#2563eb'}
                          onChange={(e) => setCustomization({ ...customization, primaryColor: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invoice Prefix
                      </label>
                      <input
                        type="text"
                        value={customization?.invoicePrefix || 'INV'}
                        onChange={(e) => setCustomization({ ...customization, invoicePrefix: e.target.value })}
                        placeholder="e.g., INV"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Options */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold text-gray-900">Invoice Options</h4>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customization?.includeNotes || false}
                      onChange={(e) => setCustomization({ ...customization, includeNotes: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Include Notes Section</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customization?.includeTerms || false}
                      onChange={(e) => setCustomization({ ...customization, includeTerms: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Include Terms & Conditions</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Save Customization
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCustomization(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-6 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle>Create New Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateInvoice} className="space-y-6">
                {/* Recipient Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Bill To</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recipient Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.recipientName}
                        onChange={(e) =>
                          setFormData({ ...formData, recipientName: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.recipientEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, recipientEmail: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Items</h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddItem}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Item
                    </Button>
                  </div>

                  {formData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-2">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value))}
                        min="1"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value))}
                        step="0.01"
                        min="0"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <label className="text-gray-600">
                        Tax
                        <input
                          type="number"
                          value={formData.tax || 0}
                          onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) })}
                          step="0.01"
                          min="0"
                          className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </label>
                      <span className="font-semibold">${(formData.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Add any additional notes..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dueDate: e.target.value ? new Date(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || isCreating}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Invoice'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Invoices List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="h-8 w-8 text-purple-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invoices Yet</h3>
              <p className="text-gray-600 mb-6">Create your first invoice to get started.</p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Invoice
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            {/* Status Tabs */}
            <Tabs defaultValue="all" value={activeStatus} onValueChange={setActiveStatus} className="mb-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Invoices Grid */}
            <div className="space-y-4">
              {filteredInvoices.map(invoice => (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              invoice.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'draft'
                                ? 'bg-gray-100 text-gray-800'
                                : invoice.status === 'sent'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {invoice.recipientName || 'No recipient'}
                          {invoice.recipientEmail && ` (${invoice.recipientEmail})`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(invoice.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">${invoice.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{invoice.items.length} item(s)</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (customization) {
                            handlePreviewInvoice(invoice);
                          } else {
                            toast({
                              title: 'Setup Required',
                              description: 'Please configure your invoice template first',
                              variant: 'destructive',
                            });
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Preview & Download
                      </Button>
                      {invoice.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleSendInvoice(invoice.id)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      )}
                      {invoice.status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsPaid(invoice.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDelete(invoice.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;

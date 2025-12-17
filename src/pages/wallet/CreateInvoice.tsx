import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Loader,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoices } from '@/hooks/useInvoices';
import { useToast } from '@/components/ui/use-toast';
import { CreateInvoiceInput } from '@/services/invoiceService';

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { isCreating, createInvoice } = useInvoices();
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateInvoiceInput>({
    items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    recipientName: '',
    recipientEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        navigate('/app/wallet/invoices');
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
              onClick={() => navigate('/app/wallet/invoices')}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
              <p className="text-sm text-gray-600">Fill in the details below</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
        <Card className="border-purple-200 bg-white">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
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
                  onClick={() => navigate('/app/wallet/invoices')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateInvoice;

import React from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceCustomization } from '@/services/invoiceTemplateService';

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  dueDate?: string;
  recipientName: string;
  recipientEmail?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}

interface ProfessionalInvoiceTemplateProps {
  invoice: InvoiceData;
  customization: InvoiceCustomization;
  onDownload?: () => void;
  onPrint?: () => void;
}

const ProfessionalInvoiceTemplate: React.FC<ProfessionalInvoiceTemplateProps> = ({
  invoice,
  customization,
  onDownload,
  onPrint,
}) => {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Print Controls */}
      <div className="flex gap-2 mb-6 no-print">
        {onDownload && (
          <Button
            onClick={onDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        )}
        {onPrint && (
          <Button
            onClick={onPrint}
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        )}
      </div>

      {/* Invoice Document */}
      <div 
        className="bg-white p-8 shadow-lg rounded-lg print:shadow-none print:rounded-none"
        style={{ fontFamily: customization?.fontFamily || 'Segoe UI, sans-serif' }}
      >
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8 pb-8 border-b-2" style={{ borderColor: customization?.primaryColor || '#2563eb' }}>
          <div>
            {customization?.companyLogo ? (
              <img 
                src={customization.companyLogo} 
                alt="Company Logo"
                className="h-16 w-auto mb-3"
              />
            ) : (
              <FileText className="h-12 w-12" style={{ color: customization?.primaryColor || '#2563eb' }} />
            )}
            <h1 className="text-3xl font-bold" style={{ color: customization?.primaryColor || '#2563eb' }}>
              INVOICE
            </h1>
          </div>

          <div className="text-right space-y-2">
            <div className={`inline-block px-4 py-2 rounded-lg font-semibold text-sm ${statusColors[invoice.status]}`}>
              {invoice.status.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Invoice No:</strong> {invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> {new Date(invoice.createdAt).toLocaleDateString()}</p>
              {invoice.dueDate && (
                <p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Company & Recipient Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* From Section */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">From</h3>
            <div className="space-y-1 text-sm">
              <p className="text-lg font-bold text-gray-900">{customization?.companyName}</p>
              {customization?.companyAddress && (
                <p className="text-gray-600">{customization.companyAddress}</p>
              )}
              {customization?.companyPhone && (
                <p className="text-gray-600">Tel: {customization.companyPhone}</p>
              )}
              {customization?.companyEmail && (
                <p className="text-gray-600">Email: {customization.companyEmail}</p>
              )}
              {customization?.companyWebsite && (
                <p className="text-gray-600">Web: {customization.companyWebsite}</p>
              )}
              {customization?.taxId && (
                <p className="text-gray-600">Tax ID: {customization.taxId}</p>
              )}
            </div>
          </div>

          {/* Bill To Section */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Bill To</h3>
            <div className="space-y-1 text-sm">
              <p className="text-lg font-bold text-gray-900">{invoice.recipientName}</p>
              {invoice.recipientEmail && (
                <p className="text-gray-600">{invoice.recipientEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: customization?.primaryColor || '#2563eb', color: 'white' }}>
                <th className="text-left py-3 px-4 font-semibold">Description</th>
                <th className="text-right py-3 px-4 font-semibold w-24">Qty</th>
                <th className="text-right py-3 px-4 font-semibold w-32">Unit Price</th>
                <th className="text-right py-3 px-4 font-semibold w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{item.description}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">${item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-2 text-sm border-t-2 pt-4" style={{ borderColor: customization?.primaryColor || '#2563eb' }}>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900 font-semibold">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({customization?.currency || 'USD'}):</span>
                  <span className="text-gray-900 font-semibold">${invoice.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span 
                  className="text-2xl font-bold"
                  style={{ color: customization?.primaryColor || '#2563eb' }}
                >
                  ${invoice.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        {(customization?.includeNotes || customization?.includeTerms) && (
          <div className="space-y-6 pt-8 border-t border-gray-200">
            {customization?.includeNotes && (customization?.customNotes || invoice.notes) && (
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {customization?.customNotes || invoice.notes}
                </p>
              </div>
            )}
            {customization?.includeTerms && customization?.customTerms && (
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Terms & Conditions</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {customization.customTerms}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
          <p className="mb-1">Thank you for your business!</p>
          <p>Invoice created by {customization?.companyName}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfessionalInvoiceTemplate;

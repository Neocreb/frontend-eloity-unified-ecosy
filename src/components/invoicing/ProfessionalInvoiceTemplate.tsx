import React from 'react';
import { Download, Eye, Share2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceCustomization } from '@/services/invoiceTemplateService';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date;
  recipientName: string;
  recipientEmail?: string;
  recipientAddress?: string;
  items: InvoiceItem[];
  notes?: string;
  customization: InvoiceCustomization;
  subtotal: number;
  tax?: number;
  total: number;
  status?: 'draft' | 'sent' | 'paid' | 'overdue';
}

interface ProfessionalInvoiceTemplateProps {
  invoice: InvoiceData;
  onDownload?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  isPreview?: boolean;
}

const ProfessionalInvoiceTemplate: React.FC<ProfessionalInvoiceTemplateProps> = ({
  invoice,
  onDownload,
  onPrint,
  onShare,
  isPreview = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.customization.currency || 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className={`${isPreview ? '' : 'bg-white rounded-lg shadow-lg'} overflow-hidden`}>
      {/* Print Toolbar */}
      {!isPreview && (
        <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 p-4 flex gap-2 print:hidden">
          {onDownload && (
            <Button
              onClick={onDownload}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          )}
          {onPrint && (
            <Button
              onClick={onPrint}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          )}
          {onShare && (
            <Button
              onClick={onShare}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          )}
        </div>
      )}

      {/* Invoice Content */}
      <div className="p-8 md:p-12" style={{ fontFamily: invoice.customization.fontFamily || 'Inter, sans-serif' }}>
        {/* Header Section */}
        <div className="flex justify-between items-start mb-12 pb-8 border-b border-gray-200">
          <div>
            {/* Company Logo and Name */}
            <div className="flex items-center gap-3 mb-2">
              {invoice.customization.companyLogo && (
                <img
                  src={invoice.customization.companyLogo}
                  alt={invoice.customization.companyName}
                  className="h-10 w-10 object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold" style={{ color: invoice.customization.primaryColor }}>
                  {invoice.customization.companyName}
                </h1>
                <p className="text-sm text-gray-500">Professional Invoice</p>
              </div>
            </div>

            {/* Company Details */}
            <div className="text-sm text-gray-600 space-y-1 mt-4">
              {invoice.customization.companyEmail && (
                <p>✉️ {invoice.customization.companyEmail}</p>
              )}
              {invoice.customization.companyPhone && (
                <p>📞 {invoice.customization.companyPhone}</p>
              )}
              {invoice.customization.companyWebsite && (
                <p>🌐 {invoice.customization.companyWebsite}</p>
              )}
              {invoice.customization.companyAddress && (
                <p>📍 {invoice.customization.companyAddress}</p>
              )}
              {invoice.customization.taxId && (
                <p>Tax ID: {invoice.customization.taxId}</p>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="text-right space-y-2">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Invoice Number</span>
              <span className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</span>
            </div>

            {/* Status Badge */}
            {invoice.status && (
              <div className="mt-3">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: invoice.status === 'paid' ? '#dcfce7' : 
                                   invoice.status === 'sent' ? '#dbeafe' :
                                   invoice.status === 'overdue' ? '#fee2e2' : '#f3f4f6',
                    color: invoice.status === 'paid' ? '#166534' :
                          invoice.status === 'sent' ? '#0c4a6e' :
                          invoice.status === 'overdue' ? '#991b1b' : '#374151',
                  }}
                >
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Billing Details */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Bill To
            </p>
            <p className="text-lg font-semibold text-gray-900">{invoice.recipientName}</p>
            {invoice.recipientEmail && (
              <p className="text-sm text-gray-600">{invoice.recipientEmail}</p>
            )}
            {invoice.recipientAddress && (
              <p className="text-sm text-gray-600">{invoice.recipientAddress}</p>
            )}
          </div>

          {/* Invoice Dates */}
          <div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Issue Date
                </p>
                <p className="text-sm text-gray-900">{formatDate(invoice.issueDate)}</p>
              </div>

              {invoice.dueDate && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Due Date
                  </p>
                  <p className="text-sm text-gray-900">{formatDate(invoice.dueDate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr
                className="border-b-2"
                style={{ borderColor: invoice.customization.primaryColor }}
              >
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Qty</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Unit Price</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-4 text-gray-900">{item.description}</td>
                  <td className="text-center py-4 px-4 text-gray-600">{item.quantity}</td>
                  <td className="text-right py-4 px-4 text-gray-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="text-right py-4 px-4 font-semibold text-gray-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-12">
          <div className="w-full md:w-72 space-y-2">
            {/* Subtotal */}
            <div className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>

            {/* Tax */}
            {invoice.tax && invoice.tax > 0 && (
              <div className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded">
                <span className="text-gray-600">Tax:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(invoice.tax)}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center py-3 px-4 rounded"
              style={{ backgroundColor: invoice.customization.primaryColor + '15' }}>
              <span
                className="font-bold text-lg"
                style={{ color: invoice.customization.primaryColor }}
              >
                Total:
              </span>
              <span
                className="font-bold text-lg"
                style={{ color: invoice.customization.primaryColor }}
              >
                {formatCurrency(invoice.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        {(invoice.customization.includeNotes || invoice.customization.includeTerms) && (
          <div className="space-y-6 pt-8 border-t border-gray-200">
            {invoice.customization.includeNotes && invoice.notes && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Notes
                </p>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}

            {invoice.customization.includeNotes && invoice.customization.customNotes && (
              <div>
                <p className="text-sm text-gray-600">{invoice.customization.customNotes}</p>
              </div>
            )}

            {invoice.customization.includeTerms && invoice.customization.customTerms && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Terms & Conditions
                </p>
                <p className="text-sm text-gray-600">{invoice.customization.customTerms}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>Thank you for your business!</p>
          <p className="mt-2">
            Generated by Eloity Platform • {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden {
            display: none;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfessionalInvoiceTemplate;

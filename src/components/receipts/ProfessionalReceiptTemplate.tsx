import React from 'react';
import { Download, Printer, Mail } from 'lucide-react';
import QRCode from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { ReceiptCustomization } from '@/services/invoiceTemplateService';

export interface ReceiptLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ReceiptData {
  id: string;
  receiptNumber: string;
  transactionDate: Date;
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: string;
  items: ReceiptLineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  customization: ReceiptCustomization;
  transactionRef?: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

interface ProfessionalReceiptTemplateProps {
  receipt: ReceiptData;
  onDownload?: () => void;
  onPrint?: () => void;
  onEmail?: () => void;
  isPreview?: boolean;
}

const ProfessionalReceiptTemplate: React.FC<ProfessionalReceiptTemplateProps> = ({
  receipt,
  onDownload,
  onPrint,
  onEmail,
  isPreview = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: receipt.customization.currency || 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#dcfce7', text: '#166534' };
      case 'pending':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#991b1b' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const statusColor = getStatusColor(receipt.status);
  const qrValue = receipt.transactionRef || receipt.receiptNumber;

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
          {onEmail && (
            <Button
              onClick={onEmail}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          )}
        </div>
      )}

      {/* Receipt Content */}
      <div className="p-8" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: receipt.customization.primaryColor }}>
          {receipt.customization.companyLogo && (
            <img
              src={receipt.customization.companyLogo}
              alt={receipt.customization.companyName}
              className="h-12 w-12 mx-auto mb-3 object-contain"
            />
          )}
          <h1
            className="text-2xl font-bold"
            style={{ color: receipt.customization.primaryColor }}
          >
            {receipt.customization.companyName}
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Transaction Receipt</p>
        </div>

        {/* Company Contact Info */}
        <div className="text-center text-sm text-gray-600 mb-8 space-y-1">
          {receipt.customization.companyAddress && (
            <p>{receipt.customization.companyAddress}</p>
          )}
          {receipt.customization.companyEmail && (
            <p>{receipt.customization.companyEmail}</p>
          )}
          {receipt.customization.companyPhone && (
            <p>{receipt.customization.companyPhone}</p>
          )}
        </div>

        {/* Receipt Details Header */}
        <div className="space-y-3 mb-8 p-4 bg-gray-50 rounded">
          <div className="flex justify-between">
            <span className="text-xs text-gray-600 uppercase font-semibold">Receipt #</span>
            <span className="font-bold text-gray-900">{receipt.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-600 uppercase font-semibold">Date</span>
            <span className="text-sm text-gray-900">{formatDate(receipt.transactionDate)}</span>
          </div>

          {receipt.status && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-600 uppercase font-semibold">Status</span>
              <span
                className="inline-block px-3 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: statusColor.bg,
                  color: statusColor.text,
                }}
              >
                {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
              </span>
            </div>
          )}
        </div>

        {/* Customer Info */}
        {(receipt.customerName || receipt.customerEmail) && (
          <div className="mb-8 pb-6 border-b border-gray-200">
            <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Customer</p>
            {receipt.customerName && (
              <p className="text-sm font-medium text-gray-900">{receipt.customerName}</p>
            )}
            {receipt.customerEmail && (
              <p className="text-sm text-gray-600">{receipt.customerEmail}</p>
            )}
          </div>
        )}

        {/* Line Items */}
        <div className="mb-6 space-y-3">
          {receipt.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.description}</p>
                <p className="text-xs text-gray-500">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <p className="font-semibold text-gray-900 ml-4">
                {formatCurrency(item.amount)}
              </p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-gray-300 mb-6" />

        {/* Totals */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(receipt.subtotal)}
            </span>
          </div>

          {receipt.tax && receipt.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(receipt.tax)}
              </span>
            </div>
          )}

          {/* Total */}
          <div
            className="flex justify-between py-3 px-4 rounded font-bold text-lg"
            style={{
              backgroundColor: receipt.customization.primaryColor + '20',
              color: receipt.customization.primaryColor,
            }}
          >
            <span>Total</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>
        </div>

        {/* Payment Method */}
        {receipt.paymentMethod && (
          <div className="text-center text-sm text-gray-600 mb-6 p-3 bg-blue-50 rounded">
            <p className="text-xs uppercase text-gray-500 font-semibold mb-1">Payment Method</p>
            <p className="font-medium text-gray-900">{receipt.paymentMethod}</p>
          </div>
        )}

        {/* Transaction Reference */}
        {receipt.transactionRef && (
          <div className="text-center text-xs text-gray-500 mb-6 font-mono p-2 bg-gray-50 rounded">
            <p className="text-gray-600 mb-1">Transaction Reference</p>
            <p className="text-gray-700 font-semibold">{receipt.transactionRef}</p>
          </div>
        )}

        {/* QR Code */}
        {receipt.customization.includeQRCode && (
          <div className="flex justify-center mb-6">
            <div className="p-2 border-2 border-gray-200 rounded">
              <QRCode
                value={qrValue}
                size={120}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
        )}

        {/* Custom Footer */}
        {receipt.customization.customFooter && (
          <div className="text-center text-xs text-gray-600 mb-6 p-4 border-t border-gray-200">
            {receipt.customization.customFooter}
          </div>
        )}

        {/* Standard Footer */}
        <div className="text-center text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-200">
          <p>Thank you for your business!</p>
          <p>Powered by Eloity Platform</p>
          <p className="mt-2 text-gray-400">
            Keep this receipt for your records
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
            margin: 0;
            padding: 0;
          }
          .max-w-3xl {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfessionalReceiptTemplate;

import React from 'react';
import { Download, Printer, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReceiptCustomization } from '@/services/invoiceTemplateService';

export interface ReceiptData {
  id: string;
  receiptNumber: string;
  timestamp: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  description?: string;
  transactionId?: string;
  paidBy?: string;
  status: 'completed' | 'pending' | 'failed';
}

interface ProfessionalReceiptTemplateProps {
  receipt: ReceiptData;
  customization: ReceiptCustomization;
  qrCodeUrl?: string;
  onDownload?: () => void;
  onPrint?: () => void;
}

const ProfessionalReceiptTemplate: React.FC<ProfessionalReceiptTemplateProps> = ({
  receipt,
  customization,
  qrCodeUrl,
  onDownload,
  onPrint,
}) => {
  const statusColors: Record<string, string> = {
    completed: 'text-green-600',
    pending: 'text-yellow-600',
    failed: 'text-red-600',
  };

  const statusBgColors: Record<string, string> = {
    completed: 'bg-green-50 border-green-200',
    pending: 'bg-yellow-50 border-yellow-200',
    failed: 'bg-red-50 border-red-200',
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Print Controls */}
      <div className="flex gap-2 mb-6 no-print">
        {onDownload && (
          <Button
            onClick={onDownload}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
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

      {/* Receipt Document */}
      <div 
        className="bg-white p-8 shadow-lg rounded-lg print:shadow-none print:rounded-none max-w-md mx-auto"
        style={{ 
          borderTop: `4px solid ${customization?.primaryColor || '#10b981'}`,
        }}
      >
        {/* Header */}
        <div className="text-center mb-6 pb-6 border-b-2" style={{ borderColor: customization?.primaryColor || '#10b981' }}>
          {customization?.companyLogo ? (
            <img 
              src={customization.companyLogo} 
              alt="Company Logo"
              className="h-12 w-auto mx-auto mb-3"
            />
          ) : null}
          <h1 className="text-2xl font-bold" style={{ color: customization?.primaryColor || '#10b981' }}>
            RECEIPT
          </h1>
          <p className="text-sm text-gray-600 mt-2">{customization?.companyName}</p>
          {customization?.companyPhone && (
            <p className="text-xs text-gray-500">Tel: {customization.companyPhone}</p>
          )}
          {customization?.companyEmail && (
            <p className="text-xs text-gray-500">Email: {customization.companyEmail}</p>
          )}
        </div>

        {/* Status Badge */}
        <div className={`text-center mb-6 p-3 rounded border ${statusBgColors[receipt.status]}`}>
          <p className={`font-bold uppercase text-sm ${statusColors[receipt.status]}`}>
            ✓ {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
          </p>
        </div>

        {/* Receipt Details */}
        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Receipt No.</span>
            <span className="font-mono font-bold text-gray-900">{receipt.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date & Time</span>
            <span className="font-semibold text-gray-900">
              {new Date(receipt.timestamp).toLocaleString()}
            </span>
          </div>
          {receipt.transactionId && (
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID</span>
              <span className="font-mono text-xs text-gray-600 break-all">{receipt.transactionId}</span>
            </div>
          )}
          {receipt.paymentMethod && (
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-semibold text-gray-900">{receipt.paymentMethod}</span>
            </div>
          )}
          {receipt.paidBy && (
            <div className="flex justify-between">
              <span className="text-gray-600">Paid By</span>
              <span className="font-semibold text-gray-900">{receipt.paidBy}</span>
            </div>
          )}
        </div>

        {/* Amount Section */}
        <div className="bg-gradient-to-r p-6 rounded-lg mb-6 text-white text-center" style={{
          backgroundImage: `linear-gradient(135deg, ${customization?.primaryColor || '#10b981'} 0%, ${customization?.primaryColor || '#10b981'}dd 100%)`,
        }}>
          {receipt.description && (
            <p className="text-sm opacity-90 mb-2">{receipt.description}</p>
          )}
          <p className="text-4xl font-bold">
            {customization?.currency || 'USD'} {receipt.amount.toFixed(2)}
          </p>
        </div>

        {/* Additional Info */}
        <div className="space-y-4 mb-6">
          {customization?.companyAddress && (
            <div className="text-center text-xs text-gray-600">
              <p>{customization.companyAddress}</p>
            </div>
          )}
          
          {customization?.includeQRCode && qrCodeUrl && (
            <div className="flex justify-center py-4 border-t border-gray-200">
              <div className="text-center">
                <img 
                  src={qrCodeUrl} 
                  alt="Receipt QR Code"
                  className="h-24 w-24 border-2 border-gray-200 p-2"
                />
                <p className="text-xs text-gray-500 mt-2">Scan for verification</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pt-6 border-t border-gray-200 text-xs text-gray-500">
          {customization?.customFooter && (
            <p className="whitespace-pre-wrap text-gray-600">{customization.customFooter}</p>
          )}
          <p className="mt-3">Thank you for your transaction!</p>
          <p className="text-gray-400">Powered by Eloity Platform</p>
          <p className="text-gray-400">© {new Date().getFullYear()} {customization?.companyName}</p>
        </div>

        {/* Signature Line (if enabled) */}
        {customization?.includeSignature && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex justify-between gap-8">
              <div>
                <div className="h-12 border-b border-gray-300"></div>
                <p className="text-xs text-gray-600 mt-2">Authorized By</p>
              </div>
              <div>
                <div className="h-12 border-b border-gray-300"></div>
                <p className="text-xs text-gray-600 mt-2">Customer</p>
              </div>
            </div>
          </div>
        )}
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
          * {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfessionalReceiptTemplate;

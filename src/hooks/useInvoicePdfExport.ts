import { useState } from 'react';
import { freelancePdfExportService } from '@/services/freelancePdfExportService';
import type { InvoiceForPdf } from '@/services/freelancePdfExportService';
import { toast } from 'react-hot-toast';

export const useInvoicePdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Download a single invoice as PDF
   */
  const downloadInvoicePdf = async (invoice: InvoiceForPdf) => {
    try {
      setIsExporting(true);
      setError(null);

      await freelancePdfExportService.generateInvoicePdfDownload(invoice);
      toast.success(`Invoice ${invoice.invoiceNumber} downloaded successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(errorMessage);
      toast.error(`Failed to download invoice: ${errorMessage}`);
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Download multiple invoices as a single PDF
   */
  const downloadBatchPdf = async (invoices: InvoiceForPdf[], title?: string) => {
    try {
      setIsExporting(true);
      setError(null);

      if (invoices.length === 0) {
        setError('No invoices to export');
        toast.error('No invoices selected');
        return;
      }

      await freelancePdfExportService.generateInvoicesBatchPdf(invoices, title);
      toast.success(`${invoices.length} invoices exported successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF batch';
      setError(errorMessage);
      toast.error(`Failed to export invoices: ${errorMessage}`);
      console.error('Batch PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    error,
    downloadInvoicePdf,
    downloadBatchPdf,
  };
};

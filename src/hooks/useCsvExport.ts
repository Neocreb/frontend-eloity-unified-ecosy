import { useState } from 'react';
import { freelanceCsvExportService } from '@/services/freelanceCsvExportService';
import type { CsvExportOptions } from '@/services/freelanceCsvExportService';
import { toast } from 'react-hot-toast';

export const useCsvExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Export invoices to CSV
   */
  const exportInvoices = async (
    invoices: Array<Record<string, any>>,
    options?: CsvExportOptions
  ) => {
    try {
      setIsExporting(true);
      setError(null);

      if (!invoices || invoices.length === 0) {
        setError('No invoices to export');
        toast.error('No invoices to export');
        return;
      }

      freelanceCsvExportService.exportInvoicesToCSV(invoices, options);
      toast.success(`${invoices.length} invoices exported to CSV`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export invoices';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export withdrawals to CSV
   */
  const exportWithdrawals = async (
    withdrawals: Array<Record<string, any>>,
    options?: CsvExportOptions
  ) => {
    try {
      setIsExporting(true);
      setError(null);

      if (!withdrawals || withdrawals.length === 0) {
        setError('No withdrawals to export');
        toast.error('No withdrawals to export');
        return;
      }

      freelanceCsvExportService.exportWithdrawalsToCSV(withdrawals, options);
      toast.success(`${withdrawals.length} withdrawals exported to CSV`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export withdrawals';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export transactions to CSV
   */
  const exportTransactions = async (
    transactions: Array<Record<string, any>>,
    options?: CsvExportOptions
  ) => {
    try {
      setIsExporting(true);
      setError(null);

      if (!transactions || transactions.length === 0) {
        setError('No transactions to export');
        toast.error('No transactions to export');
        return;
      }

      freelanceCsvExportService.exportTransactionsToCSV(transactions, options);
      toast.success(`${transactions.length} transactions exported to CSV`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export transactions';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export combined financial history
   */
  const exportFinancialHistory = async (
    invoices: Array<Record<string, any>>,
    withdrawals: Array<Record<string, any>>,
    options?: CsvExportOptions
  ) => {
    try {
      setIsExporting(true);
      setError(null);

      const totalItems = (invoices?.length || 0) + (withdrawals?.length || 0);
      if (totalItems === 0) {
        setError('No data to export');
        toast.error('No data to export');
        return;
      }

      freelanceCsvExportService.exportFinancialHistoryToCSV(invoices || [], withdrawals || [], options);
      toast.success(`Financial history (${totalItems} items) exported to CSV`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export financial history';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export with summary statistics
   */
  const exportWithSummary = async (
    data: Array<Record<string, any>>,
    stats: Record<string, any>,
    title: string,
    options?: CsvExportOptions
  ) => {
    try {
      setIsExporting(true);
      setError(null);

      if (!data || data.length === 0) {
        setError('No data to export');
        toast.error('No data to export');
        return;
      }

      freelanceCsvExportService.exportWithSummary(data, stats, title, options);
      toast.success('Report exported with summary statistics');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export report';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Get CSV string without downloading
   */
  const getCSVString = (
    data: Array<Record<string, any>>,
    options?: CsvExportOptions
  ): string | null => {
    try {
      setError(null);
      return freelanceCsvExportService.getCSVString(data, options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate CSV';
      setError(errorMessage);
      console.error('CSV generation error:', err);
      return null;
    }
  };

  /**
   * Validate CSV data
   */
  const validateData = (data: Array<Record<string, any>>) => {
    return freelanceCsvExportService.validateCsvData(data);
  };

  return {
    isExporting,
    error,
    exportInvoices,
    exportWithdrawals,
    exportTransactions,
    exportFinancialHistory,
    exportWithSummary,
    getCSVString,
    validateData,
  };
};

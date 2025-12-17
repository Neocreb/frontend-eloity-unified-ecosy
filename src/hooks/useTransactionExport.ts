import { useState, useCallback } from 'react';
import { Transaction } from '@/types/wallet';
import { transactionExportService, ExportOptions } from '@/services/transactionExportService';

interface UseTransactionExportReturn {
  isExporting: boolean;
  error: string | null;
  exportCSV: (transactions: Transaction[], filename?: string) => void;
  exportJSON: (transactions: Transaction[], filename?: string) => void;
  exportPDF: (transactions: Transaction[], filename?: string) => Promise<void>;
  filterByDateRange: (transactions: Transaction[], startDate: Date, endDate: Date) => Transaction[];
  getSummaryStats: (transactions: Transaction[]) => any;
}

export const useTransactionExport = (): UseTransactionExportReturn => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportCSV = useCallback((transactions: Transaction[], filename?: string) => {
    try {
      setError(null);
      setIsExporting(true);
      transactionExportService.exportAsCSV(transactions, filename);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export CSV';
      setError(message);
      console.error('Error exporting CSV:', err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportJSON = useCallback((transactions: Transaction[], filename?: string) => {
    try {
      setError(null);
      setIsExporting(true);
      transactionExportService.exportAsJSON(transactions, filename);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export JSON';
      setError(message);
      console.error('Error exporting JSON:', err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportPDF = useCallback(async (transactions: Transaction[], filename?: string) => {
    try {
      setError(null);
      setIsExporting(true);
      await transactionExportService.exportAsPDF(transactions, filename);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export PDF';
      setError(message);
      console.error('Error exporting PDF:', err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const filterByDateRange = useCallback(
    (transactions: Transaction[], startDate: Date, endDate: Date) => {
      return transactionExportService.filterByDateRange(transactions, startDate, endDate);
    },
    []
  );

  const getSummaryStats = useCallback((transactions: Transaction[]) => {
    return transactionExportService.getSummaryStats(transactions);
  }, []);

  return {
    isExporting,
    error,
    exportCSV,
    exportJSON,
    exportPDF,
    filterByDateRange,
    getSummaryStats,
  };
};

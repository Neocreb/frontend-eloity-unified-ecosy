import { useState, useMemo } from 'react';
import { freelanceFilterService } from '@/services/freelanceFilterService';
import type { FilterCriteria, FilterResult, Invoice, Withdrawal } from '@/services/freelanceFilterService';

export const useAdvancedFilter = () => {
  const [criteria, setCriteria] = useState<FilterCriteria>({
    pageSize: 10,
    pageNumber: 1,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  /**
   * Filter invoices
   */
  const filterInvoices = (invoices: Invoice[]): FilterResult<Invoice> => {
    return freelanceFilterService.filterInvoices(invoices, criteria);
  };

  /**
   * Filter withdrawals
   */
  const filterWithdrawals = (
    withdrawals: Withdrawal[],
    criteriaOverride?: Omit<FilterCriteria, 'clientName' | 'projectTitle'>
  ): FilterResult<Withdrawal> => {
    const finalCriteria = criteriaOverride || criteria;
    return freelanceFilterService.filterWithdrawals(
      withdrawals,
      finalCriteria as any
    );
  };

  /**
   * Update filter criteria
   */
  const updateCriteria = (updates: Partial<FilterCriteria>) => {
    setCriteria(prev => ({
      ...prev,
      ...updates,
      pageNumber: 1, // Reset to first page on filter change
    }));
  };

  /**
   * Reset all filters
   */
  const resetFilters = () => {
    setCriteria({
      pageSize: 10,
      pageNumber: 1,
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  /**
   * Set search term
   */
  const setSearchTerm = (term: string) => {
    updateCriteria({ searchTerm: term });
  };

  /**
   * Set status filter
   */
  const setStatusFilter = (statuses: string[]) => {
    updateCriteria({ status: statuses.length > 0 ? statuses : undefined });
  };

  /**
   * Set date range filter
   */
  const setDateRange = (dateFrom?: string, dateTo?: string) => {
    updateCriteria({ dateFrom, dateTo });
  };

  /**
   * Set amount range filter
   */
  const setAmountRange = (min?: number, max?: number) => {
    updateCriteria({ amountMin: min, amountMax: max });
  };

  /**
   * Set sorting
   */
  const setSorting = (sortBy: 'date' | 'amount' | 'status' | 'client', sortOrder?: 'asc' | 'desc') => {
    updateCriteria({
      sortBy,
      sortOrder: sortOrder || (criteria.sortOrder === 'asc' ? 'desc' : 'asc'),
    });
  };

  /**
   * Go to page
   */
  const goToPage = (pageNumber: number) => {
    updateCriteria({ pageNumber: Math.max(1, pageNumber) });
  };

  /**
   * Set page size
   */
  const setPageSize = (pageSize: number) => {
    updateCriteria({ pageSize: Math.max(1, pageSize) });
  };

  return {
    criteria,
    filterInvoices,
    filterWithdrawals,
    updateCriteria,
    resetFilters,
    setSearchTerm,
    setStatusFilter,
    setDateRange,
    setAmountRange,
    setSorting,
    goToPage,
    setPageSize,
  };
};

/**
 * Hook to get statistics from filtered data
 */
export const useFilterStatistics = (invoices: Invoice[], withdrawals: Withdrawal[]) => {
  const invoiceStats = useMemo(() => {
    return freelanceFilterService.getInvoiceStats(invoices);
  }, [invoices]);

  const withdrawalStats = useMemo(() => {
    return freelanceFilterService.getWithdrawalStats(withdrawals);
  }, [withdrawals]);

  return {
    invoiceStats,
    withdrawalStats,
  };
};

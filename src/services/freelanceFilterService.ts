/**
 * FreelanceFilterService
 * 
 * Advanced filtering and search functionality for freelance invoices and withdrawals
 * Supports multiple filter criteria and fuzzy search
 */

export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectTitle: string;
  clientName: string;
  amount: number;
  currency: string;
  status: string;
  issueDate: string;
  dueDate: string;
  description?: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  withdrawalMethod: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  withdrawalDetails?: Record<string, any>;
}

export interface FilterCriteria {
  searchTerm?: string;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  currency?: string;
  clientName?: string;
  projectTitle?: string;
  sortBy?: 'date' | 'amount' | 'status' | 'client';
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
  pageNumber?: number;
}

export interface FilterResult<T> {
  items: T[];
  total: number;
  filteredCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

export class FreelanceFilterService {
  /**
   * Fuzzy search - matches partial strings
   */
  private static fuzzyMatch(searchTerm: string, text: string): boolean {
    const searchLower = searchTerm.toLowerCase();
    const textLower = text.toLowerCase();

    if (textLower.includes(searchLower)) {
      return true;
    }

    // Fuzzy character matching
    let searchIdx = 0;
    for (let i = 0; i < textLower.length && searchIdx < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIdx]) {
        searchIdx++;
      }
    }

    return searchIdx === searchLower.length;
  }

  /**
   * Filter invoices based on criteria
   */
  static filterInvoices(invoices: Invoice[], criteria: FilterCriteria): FilterResult<Invoice> {
    let filtered = [...invoices];

    // Search term filter
    if (criteria.searchTerm) {
      const searchTerm = criteria.searchTerm.toLowerCase();
      filtered = filtered.filter(inv =>
        this.fuzzyMatch(criteria.searchTerm!, inv.invoiceNumber) ||
        this.fuzzyMatch(criteria.searchTerm!, inv.projectTitle) ||
        this.fuzzyMatch(criteria.searchTerm!, inv.clientName) ||
        this.fuzzyMatch(criteria.searchTerm!, inv.description || '')
      );
    }

    // Status filter
    if (criteria.status && criteria.status.length > 0) {
      filtered = filtered.filter(inv => criteria.status!.includes(inv.status));
    }

    // Date range filter
    if (criteria.dateFrom) {
      const fromDate = new Date(criteria.dateFrom).getTime();
      filtered = filtered.filter(inv => new Date(inv.issueDate).getTime() >= fromDate);
    }

    if (criteria.dateTo) {
      const toDate = new Date(criteria.dateTo).getTime();
      filtered = filtered.filter(inv => new Date(inv.issueDate).getTime() <= toDate);
    }

    // Amount range filter
    if (criteria.amountMin !== undefined) {
      filtered = filtered.filter(inv => inv.amount >= criteria.amountMin!);
    }

    if (criteria.amountMax !== undefined) {
      filtered = filtered.filter(inv => inv.amount <= criteria.amountMax!);
    }

    // Currency filter
    if (criteria.currency) {
      filtered = filtered.filter(inv => inv.currency === criteria.currency);
    }

    // Client name filter
    if (criteria.clientName) {
      filtered = filtered.filter(inv =>
        this.fuzzyMatch(criteria.clientName!, inv.clientName)
      );
    }

    // Project title filter
    if (criteria.projectTitle) {
      filtered = filtered.filter(inv =>
        this.fuzzyMatch(criteria.projectTitle!, inv.projectTitle)
      );
    }

    // Sorting
    const sortBy = criteria.sortBy || 'date';
    const sortOrder = criteria.sortOrder === 'asc' ? 1 : -1;

    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'client':
          aVal = a.clientName;
          bVal = b.clientName;
          break;
        case 'date':
        default:
          aVal = new Date(a.issueDate).getTime();
          bVal = new Date(b.issueDate).getTime();
          break;
      }

      if (aVal < bVal) return -1 * sortOrder;
      if (aVal > bVal) return 1 * sortOrder;
      return 0;
    });

    // Pagination
    const pageSize = Math.max(1, criteria.pageSize || 10);
    const pageNumber = Math.max(1, criteria.pageNumber || 1);
    const startIdx = (pageNumber - 1) * pageSize;
    const endIdx = startIdx + pageSize;

    const paginated = filtered.slice(startIdx, endIdx);
    const pageCount = Math.ceil(filtered.length / pageSize);

    return {
      items: paginated,
      total: invoices.length,
      filteredCount: filtered.length,
      pageCount,
      currentPage: pageNumber,
      pageSize,
    };
  }

  /**
   * Filter withdrawals based on criteria
   */
  static filterWithdrawals(
    withdrawals: Withdrawal[],
    criteria: Omit<FilterCriteria, 'clientName' | 'projectTitle' | 'invoiceNumber'> & {
      withdrawalMethod?: string;
    }
  ): FilterResult<Withdrawal> {
    let filtered = [...withdrawals];

    // Search term filter
    if (criteria.searchTerm) {
      const searchTerm = criteria.searchTerm.toLowerCase();
      filtered = filtered.filter(w =>
        w.id.toLowerCase().includes(searchTerm) ||
        w.withdrawalMethod.toLowerCase().includes(searchTerm) ||
        w.status.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (criteria.status && criteria.status.length > 0) {
      filtered = filtered.filter(w => criteria.status!.includes(w.status));
    }

    // Date range filter
    if (criteria.dateFrom) {
      const fromDate = new Date(criteria.dateFrom).getTime();
      filtered = filtered.filter(w => new Date(w.createdAt).getTime() >= fromDate);
    }

    if (criteria.dateTo) {
      const toDate = new Date(criteria.dateTo).getTime();
      filtered = filtered.filter(w => new Date(w.createdAt).getTime() <= toDate);
    }

    // Amount range filter
    if (criteria.amountMin !== undefined) {
      filtered = filtered.filter(w => w.amount >= criteria.amountMin!);
    }

    if (criteria.amountMax !== undefined) {
      filtered = filtered.filter(w => w.amount <= criteria.amountMax!);
    }

    // Currency filter
    if (criteria.currency) {
      filtered = filtered.filter(w => w.currency === criteria.currency);
    }

    // Withdrawal method filter
    if (criteria.withdrawalMethod) {
      filtered = filtered.filter(w => w.withdrawalMethod === criteria.withdrawalMethod);
    }

    // Sorting
    const sortBy = criteria.sortBy || 'date';
    const sortOrder = criteria.sortOrder === 'asc' ? 1 : -1;

    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'date':
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }

      if (aVal < bVal) return -1 * sortOrder;
      if (aVal > bVal) return 1 * sortOrder;
      return 0;
    });

    // Pagination
    const pageSize = Math.max(1, criteria.pageSize || 10);
    const pageNumber = Math.max(1, criteria.pageNumber || 1);
    const startIdx = (pageNumber - 1) * pageSize;
    const endIdx = startIdx + pageSize;

    const paginated = filtered.slice(startIdx, endIdx);
    const pageCount = Math.ceil(filtered.length / pageSize);

    return {
      items: paginated,
      total: withdrawals.length,
      filteredCount: filtered.length,
      pageCount,
      currentPage: pageNumber,
      pageSize,
    };
  }

  /**
   * Get invoice statistics based on filtered results
   */
  static getInvoiceStats(invoices: Invoice[]) {
    if (invoices.length === 0) {
      return {
        totalAmount: 0,
        averageAmount: 0,
        highestAmount: 0,
        lowestAmount: 0,
        byStatus: {} as Record<string, { count: number; total: number }>,
        byCurrency: {} as Record<string, { count: number; total: number }>,
      };
    }

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const averageAmount = totalAmount / invoices.length;
    const amounts = invoices.map(inv => inv.amount);
    const highestAmount = Math.max(...amounts);
    const lowestAmount = Math.min(...amounts);

    // Group by status
    const byStatus: Record<string, { count: number; total: number }> = {};
    invoices.forEach(inv => {
      if (!byStatus[inv.status]) {
        byStatus[inv.status] = { count: 0, total: 0 };
      }
      byStatus[inv.status].count++;
      byStatus[inv.status].total += inv.amount;
    });

    // Group by currency
    const byCurrency: Record<string, { count: number; total: number }> = {};
    invoices.forEach(inv => {
      if (!byCurrency[inv.currency]) {
        byCurrency[inv.currency] = { count: 0, total: 0 };
      }
      byCurrency[inv.currency].count++;
      byCurrency[inv.currency].total += inv.amount;
    });

    return {
      totalAmount,
      averageAmount,
      highestAmount,
      lowestAmount,
      byStatus,
      byCurrency,
    };
  }

  /**
   * Get withdrawal statistics
   */
  static getWithdrawalStats(withdrawals: Withdrawal[]) {
    if (withdrawals.length === 0) {
      return {
        totalAmount: 0,
        averageAmount: 0,
        highestAmount: 0,
        lowestAmount: 0,
        byStatus: {} as Record<string, { count: number; total: number }>,
        byMethod: {} as Record<string, { count: number; total: number }>,
        byCurrency: {} as Record<string, { count: number; total: number }>,
      };
    }

    const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const averageAmount = totalAmount / withdrawals.length;
    const amounts = withdrawals.map(w => w.amount);
    const highestAmount = Math.max(...amounts);
    const lowestAmount = Math.min(...amounts);

    // Group by status
    const byStatus: Record<string, { count: number; total: number }> = {};
    withdrawals.forEach(w => {
      if (!byStatus[w.status]) {
        byStatus[w.status] = { count: 0, total: 0 };
      }
      byStatus[w.status].count++;
      byStatus[w.status].total += w.amount;
    });

    // Group by method
    const byMethod: Record<string, { count: number; total: number }> = {};
    withdrawals.forEach(w => {
      if (!byMethod[w.withdrawalMethod]) {
        byMethod[w.withdrawalMethod] = { count: 0, total: 0 };
      }
      byMethod[w.withdrawalMethod].count++;
      byMethod[w.withdrawalMethod].total += w.amount;
    });

    // Group by currency
    const byCurrency: Record<string, { count: number; total: number }> = {};
    withdrawals.forEach(w => {
      if (!byCurrency[w.currency]) {
        byCurrency[w.currency] = { count: 0, total: 0 };
      }
      byCurrency[w.currency].count++;
      byCurrency[w.currency].total += w.amount;
    });

    return {
      totalAmount,
      averageAmount,
      highestAmount,
      lowestAmount,
      byStatus,
      byMethod,
      byCurrency,
    };
  }

  /**
   * Export filtered data to array format (for CSV/Excel)
   */
  static exportInvoicesToArray(invoices: Invoice[]): Array<Record<string, any>> {
    return invoices.map(inv => ({
      'Invoice Number': inv.invoiceNumber,
      'Project': inv.projectTitle,
      'Client': inv.clientName,
      'Amount': inv.amount,
      'Currency': inv.currency,
      'Status': inv.status,
      'Issue Date': new Date(inv.issueDate).toLocaleDateString(),
      'Due Date': new Date(inv.dueDate).toLocaleDateString(),
      'Description': inv.description || '',
    }));
  }

  /**
   * Export filtered withdrawal data to array format
   */
  static exportWithdrawalsToArray(withdrawals: Withdrawal[]): Array<Record<string, any>> {
    return withdrawals.map(w => ({
      'ID': w.id,
      'Amount': w.amount,
      'Currency': w.currency,
      'Method': w.withdrawalMethod,
      'Status': w.status,
      'Created': new Date(w.createdAt).toLocaleDateString(),
      'Updated': w.updatedAt ? new Date(w.updatedAt).toLocaleDateString() : '',
    }));
  }
}

export const freelanceFilterService = new FreelanceFilterService();

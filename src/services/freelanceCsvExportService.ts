/**
 * FreelanceCsvExportService
 * 
 * Handles CSV export functionality for invoices, withdrawals, and transaction history
 * Supports various export formats and custom column selection
 */

export interface CsvExportOptions {
  includeHeaders?: boolean;
  delimiter?: ',' | ';' | '\t';
  filename?: string;
  dateFormat?: 'ISO' | 'US' | 'EU';
}

export class FreelanceCsvExportService {
  /**
   * Escape CSV values containing special characters
   */
  private static escapeCsvValue(value: any): string {
    if (value === null || value === undefined) return '';

    const stringValue = value.toString();

    // If contains comma, quotes, or newlines, wrap in quotes and escape inner quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Format date based on locale preference
   */
  private static formatDate(date: string | Date, format: 'ISO' | 'US' | 'EU' = 'ISO'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    switch (format) {
      case 'US':
        return dateObj.toLocaleDateString('en-US');
      case 'EU':
        return dateObj.toLocaleDateString('en-GB');
      case 'ISO':
      default:
        return dateObj.toISOString().split('T')[0];
    }
  }

  /**
   * Convert array of objects to CSV string
   */
  private static convertToCSV(
    data: Array<Record<string, any>>,
    options: CsvExportOptions = {}
  ): string {
    if (!data || data.length === 0) {
      return '';
    }

    const delimiter = options.delimiter || ',';
    const includeHeaders = options.includeHeaders !== false;
    const dateFormat = options.dateFormat || 'ISO';

    const headers = Object.keys(data[0]);
    const rows: string[] = [];

    // Add headers
    if (includeHeaders) {
      rows.push(headers.map(h => this.escapeCsvValue(h)).join(delimiter));
    }

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        let value = row[header];

        // Format dates
        if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
          value = this.formatDate(value, dateFormat);
        }

        return this.escapeCsvValue(value);
      });

      rows.push(values.join(delimiter));
    }

    return rows.join('\n');
  }

  /**
   * Trigger CSV download in browser
   */
  private static downloadCSV(csvContent: string, filename: string): void {
    // Add BOM for UTF-8 encoding (helps with Excel and special characters)
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  }

  /**
   * Export invoices to CSV
   */
  static exportInvoicesToCSV(
    invoices: Array<Record<string, any>>,
    options: CsvExportOptions = {}
  ): void {
    try {
      // Prepare invoice data
      const csvData = invoices.map(inv => ({
        'Invoice Number': inv.invoiceNumber || inv.id,
        'Project': inv.projectTitle || inv.project_title,
        'Client': inv.clientName || inv.client_name,
        'Amount': inv.amount,
        'Currency': inv.currency,
        'Status': inv.status,
        'Issue Date': inv.issueDate || inv.issue_date,
        'Due Date': inv.dueDate || inv.due_date,
        'Description': inv.description || '',
        'Type': inv.type || 'freelance',
      }));

      const filename = options.filename || `invoices-export-${new Date().getTime()}.csv`;
      const csvContent = this.convertToCSV(csvData, options);

      this.downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting invoices to CSV:', error);
      throw error;
    }
  }

  /**
   * Export withdrawals to CSV
   */
  static exportWithdrawalsToCSV(
    withdrawals: Array<Record<string, any>>,
    options: CsvExportOptions = {}
  ): void {
    try {
      // Prepare withdrawal data
      const csvData = withdrawals.map(w => ({
        'Withdrawal ID': w.id,
        'Amount': w.amount,
        'Currency': w.currency,
        'Method': w.withdrawalMethod || w.withdrawal_method,
        'Status': w.status,
        'Request Date': w.createdAt || w.created_at,
        'Updated': w.updatedAt || w.updated_at || '',
        'Type': w.withdrawalType || w.withdrawal_type || 'freelance_earnings',
      }));

      const filename = options.filename || `withdrawals-export-${new Date().getTime()}.csv`;
      const csvContent = this.convertToCSV(csvData, options);

      this.downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting withdrawals to CSV:', error);
      throw error;
    }
  }

  /**
   * Export wallet transactions to CSV
   */
  static exportTransactionsToCSV(
    transactions: Array<Record<string, any>>,
    options: CsvExportOptions = {}
  ): void {
    try {
      // Prepare transaction data
      const csvData = transactions.map(tx => ({
        'Transaction ID': tx.id,
        'Type': tx.transactionType || tx.transaction_type || tx.type,
        'Amount': tx.amount,
        'Currency': tx.currency,
        'Balance Type': tx.balanceType || tx.balance_type,
        'Source': tx.source || '',
        'Description': tx.description || '',
        'Status': tx.status,
        'Date': tx.createdAt || tx.created_at || tx.timestamp,
      }));

      const filename = options.filename || `transactions-export-${new Date().getTime()}.csv`;
      const csvContent = this.convertToCSV(csvData, options);

      this.downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting transactions to CSV:', error);
      throw error;
    }
  }

  /**
   * Export bulk data combining invoices and withdrawals
   */
  static exportFinancialHistoryToCSV(
    invoices: Array<Record<string, any>>,
    withdrawals: Array<Record<string, any>>,
    options: CsvExportOptions = {}
  ): void {
    try {
      // Combine and prepare data
      const combinedData = [
        ...invoices.map(inv => ({
          'Date': inv.issueDate || inv.issue_date,
          'Type': 'Invoice',
          'ID': inv.invoiceNumber || inv.id,
          'Project': inv.projectTitle || inv.project_title,
          'Party': inv.clientName || inv.client_name,
          'Amount': inv.amount,
          'Currency': inv.currency,
          'Status': inv.status,
          'Direction': 'Incoming',
        })),
        ...withdrawals.map(w => ({
          'Date': w.createdAt || w.created_at,
          'Type': 'Withdrawal',
          'ID': w.id,
          'Project': w.withdrawalMethod || w.withdrawal_method,
          'Party': '',
          'Amount': w.amount,
          'Currency': w.currency,
          'Status': w.status,
          'Direction': 'Outgoing',
        })),
      ];

      // Sort by date
      combinedData.sort((a, b) => {
        const dateA = new Date(a['Date']).getTime();
        const dateB = new Date(b['Date']).getTime();
        return dateB - dateA; // Most recent first
      });

      const filename = options.filename || `financial-history-${new Date().getTime()}.csv`;
      const csvContent = this.convertToCSV(combinedData, options);

      this.downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting financial history to CSV:', error);
      throw error;
    }
  }

  /**
   * Export filtered data with statistics summary
   */
  static exportWithSummary(
    data: Array<Record<string, any>>,
    stats: Record<string, any>,
    title: string,
    options: CsvExportOptions = {}
  ): void {
    try {
      let csvContent = '';

      // Add title
      csvContent += `${this.escapeCsvValue(title)}\n`;
      csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

      // Add statistics summary
      csvContent += 'SUMMARY STATISTICS\n';
      csvContent += 'Metric,Value\n';

      for (const [key, value] of Object.entries(stats)) {
        if (typeof value === 'object') {
          csvContent += `${this.escapeCsvValue(key)}\n`;
          for (const [subKey, subValue] of Object.entries(value as Record<string, any>)) {
            csvContent += `,${this.escapeCsvValue(subKey)},${this.escapeCsvValue(subValue)}\n`;
          }
        } else {
          csvContent += `${this.escapeCsvValue(key)},${this.escapeCsvValue(value)}\n`;
        }
      }

      csvContent += '\n\nDETAILED DATA\n';

      // Add detailed data
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        csvContent += headers.map(h => this.escapeCsvValue(h)).join(options.delimiter || ',') + '\n';

        for (const row of data) {
          const values = headers.map(header => this.escapeCsvValue(row[header]));
          csvContent += values.join(options.delimiter || ',') + '\n';
        }
      }

      const filename = options.filename || `export-summary-${new Date().getTime()}.csv`;
      this.downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting with summary:', error);
      throw error;
    }
  }

  /**
   * Get CSV as string (for API responses or other uses)
   */
  static getCSVString(
    data: Array<Record<string, any>>,
    options: CsvExportOptions = {}
  ): string {
    return this.convertToCSV(data, options);
  }

  /**
   * Validate CSV data before export
   */
  static validateCsvData(data: Array<Record<string, any>>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('Data must be an array');
    }

    if (data.length === 0) {
      errors.push('No data to export');
    }

    // Check for consistent structure
    if (data.length > 0) {
      const firstKeys = Object.keys(data[0]);
      for (let i = 1; i < data.length; i++) {
        const currentKeys = Object.keys(data[i]);
        if (currentKeys.length !== firstKeys.length) {
          errors.push(`Row ${i} has inconsistent number of fields`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const freelanceCsvExportService = new FreelanceCsvExportService();

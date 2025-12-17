import { Transaction } from "@/types/wallet";

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  includeMetadata?: boolean;
}

class TransactionExportService {
  /**
   * Export transactions as CSV
   */
  exportAsCSV(transactions: Transaction[], filename?: string): void {
    try {
      const csvContent = this.generateCSV(transactions);
      this.downloadFile(csvContent, filename || 'transactions.csv', 'text/csv');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw new Error('Failed to export as CSV');
    }
  }

  /**
   * Export transactions as JSON
   */
  exportAsJSON(transactions: Transaction[], filename?: string): void {
    try {
      const jsonContent = JSON.stringify(transactions, null, 2);
      this.downloadFile(jsonContent, filename || 'transactions.json', 'application/json');
    } catch (error) {
      console.error('Error exporting JSON:', error);
      throw new Error('Failed to export as JSON');
    }
  }

  /**
   * Export transactions as PDF (requires external library or backend)
   */
  async exportAsPDF(transactions: Transaction[], filename?: string): Promise<void> {
    try {
      const pdfContent = this.generatePDFContent(transactions);
      
      if (typeof window !== 'undefined' && window.print) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(pdfContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 100);
        }
      } else {
        throw new Error('PDF export not supported in this environment');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw new Error('Failed to export as PDF');
    }
  }

  /**
   * Generate CSV content from transactions
   */
  private generateCSV(transactions: Transaction[]): string {
    const headers = [
      'Date',
      'Time',
      'Description',
      'Type',
      'Amount',
      'Status',
      'Source',
      'Destination',
      'Reference ID',
    ];

    const rows = transactions.map(tx => [
      new Date(tx.timestamp || tx.createdAt || '').toLocaleDateString(),
      new Date(tx.timestamp || tx.createdAt || '').toLocaleTimeString(),
      tx.description || '',
      tx.type || '',
      typeof tx.amount === 'string' ? tx.amount : tx.amount.toString(),
      tx.status || 'unknown',
      tx.source || '',
      tx.destination || '',
      tx.id || '',
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map(row =>
        row
          .map(cell => {
            const cellStr = String(cell || '');
            return cellStr.includes(',') || cellStr.includes('"')
              ? `"${cellStr.replace(/"/g, '""')}"`
              : cellStr;
          })
          .join(',')
      ),
    ];

    return csvLines.join('\n');
  }

  /**
   * Generate HTML/PDF content from transactions
   */
  private generatePDFContent(transactions: Transaction[]): string {
    const currentDate = new Date().toLocaleDateString();
    const totalAmount = transactions.reduce((sum, tx) => {
      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
      return sum + amount;
    }, 0);

    const transactionRows = transactions
      .map(
        (tx, index) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${index + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date(
          tx.timestamp || tx.createdAt || ''
        ).toLocaleDateString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${tx.description || ''}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${tx.type || ''}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${
          typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount
        }.00</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          <span style="padding: 4px 8px; border-radius: 4px; ${
            tx.status === 'completed'
              ? 'background-color: #dff0d8; color: #3c763d;'
              : tx.status === 'pending'
              ? 'background-color: #fcf8e3; color: #8a6d3b;'
              : 'background-color: #f2dede; color: #a94442;'
          }">
            ${tx.status || 'unknown'}
          </span>
        </td>
      </tr>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Transaction Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #007bff;
              padding-bottom: 15px;
            }
            .header h1 {
              margin: 0;
              color: #007bff;
            }
            .metadata {
              margin-bottom: 20px;
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 4px;
            }
            .metadata p {
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #007bff;
              color: white;
              padding: 12px;
              text-align: left;
              border: 1px solid #0056b3;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            .summary {
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 4px;
              margin-top: 20px;
            }
            .summary p {
              margin: 5px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Transaction Report</h1>
            <p>Generated on ${currentDate}</p>
          </div>
          
          <div class="metadata">
            <p><strong>Report Date:</strong> ${currentDate}</p>
            <p><strong>Total Transactions:</strong> ${transactions.length}</p>
            <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${transactionRows}
            </tbody>
          </table>

          <div class="summary">
            <p>Total Transactions: ${transactions.length}</p>
            <p>Total Amount: $${totalAmount.toFixed(2)}</p>
          </div>

          <div class="footer">
            <p>This is an automatically generated report. Please keep it secure and do not share with unauthorized persons.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Download file helper
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const element = document.createElement('a');
    element.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  /**
   * Filter transactions by date range
   */
  filterByDateRange(
    transactions: Transaction[],
    startDate: Date,
    endDate: Date
  ): Transaction[] {
    return transactions.filter(tx => {
      const txDate = new Date(tx.timestamp || tx.createdAt || '');
      return txDate >= startDate && txDate <= endDate;
    });
  }

  /**
   * Get summary statistics
   */
  getSummaryStats(transactions: Transaction[]): {
    totalCount: number;
    totalAmount: number;
    averageAmount: number;
    highestAmount: number;
    lowestAmount: number;
    successCount: number;
    pendingCount: number;
    failedCount: number;
  } {
    if (transactions.length === 0) {
      return {
        totalCount: 0,
        totalAmount: 0,
        averageAmount: 0,
        highestAmount: 0,
        lowestAmount: 0,
        successCount: 0,
        pendingCount: 0,
        failedCount: 0,
      };
    }

    const amounts = transactions.map(tx =>
      typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount
    );
    const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);

    return {
      totalCount: transactions.length,
      totalAmount,
      averageAmount: totalAmount / transactions.length,
      highestAmount: Math.max(...amounts),
      lowestAmount: Math.min(...amounts),
      successCount: transactions.filter(tx => tx.status === 'completed').length,
      pendingCount: transactions.filter(tx => tx.status === 'pending').length,
      failedCount: transactions.filter(tx => tx.status === 'failed').length,
    };
  }
}

export const transactionExportService = new TransactionExportService();

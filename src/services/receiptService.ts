import { Transaction } from "@/types/wallet";
import { supabase } from "@/integrations/supabase/client";

export interface Receipt {
  id: string;
  transactionId: string;
  userId: string;
  receiptNumber: string;
  generatedAt: string;
  filePath?: string;
}

export interface ReceiptData extends Transaction {
  receiptNumber?: string;
  userEmail?: string;
  userName?: string;
}

class ReceiptService {
  /**
   * Generate receipt for a transaction
   */
  async generateReceipt(transaction: Transaction, userId: string): Promise<Receipt> {
    try {
      const receiptNumber = this.generateReceiptNumber();

      // Store receipt record in database
      const { data, error } = await supabase
        .from('receipts')
        .insert([
          {
            transaction_id: transaction.id,
            user_id: userId,
            receipt_number: receiptNumber,
            generated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        throw new Error(`Failed to generate receipt: ${errorMsg}`);
      }

      return {
        id: data.id,
        transactionId: data.transaction_id,
        userId: data.user_id,
        receiptNumber: data.receipt_number,
        generatedAt: data.generated_at,
        filePath: data.file_path,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error generating receipt:', errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Get receipt for a transaction
   */
  async getReceipt(transactionId: string): Promise<Receipt | null> {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return null;

      return {
        id: data.id,
        transactionId: data.transaction_id,
        userId: data.user_id,
        receiptNumber: data.receipt_number,
        generatedAt: data.generated_at,
        filePath: data.file_path,
      };
    } catch (error) {
      console.error('Error fetching receipt:', error);
      return null;
    }
  }

  /**
   * Get all receipts for a user
   */
  async getUserReceipts(userId: string, limit = 50, offset = 0): Promise<Receipt[]> {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        throw new Error(`Failed to fetch receipts: ${errorMsg}`);
      }

      return (data || []).map(r => ({
        id: r.id,
        transactionId: r.transaction_id,
        userId: r.user_id,
        receiptNumber: r.receipt_number,
        generatedAt: r.generated_at,
        filePath: r.file_path,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching user receipts:', errorMsg);
      throw new Error(`Failed to load receipts: ${errorMsg}`);
    }
  }

  /**
   * Download receipt as PDF
   */
  async downloadReceiptAsPDF(
    transaction: ReceiptData,
    receiptNumber: string,
    fileName?: string
  ): Promise<void> {
    try {
      const htmlContent = this.generateReceiptHTML(transaction, receiptNumber);
      
      if (typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      throw new Error('Failed to download receipt');
    }
  }

  /**
   * Email receipt to user
   */
  async emailReceipt(
    transactionId: string,
    userId: string,
    userEmail: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('send-receipt-email', {
        body: {
          transactionId,
          userId,
          userEmail,
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error emailing receipt:', error);
      return false;
    }
  }

  /**
   * Generate unique receipt number
   */
  private generateReceiptNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RCP-${timestamp}-${random}`;
  }

  /**
   * Generate receipt HTML for PDF/printing
   */
  private generateReceiptHTML(transaction: ReceiptData, receiptNumber: string): string {
    const txDate = new Date(transaction.timestamp || transaction.createdAt || '');
    const amount = typeof transaction.amount === 'string' 
      ? parseFloat(transaction.amount) 
      : transaction.amount;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Transaction Receipt</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f5f5f5;
              padding: 20px;
            }
            .receipt-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .receipt-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .receipt-header h1 {
              font-size: 28px;
              margin-bottom: 5px;
            }
            .receipt-header p {
              opacity: 0.9;
              font-size: 14px;
            }
            .receipt-body {
              padding: 30px;
            }
            .receipt-section {
              margin-bottom: 25px;
            }
            .receipt-section-title {
              font-size: 12px;
              font-weight: bold;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 10px;
              border-bottom: 1px solid #eee;
              padding-bottom: 8px;
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 14px;
            }
            .receipt-row.bold {
              font-weight: bold;
              border-top: 2px solid #eee;
              padding-top: 12px;
              margin-top: 8px;
            }
            .receipt-row.label {
              color: #666;
            }
            .receipt-row.value {
              text-align: right;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              margin-top: 8px;
            }
            .status-completed {
              background-color: #d4edda;
              color: #155724;
            }
            .status-pending {
              background-color: #fff3cd;
              color: #856404;
            }
            .status-failed {
              background-color: #f8d7da;
              color: #721c24;
            }
            .amount-display {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
              margin: 15px 0;
            }
            .receipt-footer {
              border-top: 1px solid #eee;
              padding-top: 15px;
              margin-top: 15px;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
            .qr-placeholder {
              text-align: center;
              padding: 15px;
              background-color: #f5f5f5;
              border-radius: 4px;
              margin-top: 15px;
              font-size: 12px;
              color: #999;
            }
            @media print {
              body {
                background-color: white;
                padding: 0;
              }
              .receipt-container {
                box-shadow: none;
                border-radius: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <h1>RECEIPT</h1>
              <p>Transaction Confirmation</p>
            </div>

            <div class="receipt-body">
              <!-- Receipt Number -->
              <div class="receipt-section">
                <div class="receipt-section-title">Receipt Details</div>
                <div class="receipt-row">
                  <span class="label">Receipt Number:</span>
                  <span class="value">${receiptNumber}</span>
                </div>
                <div class="receipt-row">
                  <span class="label">Date & Time:</span>
                  <span class="value">${txDate.toLocaleDateString()} ${txDate.toLocaleTimeString()}</span>
                </div>
              </div>

              <!-- Transaction Details -->
              <div class="receipt-section">
                <div class="receipt-section-title">Transaction Details</div>
                <div class="receipt-row">
                  <span class="label">Description:</span>
                  <span class="value">${transaction.description || 'N/A'}</span>
                </div>
                <div class="receipt-row">
                  <span class="label">Type:</span>
                  <span class="value">${transaction.type || 'N/A'}</span>
                </div>
                <div class="receipt-row">
                  <span class="label">Source:</span>
                  <span class="value">${transaction.source || 'N/A'}</span>
                </div>
                ${transaction.destination ? `
                  <div class="receipt-row">
                    <span class="label">Destination:</span>
                    <span class="value">${transaction.destination}</span>
                  </div>
                ` : ''}
              </div>

              <!-- Amount -->
              <div class="receipt-section">
                <div class="receipt-row bold">
                  <span class="label">Amount:</span>
                  <span class="value">$${amount.toFixed(2)}</span>
                </div>
              </div>

              <!-- Status -->
              <div class="receipt-section">
                <div class="receipt-section-title">Status</div>
                <span class="status-badge status-${transaction.status || 'unknown'}">
                  ${transaction.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>

              <!-- Footer -->
              <div class="receipt-footer">
                <p>Thank you for your transaction. Please keep this receipt for your records.</p>
                <p style="margin-top: 10px; font-size: 10px;">Generated: ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const receiptService = new ReceiptService();

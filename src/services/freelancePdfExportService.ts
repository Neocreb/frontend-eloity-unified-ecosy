/**
 * FreelancePdfExportService
 * 
 * Handles PDF generation and export for freelance invoices
 * Uses jsPDF for client-side PDF generation
 */

export interface InvoiceForPdf {
  id: string;
  invoiceNumber: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  clientEmail: string;
  freelancerName: string;
  freelancerEmail: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  description?: string;
  status: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
  tax?: number;
  taxRate?: number;
}

export class FreelancePdfExportService {
  /**
   * Generate PDF buffer from invoice data
   * Note: This requires jsPDF to be installed
   * Client-side usage: Use generateInvoicePdf() instead
   */
  static async generateInvoicePdfBuffer(invoice: InvoiceForPdf): Promise<Buffer | null> {
    try {
      // Dynamic import to avoid bundle size issues
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set colors
      const primaryColor = [52, 152, 219]; // Blue
      const textColor = [33, 33, 33]; // Dark gray
      const lightBg = [245, 245, 245]; // Light gray
      const lineColor = [200, 200, 200]; // Border

      // Page width
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Header - Platform Name and Invoice Title
      doc.setFontSize(24);
      doc.setTextColor(52, 152, 219);
      doc.text('INVOICE', margin, yPosition);
      yPosition += 12;

      // Invoice number and dates
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, margin, yPosition);
      yPosition += 10;

      // Section: From
      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      doc.setFont(undefined, 'bold');
      doc.text('FROM', margin, yPosition);
      yPosition += 7;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(invoice.freelancerName, margin, yPosition);
      yPosition += 5;
      doc.text(invoice.freelancerEmail, margin, yPosition);
      yPosition += 10;

      // Section: Bill To
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('BILL TO', margin, yPosition);
      yPosition += 7;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(invoice.clientName, margin, yPosition);
      yPosition += 5;
      doc.text(invoice.clientEmail, margin, yPosition);
      yPosition += 10;

      // Section: Project Details
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('PROJECT DETAILS', margin, yPosition);
      yPosition += 7;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Project: ${invoice.projectTitle}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Project ID: ${invoice.projectId}`, margin, yPosition);
      yPosition += 10;

      // Section: Line Items Table (if provided)
      if (invoice.items && invoice.items.length > 0) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('LINE ITEMS', margin, yPosition);
        yPosition += 7;

        // Table header
        doc.setFillColor(...lightBg);
        doc.rect(margin, yPosition - 3, maxWidth, 6, 'F');
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text('Description', margin + 2, yPosition + 1);
        doc.text('Qty', margin + 80, yPosition + 1);
        doc.text('Unit Price', margin + 100, yPosition + 1);
        doc.text('Total', margin + 140, yPosition + 1);
        
        yPosition += 8;
        doc.setDrawColor(...lineColor);
        doc.line(margin, yPosition - 2, margin + maxWidth, yPosition - 2);

        // Table rows
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        
        for (const item of invoice.items) {
          doc.text(item.description.substring(0, 30), margin + 2, yPosition);
          doc.text(item.quantity.toString(), margin + 80, yPosition);
          doc.text(`${invoice.currency} ${item.unitPrice.toFixed(2)}`, margin + 100, yPosition);
          doc.text(`${invoice.currency} ${item.total.toFixed(2)}`, margin + 140, yPosition);
          yPosition += 6;
        }

        yPosition += 5;
      }

      // Section: Summary
      const summaryX = margin + 100;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');

      // Subtotal
      const subtotal = invoice.items 
        ? invoice.items.reduce((sum, item) => sum + item.total, 0)
        : invoice.amount;
      
      doc.text('Subtotal:', summaryX, yPosition);
      doc.text(`${invoice.currency} ${subtotal.toFixed(2)}`, summaryX + 50, yPosition, { align: 'right' });
      yPosition += 7;

      // Tax (if applicable)
      if (invoice.tax && invoice.taxRate) {
        doc.text(`Tax (${invoice.taxRate}%):`, summaryX, yPosition);
        doc.text(`${invoice.currency} ${invoice.tax.toFixed(2)}`, summaryX + 50, yPosition, { align: 'right' });
        yPosition += 7;
      }

      // Total
      const total = invoice.items 
        ? invoice.items.reduce((sum, item) => sum + item.total, 0) + (invoice.tax || 0)
        : invoice.amount;

      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.setFillColor(...lightBg);
      doc.rect(summaryX - 5, yPosition - 5, 55, 8, 'F');
      
      doc.text('TOTAL:', summaryX, yPosition);
      doc.text(`${invoice.currency} ${total.toFixed(2)}`, summaryX + 50, yPosition, { align: 'right' });
      yPosition += 12;

      // Section: Status
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.text(`Status: ${invoice.status.toUpperCase()}`, margin, yPosition);
      yPosition += 10;

      // Section: Notes
      if (invoice.notes) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('NOTES', margin, yPosition);
        yPosition += 5;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(invoice.notes, maxWidth);
        doc.text(splitNotes, margin, yPosition);
        yPosition += splitNotes.length * 4 + 5;
      }

      // Footer
      yPosition = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.line(margin, yPosition, margin + maxWidth, yPosition);
      yPosition += 5;
      doc.text('Generated by Eloity | Unified Wallet & Freelance Platform', pageWidth / 2, yPosition, { align: 'center' });
      doc.text(new Date().toLocaleString(), pageWidth / 2, yPosition + 4, { align: 'center' });

      // Return as buffer (for Node.js)
      return Buffer.from(doc.output('arraybuffer'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  }

  /**
   * Generate and download PDF in browser
   * Client-side method for immediate download
   */
  static async generateInvoicePdfDownload(invoice: InvoiceForPdf): Promise<void> {
    try {
      // Dynamic import to avoid bundle issues
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set colors
      const primaryColor = [52, 152, 219]; // Blue
      const textColor = [33, 33, 33]; // Dark gray
      const lightBg = [245, 245, 245]; // Light gray
      const lineColor = [200, 200, 200]; // Border

      // Page width
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Header
      doc.setFontSize(24);
      doc.setTextColor(...primaryColor);
      doc.text('INVOICE', margin, yPosition);
      yPosition += 12;

      // Invoice details
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, margin, yPosition);
      yPosition += 10;

      // From section
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('FROM', margin, yPosition);
      yPosition += 7;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(invoice.freelancerName, margin, yPosition);
      yPosition += 5;
      doc.text(invoice.freelancerEmail, margin, yPosition);
      yPosition += 10;

      // Bill To section
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('BILL TO', margin, yPosition);
      yPosition += 7;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(invoice.clientName, margin, yPosition);
      yPosition += 5;
      doc.text(invoice.clientEmail, margin, yPosition);
      yPosition += 10;

      // Project details
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('PROJECT DETAILS', margin, yPosition);
      yPosition += 7;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Project: ${invoice.projectTitle}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Project ID: ${invoice.projectId}`, margin, yPosition);
      yPosition += 10;

      // Line items if provided
      if (invoice.items && invoice.items.length > 0) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('LINE ITEMS', margin, yPosition);
        yPosition += 7;

        // Table header background
        doc.setFillColor(...lightBg);
        doc.rect(margin, yPosition - 3, maxWidth, 6, 'F');
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text('Description', margin + 2, yPosition + 1);
        doc.text('Qty', margin + 80, yPosition + 1);
        doc.text('Unit Price', margin + 100, yPosition + 1);
        doc.text('Total', margin + 140, yPosition + 1);
        
        yPosition += 8;
        doc.setDrawColor(...lineColor);
        doc.line(margin, yPosition - 2, margin + maxWidth, yPosition - 2);

        // Table rows
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        
        for (const item of invoice.items) {
          doc.text(item.description.substring(0, 30), margin + 2, yPosition);
          doc.text(item.quantity.toString(), margin + 80, yPosition);
          doc.text(`${invoice.currency} ${item.unitPrice.toFixed(2)}`, margin + 100, yPosition);
          doc.text(`${invoice.currency} ${item.total.toFixed(2)}`, margin + 140, yPosition);
          yPosition += 6;
        }

        yPosition += 5;
      }

      // Summary section
      const summaryX = margin + 100;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');

      const subtotal = invoice.items 
        ? invoice.items.reduce((sum, item) => sum + item.total, 0)
        : invoice.amount;
      
      doc.text('Subtotal:', summaryX, yPosition);
      doc.text(`${invoice.currency} ${subtotal.toFixed(2)}`, summaryX + 50, yPosition, { align: 'right' });
      yPosition += 7;

      // Tax
      if (invoice.tax && invoice.taxRate) {
        doc.text(`Tax (${invoice.taxRate}%):`, summaryX, yPosition);
        doc.text(`${invoice.currency} ${invoice.tax.toFixed(2)}`, summaryX + 50, yPosition, { align: 'right' });
        yPosition += 7;
      }

      // Total
      const total = invoice.items 
        ? invoice.items.reduce((sum, item) => sum + item.total, 0) + (invoice.tax || 0)
        : invoice.amount;

      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.setFillColor(...lightBg);
      doc.rect(summaryX - 5, yPosition - 5, 55, 8, 'F');
      
      doc.text('TOTAL:', summaryX, yPosition);
      doc.text(`${invoice.currency} ${total.toFixed(2)}`, summaryX + 50, yPosition, { align: 'right' });
      yPosition += 12;

      // Status
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.text(`Status: ${invoice.status.toUpperCase()}`, margin, yPosition);
      yPosition += 10;

      // Notes
      if (invoice.notes) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('NOTES', margin, yPosition);
        yPosition += 5;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(invoice.notes, maxWidth);
        doc.text(splitNotes, margin, yPosition);
      }

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.line(margin, footerY, margin + maxWidth, footerY);
      doc.text('Generated by Eloity | Unified Wallet & Freelance Platform', pageWidth / 2, footerY + 5, { align: 'center' });
      doc.text(new Date().toLocaleString(), pageWidth / 2, footerY + 9, { align: 'center' });

      // Download the PDF
      const filename = `Invoice-${invoice.invoiceNumber}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      throw error;
    }
  }

  /**
   * Generate multiple invoices as a PDF with summary
   */
  static async generateInvoicesBatchPdf(invoices: InvoiceForPdf[], title: string = 'Invoice Batch'): Promise<void> {
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Title
      doc.setFontSize(20);
      doc.setTextColor(52, 152, 219);
      doc.text(title, margin, yPosition);
      yPosition += 15;

      // Summary table
      doc.setFontSize(10);
      doc.setTextColor(33, 33, 33);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Total Invoices: ${invoices.length}`, margin, yPosition);
      yPosition += 10;

      const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const currency = invoices[0]?.currency || 'USD';
      
      doc.setFont(undefined, 'bold');
      doc.text(`Total Amount: ${currency} ${totalAmount.toFixed(2)}`, margin, yPosition);
      yPosition += 15;

      // Invoice summary table
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPosition - 3, maxWidth, 6, 'F');
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text('Invoice #', margin + 2, yPosition + 1);
      doc.text('Project', margin + 40, yPosition + 1);
      doc.text('Client', margin + 90, yPosition + 1);
      doc.text('Amount', margin + 140, yPosition + 1);
      doc.text('Status', margin + 170, yPosition + 1);

      yPosition += 8;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition - 2, margin + maxWidth, yPosition - 2);

      // Invoice rows
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      
      for (const invoice of invoices) {
        doc.text(invoice.invoiceNumber, margin + 2, yPosition);
        doc.text(invoice.projectTitle.substring(0, 25), margin + 40, yPosition);
        doc.text(invoice.clientName.substring(0, 20), margin + 90, yPosition);
        doc.text(`${currency} ${invoice.amount.toFixed(2)}`, margin + 140, yPosition);
        doc.text(invoice.status.substring(0, 8), margin + 170, yPosition);
        yPosition += 5;
      }

      // Download
      const filename = `Invoices-Batch-${new Date().getTime()}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Error generating batch invoice PDF:', error);
      throw error;
    }
  }
}

export const freelancePdfExportService = new FreelancePdfExportService();

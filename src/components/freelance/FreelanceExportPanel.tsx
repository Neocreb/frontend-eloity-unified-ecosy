import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileText,
  Table,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { useInvoicePdfExport } from "@/hooks/useInvoicePdfExport";
import { useCsvExport } from "@/hooks/useCsvExport";
import { useToast } from "@/components/ui/use-toast";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  projectTitle: string;
  amount: number;
  currency: string;
  status: string;
  issueDate: Date | string;
  dueDate: Date | string;
  items?: any[];
  subtotal?: number;
  tax?: number;
  total?: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  createdAt: Date | string;
}

interface FreelanceExportPanelProps {
  invoices?: Invoice[];
  withdrawals?: Withdrawal[];
  transactions?: any[];
}

type ExportType = "invoice-pdf" | "batch-pdf" | "invoices-csv" | "withdrawals-csv" | "combined-csv";
type DateFormat = "ISO" | "US" | "EU";
type CsvDelimiter = "," | ";" | "\t";

export const FreelanceExportPanel: React.FC<FreelanceExportPanelProps> = ({
  invoices = [],
  withdrawals = [],
  transactions = [],
}) => {
  const { toast } = useToast();
  const { isExporting: isPdfExporting, downloadBatchPdf } = useInvoicePdfExport();
  const {
    isExporting: isCsvExporting,
    exportInvoices,
    exportWithdrawals,
    exportFinancialHistory,
  } = useCsvExport();

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [exportType, setExportType] = useState<ExportType>("invoices-csv");
  const [dateFormat, setDateFormat] = useState<DateFormat>("ISO");
  const [delimiter, setDelimiter] = useState<CsvDelimiter>(",");
  const [customFilename, setCustomFilename] = useState("");

  const isExporting = isPdfExporting || isCsvExporting;

  const handleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map((inv) => inv.id));
    }
  };

  const handleToggleInvoice = (invoiceId: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleExport = async () => {
    if (!invoices.length && !withdrawals.length) {
      toast({
        title: "No data to export",
        description: "Please ensure you have invoices or withdrawals to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const options = {
        dateFormat,
        delimiter,
        filename: customFilename,
      };

      switch (exportType) {
        case "batch-pdf":
          if (selectedInvoices.length === 0) {
            toast({
              title: "No invoices selected",
              description: "Please select at least one invoice to export as PDF",
              variant: "destructive",
            });
            return;
          }
          const selectedInvs = invoices.filter((inv) =>
            selectedInvoices.includes(inv.id)
          );
          await downloadBatchPdf(selectedInvs);
          toast({
            title: "PDF exported successfully",
            description: `${selectedInvs.length} invoice(s) downloaded`,
          });
          break;

        case "invoices-csv":
          if (invoices.length === 0) {
            toast({
              title: "No invoices to export",
              variant: "destructive",
            });
            return;
          }
          await exportInvoices(invoices, options);
          toast({
            title: "CSV exported successfully",
            description: `${invoices.length} invoices exported`,
          });
          break;

        case "withdrawals-csv":
          if (withdrawals.length === 0) {
            toast({
              title: "No withdrawals to export",
              variant: "destructive",
            });
            return;
          }
          await exportWithdrawals(withdrawals, options);
          toast({
            title: "CSV exported successfully",
            description: `${withdrawals.length} withdrawals exported`,
          });
          break;

        case "combined-csv":
          if (!invoices.length && !withdrawals.length) {
            toast({
              title: "No data to export",
              variant: "destructive",
            });
            return;
          }
          await exportFinancialHistory(invoices, withdrawals, options);
          toast({
            title: "CSV exported successfully",
            description: "Financial history exported",
          });
          break;
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const getExportInfo = () => {
    switch (exportType) {
      case "batch-pdf":
        return {
          count: selectedInvoices.length,
          label: "invoices selected",
          icon: FileText,
        };
      case "invoices-csv":
        return { count: invoices.length, label: "invoices", icon: Table };
      case "withdrawals-csv":
        return { count: withdrawals.length, label: "withdrawals", icon: Table };
      case "combined-csv":
        return {
          count: invoices.length + withdrawals.length,
          label: "items total",
          icon: Table,
        };
      default:
        return { count: 0, label: "items", icon: Table };
    }
  };

  const info = getExportInfo();
  const Icon = info.icon;

  return (
    <div className="space-y-6">
      {/* Export Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Type */}
          <div>
            <Label htmlFor="export-type">Export Type</Label>
            <Select value={exportType} onValueChange={(value) => setExportType(value as ExportType)}>
              <SelectTrigger id="export-type" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoices-csv">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    Invoices to CSV
                  </div>
                </SelectItem>
                <SelectItem value="withdrawals-csv">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    Withdrawals to CSV
                  </div>
                </SelectItem>
                <SelectItem value="combined-csv">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    Complete History (CSV)
                  </div>
                </SelectItem>
                {invoices.length > 0 && (
                  <SelectItem value="batch-pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Invoices to PDF
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Selection for Batch PDF */}
          {exportType === "batch-pdf" && invoices.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label>Select Invoices</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedInvoices.length === invoices.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {invoices.map((invoice) => (
                  <label
                    key={invoice.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={() => handleToggleInvoice(invoice.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {invoice.clientName}
                      </p>
                    </div>
                    <Badge variant="outline">${invoice.amount}</Badge>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* CSV Options */}
          {exportType !== "batch-pdf" && (
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select value={dateFormat} onValueChange={(value) => setDateFormat(value as DateFormat)}>
                    <SelectTrigger id="date-format" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ISO">ISO (2024-01-15)</SelectItem>
                      <SelectItem value="US">US (01/15/2024)</SelectItem>
                      <SelectItem value="EU">EU (15/01/2024)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="delimiter">CSV Delimiter</Label>
                  <Select value={delimiter} onValueChange={(value) => setDelimiter(value as CsvDelimiter)}>
                    <SelectTrigger id="delimiter" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Comma (,)</SelectItem>
                      <SelectItem value=";">Semicolon (;)</SelectItem>
                      <SelectItem value="\t">Tab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="filename">Custom Filename (optional)</Label>
                <input
                  id="filename"
                  type="text"
                  placeholder="e.g., invoices_2024_01"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  If empty, auto-generated name will be used
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Summary */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Ready to export <span className="font-bold">{info.count}</span>{" "}
                {info.label}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {exportType === "batch-pdf"
                  ? "Selected invoices will be combined into a single PDF file"
                  : `Your data will be exported as ${exportType.includes("csv") ? "CSV" : "PDF"} format`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Button
        onClick={handleExport}
        disabled={isExporting || (exportType === "batch-pdf" && selectedInvoices.length === 0)}
        size="lg"
        className="w-full"
      >
        {isExporting ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            {exportType === "batch-pdf"
              ? `Export ${selectedInvoices.length} Invoices as PDF`
              : "Export Data"}
          </>
        )}
      </Button>

      {/* Tips */}
      <Card className="bg-gray-50 dark:bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-sm">Export Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
            <p>CSV files can be opened in Excel, Google Sheets, or any spreadsheet application</p>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
            <p>PDF exports include professional formatting with your company branding</p>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
            <p>All exports are generated locally in your browser - no data leaves your device</p>
          </div>
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p>Use different date formats based on your regional preference</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FreelanceExportPanel;

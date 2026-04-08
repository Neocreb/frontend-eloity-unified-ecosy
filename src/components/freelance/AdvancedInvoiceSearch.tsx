import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useAdvancedFilter } from "@/hooks/useAdvancedFilter";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  projectTitle: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue" | "draft";
  issueDate: Date | string;
  dueDate: Date | string;
}

interface AdvancedInvoiceSearchProps {
  invoices: Invoice[];
  onFilterChange?: (filtered: Invoice[]) => void;
  pageSize?: number;
}

export const AdvancedInvoiceSearch: React.FC<AdvancedInvoiceSearchProps> = ({
  invoices,
  onFilterChange,
  pageSize = 10,
}) => {
  const { toast } = useToast();
  const {
    criteria,
    filterInvoices,
    setSearchTerm,
    setStatusFilter,
    setDateRange,
    setSorting,
    goToPage,
    clearFilters,
  } = useAdvancedFilter();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minAmount, setMinAmount] = useState<number | "">("");
  const [maxAmount, setMaxAmount] = useState<number | "">("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");

  // Filter invoices based on criteria
  const result = useMemo(() => {
    const filtered = filterInvoices(invoices, {
      ...criteria,
      pageSize,
      amountMin: typeof minAmount === "number" ? minAmount : undefined,
      amountMax: typeof maxAmount === "number" ? maxAmount : undefined,
      currency: selectedCurrency || undefined,
    });

    // Call callback if filters changed
    if (onFilterChange) {
      onFilterChange(filtered.items);
    }

    return filtered;
  }, [filterInvoices, invoices, criteria, minAmount, maxAmount, selectedCurrency, pageSize, onFilterChange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const filtered = result.items;
    if (filtered.length === 0) {
      return { total: 0, average: 0, highest: 0, byStatus: {} };
    }

    const total = filtered.reduce((sum, inv) => sum + inv.amount, 0);
    const average = total / filtered.length;
    const highest = Math.max(...filtered.map(inv => inv.amount));

    const byStatus = filtered.reduce((acc, inv) => {
      if (!acc[inv.status]) {
        acc[inv.status] = { count: 0, total: 0 };
      }
      acc[inv.status].count += 1;
      acc[inv.status].total += inv.amount;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    return { total, average, highest, byStatus };
  }, [result.items]);

  const handleClearFilters = () => {
    clearFilters();
    setMinAmount("");
    setMaxAmount("");
    setSelectedCurrency("");
    toast({
      title: "Filters cleared",
      description: "All filters have been reset",
    });
  };

  const statusOptions = ["paid", "pending", "overdue", "draft"];
  const sortOptions = [
    { value: "date", label: "Issue Date" },
    { value: "amount", label: "Amount" },
    { value: "status", label: "Status" },
    { value: "client", label: "Client Name" },
  ];

  const currencies = Array.from(new Set(invoices.map(inv => inv.currency)));
  const activeFilterCount = [
    criteria.searchTerm,
    criteria.status?.length,
    criteria.dateFrom,
    criteria.dateTo,
    minAmount !== "" ? minAmount : null,
    maxAmount !== "" ? maxAmount : null,
    selectedCurrency,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Advanced Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div>
            <Label htmlFor="search">Search by Invoice, Client, or Project</Label>
            <Input
              id="search"
              placeholder="Type to search..."
              value={criteria.searchTerm || ""}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={criteria.status?.[0] || ""}
                onValueChange={(value) =>
                  setStatusFilter(value ? [value] : [])
                }
              >
                <SelectTrigger id="status" className="mt-2">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort">Sort By</Label>
              <Select
                value={criteria.sortBy || "date"}
                onValueChange={(value) =>
                  setSorting(value as any, criteria.sortOrder)
                }
              >
                <SelectTrigger id="sort" className="mt-2">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="order">Order</Label>
              <Select
                value={criteria.sortOrder || "desc"}
                onValueChange={(value) =>
                  setSorting(criteria.sortBy, value as any)
                }
              >
                <SelectTrigger id="order" className="mt-2">
                  <SelectValue placeholder="Order..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Advanced ({activeFilterCount})
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="pt-4 border-t space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={criteria.dateFrom || ""}
                    onChange={(e) =>
                      setDateRange(e.target.value, criteria.dateTo)
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={criteria.dateTo || ""}
                    onChange={(e) =>
                      setDateRange(criteria.dateFrom, e.target.value)
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minAmount">Min Amount</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    placeholder="0"
                    value={minAmount}
                    onChange={(e) =>
                      setMinAmount(e.target.value ? parseFloat(e.target.value) : "")
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="maxAmount">Max Amount</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    placeholder="∞"
                    value={maxAmount}
                    onChange={(e) =>
                      setMaxAmount(e.target.value ? parseFloat(e.target.value) : "")
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Currency Filter */}
              {currencies.length > 1 && (
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger id="currency" className="mt-2">
                      <SelectValue placeholder="All Currencies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Currencies</SelectItem>
                      {currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Clear Button */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Total Amount
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Average Amount
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.average.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Highest Amount
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.highest.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Results Found
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.items.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      {Object.keys(stats.byStatus).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.byStatus).map(([status, data]) => (
                <div key={status} className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <Badge className="mb-2">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                  <p className="text-2xl font-bold">{data.count}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ${data.total.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Results ({result.startIndex + 1}-{Math.min(result.endIndex, result.items.length)} of{" "}
              {result.items.length})
            </CardTitle>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {result.currentPage} of {result.pageCount}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.items.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No invoices match your search criteria
              </p>
            </div>
          ) : (
            <>
              {result.items.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {invoice.invoiceNumber}
                        </h4>
                        <Badge variant="outline">{invoice.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {invoice.clientName} • {invoice.projectTitle}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Due:{" "}
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {invoice.currency} ${invoice.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {result.pageCount > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={result.currentPage === 1}
                    onClick={() => goToPage(result.currentPage - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {Array.from({ length: result.pageCount }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={page === result.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={result.currentPage === result.pageCount}
                    onClick={() => goToPage(result.currentPage + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedInvoiceSearch;

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdvancedFilters, { FilterState } from "@/components/marketplace/AdvancedFilters";
import { MarketplaceService } from "@/services/marketplaceService";
import { Product } from "@/types/marketplace";
import ProductCard from "@/components/marketplace/ProductCard";
import { useCurrency } from "@/contexts/CurrencyContext";

const ITEMS_PER_PAGE = 12;

const AdvancedSearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { formatCurrency } = useCurrency();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || ""
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    conditions: [],
    priceRange: [0, 1000],
    minRating: undefined,
    categories: [],
    tags: [],
    sortBy: "relevance",
  });

  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await MarketplaceService.getCategories();
        setCategories(
          cats.map((c) => ({ id: c.id, name: c.name }))
        );
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };

    loadCategories();
  }, []);

  // Perform search when query, filters, or page changes
  useEffect(() => {
    const performSearch = async () => {
      try {
        setLoading(true);
        setError(null);

        const offset = (currentPage - 1) * ITEMS_PER_PAGE;

        // Get filtered products
        const results = await MarketplaceService.advancedSearch({
          searchQuery: searchQuery || undefined,
          categoryId:
            filters.categories.length > 0
              ? filters.categories[0]
              : undefined,
          brands:
            filters.brands.length > 0 ? filters.brands : undefined,
          conditions:
            filters.conditions.length > 0
              ? filters.conditions
              : undefined,
          minPrice: filters.priceRange[0],
          maxPrice: filters.priceRange[1],
          minRating: filters.minRating,
          tags: filters.tags.length > 0 ? filters.tags : undefined,
          sortBy: (filters.sortBy as any) || "relevance",
          limit: ITEMS_PER_PAGE,
          offset,
        });

        setProducts(results);

        // Get total count
        const count = await MarketplaceService.countProducts({
          searchQuery: searchQuery || undefined,
          categoryId:
            filters.categories.length > 0
              ? filters.categories[0]
              : undefined,
          brands:
            filters.brands.length > 0 ? filters.brands : undefined,
          conditions:
            filters.conditions.length > 0
              ? filters.conditions
              : undefined,
          minPrice: filters.priceRange[0],
          maxPrice: filters.priceRange[1],
          minRating: filters.minRating,
          tags: filters.tags.length > 0 ? filters.tags : undefined,
        });

        setTotalCount(count);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Search failed";
        setError(errorMsg);
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [searchQuery, filters, currentPage]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasResults = products.length > 0;
  const showPagination = totalPages > 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Search Products</h1>

          <div className="flex gap-2">
            <Input
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 h-11"
            />
            <Button disabled={!searchQuery}>Search</Button>
          </div>

          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing {Math.min(ITEMS_PER_PAGE, products.length)} of{" "}
              {totalCount} results for{" "}
              <span className="font-semibold">{searchQuery}</span>
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Search Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="mb-4">
                <h2 className="text-lg font-bold mb-4">Filters</h2>
              </div>
              <AdvancedFilters
                onFilterChange={handleFilterChange}
                categories={categories}
              />
            </div>
          </aside>

          {/* Results */}
          <main className="lg:col-span-3">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && !hasResults && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">
                  No products found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search query
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({
                      brands: [],
                      conditions: [],
                      priceRange: [0, 1000],
                      minRating: undefined,
                      categories: [],
                      tags: [],
                      sortBy: "relevance",
                    });
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {!loading && hasResults && (
              <>
                {/* Results Count and Sort */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{totalCount}</span> results
                  </div>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) =>
                      handleFilterChange({
                        ...filters,
                        sortBy: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="price-low">
                        Price: Low to High
                      </SelectItem>
                      <SelectItem value="price-high">
                        Price: High to Low
                      </SelectItem>
                      <SelectItem value="rating">
                        Highest Rated
                      </SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="popular">
                        Most Popular
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {showPagination && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }).map(
                        (_, i) => {
                          const pageNum =
                            currentPage <= 3
                              ? i + 1
                              : currentPage - 2 + i;
                          if (pageNum > totalPages) return null;

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setCurrentPage(pageNum)
                              }
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentPage(
                          Math.min(totalPages, currentPage + 1)
                        )
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Results summary */}
                <div className="text-center text-sm text-muted-foreground mt-4">
                  Showing page {currentPage} of {totalPages}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchResults;

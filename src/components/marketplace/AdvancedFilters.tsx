import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { X } from "lucide-react";
import { MarketplaceService } from "@/services/marketplaceService";
import { useCurrency } from "@/contexts/CurrencyContext";

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  categories?: Array<{ id: string; name: string }>;
  className?: string;
}

export interface FilterState {
  brands: string[];
  conditions: string[];
  priceRange: [number, number];
  minRating: number | undefined;
  categories: string[];
  tags: string[];
  sortBy: string;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFilterChange,
  categories = [],
  className = "",
}) => {
  const { formatCurrency } = useCurrency();
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    conditions: [],
    priceRange: [0, 1000],
    minRating: undefined,
    categories: [],
    tags: [],
    sortBy: "relevance",
  });

  const [brands, setBrands] = useState<{ name: string; count: number }[]>([]);
  const [conditions, setConditions] = useState<
    { condition: string; count: number }[]
  >([]);
  const [priceStats, setPriceStats] = useState<{
    min: number;
    max: number;
  }>({ min: 0, max: 1000 });
  const [loading, setLoading] = useState(true);

  // Fetch filter data on mount
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        setLoading(true);
        const [brandsData, conditionsData, priceData] = await Promise.all([
          MarketplaceService.getBrands(),
          MarketplaceService.getProductConditions(),
          MarketplaceService.getPriceStatistics(),
        ]);

        setBrands(brandsData);
        setConditions(conditionsData);
        setPriceStats({
          min: Math.floor(priceData.min),
          max: Math.ceil(priceData.max),
        });

        // Set price range to actual data range
        setFilters((prev) => ({
          ...prev,
          priceRange: [
            Math.floor(priceData.min),
            Math.ceil(priceData.max),
          ] as [number, number],
        }));
      } catch (error) {
        console.error("Error loading filter data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFilterData();
  }, []);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleBrandToggle = (brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const handleConditionToggle = (condition: string) => {
    setFilters((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));
  };

  const handlePriceChange = (value: number[]) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [value[0], value[1]] as [number, number],
    }));
  };

  const handleRatingChange = (rating: number) => {
    setFilters((prev) => ({
      ...prev,
      minRating: prev.minRating === rating ? undefined : rating,
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((c) => c !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const handleSortChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      brands: [],
      conditions: [],
      priceRange: [priceStats.min, priceStats.max],
      minRating: undefined,
      categories: [],
      tags: [],
      sortBy: "relevance",
    });
  };

  const activeFilterCount =
    filters.brands.length +
    filters.conditions.length +
    filters.categories.length +
    filters.tags.length +
    (filters.minRating ? 1 : 0) +
    (filters.priceRange[0] > priceStats.min ||
    filters.priceRange[1] < priceStats.max
      ? 1
      : 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Sort By */}
      <div>
        <label className="text-sm font-semibold mb-2 block">Sort By</label>
        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Brands */}
      {brands.length > 0 && (
        <>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">Brands</label>
              {filters.brands.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.brands.length}
                </Badge>
              )}
            </div>
            <Accordion type="single" collapsible defaultValue="brands">
              <AccordionItem value="brands" className="border-0">
                <AccordionTrigger className="py-0 hover:no-underline">
                  View All
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-2 mt-2">
                    {brands.slice(0, 5).map((brand) => (
                      <div key={brand.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={`brand-${brand.name}`}
                          checked={filters.brands.includes(brand.name)}
                          onCheckedChange={() =>
                            handleBrandToggle(brand.name)
                          }
                        />
                        <label
                          htmlFor={`brand-${brand.name}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {brand.name}
                        </label>
                        <span className="text-xs text-muted-foreground">
                          ({brand.count})
                        </span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <Separator />
        </>
      )}

      {/* Price Range */}
      <div>
        <label className="text-sm font-semibold mb-3 block">
          Price Range: {formatCurrency(filters.priceRange[0])} -{" "}
          {formatCurrency(filters.priceRange[1])}
        </label>
        <Slider
          value={filters.priceRange}
          onValueChange={handlePriceChange}
          min={priceStats.min}
          max={priceStats.max}
          step={10}
          className="mt-2"
        />
      </div>

      <Separator />

      {/* Rating */}
      <div>
        <label className="text-sm font-semibold mb-3 block">
          Minimum Rating
        </label>
        <div className="flex gap-2">
          {[4, 3, 2, 1].map((rating) => (
            <Button
              key={rating}
              variant={
                filters.minRating === rating ? "default" : "outline"
              }
              size="sm"
              onClick={() => handleRatingChange(rating)}
            >
              {rating}+ ⭐
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Conditions */}
      {conditions.length > 0 && (
        <>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">Condition</label>
              {filters.conditions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.conditions.length}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {conditions.map((condition) => (
                <div
                  key={condition.condition}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`condition-${condition.condition}`}
                    checked={filters.conditions.includes(
                      condition.condition
                    )}
                    onCheckedChange={() =>
                      handleConditionToggle(condition.condition)
                    }
                  />
                  <label
                    htmlFor={`condition-${condition.condition}`}
                    className="text-sm flex-1 cursor-pointer capitalize"
                  >
                    {condition.condition.replace("_", " ")}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    ({condition.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">Categories</label>
              {filters.categories.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.categories.length}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {categories.slice(0, 5).map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={filters.categories.includes(category.id)}
                    onCheckedChange={() =>
                      handleCategoryToggle(category.id)
                    }
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm flex-1 cursor-pointer"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Active Filters:</span>
            <Badge variant="secondary">{activeFilterCount}</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.brands.map((brand) => (
              <Badge key={`brand-${brand}`} variant="outline" className="flex items-center gap-1">
                {brand}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 hover:bg-transparent p-0"
                  onClick={() => handleBrandToggle(brand)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}

            {filters.conditions.map((condition) => (
              <Badge key={`cond-${condition}`} variant="outline" className="flex items-center gap-1">
                {condition.replace("_", " ")}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 hover:bg-transparent p-0"
                  onClick={() => handleConditionToggle(condition)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}

            {filters.minRating && (
              <Badge variant="outline" className="flex items-center gap-1">
                {filters.minRating}+ Stars
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 hover:bg-transparent p-0"
                  onClick={() => handleRatingChange(filters.minRating!)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )}

            {(filters.priceRange[0] > priceStats.min ||
              filters.priceRange[1] < priceStats.max) && (
              <Badge variant="outline" className="flex items-center gap-1">
                {formatCurrency(filters.priceRange[0])} -{" "}
                {formatCurrency(filters.priceRange[1])}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 hover:bg-transparent p-0"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      priceRange: [
                        priceStats.min,
                        priceStats.max,
                      ] as [number, number],
                    }))
                  }
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleClearFilters}
          >
            Clear All Filters
          </Button>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;

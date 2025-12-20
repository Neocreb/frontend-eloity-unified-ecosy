import { globalSearchService } from "./globalSearchService";
import { MarketplaceService } from "./marketplaceService";
import { supabase } from "@/integrations/supabase/client";

const RECENT_SEARCHES_KEY = "marketplace_recent_searches";
const MAX_RECENT_SEARCHES = 10;

export class SearchService {
  async getRecentSearches(): Promise<string[]> {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) {
        return [];
      }
      return JSON.parse(stored) as string[];
    } catch (error) {
      console.error("Error fetching recent searches:", error);
      return [];
    }
  }

  async getTrendingSearches(): Promise<string[]> {
    try {
      // Try to get trending from global service first
      const globalTrending = await globalSearchService.getTrendingTopics();
      if (globalTrending && globalTrending.length > 0) {
        return globalTrending;
      }

      // Fallback: get popular products
      const products = await MarketplaceService.getProducts({
        limit: 100,
      });

      // Extract trending words from product names and descriptions
      const wordFreq = new Map<string, number>();
      products.forEach(product => {
        const words = (product.name + " " + product.description)
          .toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 3);

        words.forEach(word => {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        });
      });

      return Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
    } catch (error) {
      console.error("Error fetching trending searches:", error);
      return [];
    }
  }

  async getSearchSuggestions(query: string): Promise<Array<{
    id: string;
    text: string;
    type: "product" | "category" | "brand" | "trending";
    category?: string;
    productCount?: number;
  }>> {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const suggestions: Array<{
        id: string;
        text: string;
        type: "product" | "category" | "brand" | "trending";
        category?: string;
        productCount?: number;
      }> = [];

      // Get marketplace-specific suggestions
      const marketplaceSuggestions = await MarketplaceService.getSearchSuggestions(query, 8);

      // Add product suggestions
      marketplaceSuggestions.products.forEach((product, index) => {
        suggestions.push({
          id: `product-${index}`,
          text: product,
          type: "product"
        });
      });

      // Add brand suggestions
      marketplaceSuggestions.brands.forEach((brand, index) => {
        suggestions.push({
          id: `brand-${index}`,
          text: brand,
          type: "brand"
        });
      });

      // Add category suggestions
      marketplaceSuggestions.categories.forEach((category, index) => {
        suggestions.push({
          id: `category-${index}`,
          text: category,
          type: "category"
        });
      });

      // Try to get global suggestions as fallback
      if (suggestions.length < 5) {
        const globalSuggestions = await globalSearchService.getSuggestions(query);
        globalSuggestions.forEach((text, index) => {
          if (suggestions.length >= 8) return;
          if (!suggestions.some(s => s.text === text)) {
            suggestions.push({
              id: `global-${index}`,
              text,
              type: "trending"
            });
          }
        });
      }

      return suggestions.slice(0, 8);
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      return [];
    }
  }

  async saveRecentSearch(query: string): Promise<void> {
    try {
      if (!query || query.trim().length === 0) {
        return;
      }

      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      let searches: string[] = stored ? JSON.parse(stored) : [];

      // Remove duplicate (if exists) and add to beginning
      searches = searches.filter(s => s !== query);
      searches.unshift(query);

      // Keep only the most recent searches
      searches = searches.slice(0, MAX_RECENT_SEARCHES);

      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  }

  async clearRecentSearches(): Promise<void> {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error("Error clearing recent searches:", error);
    }
  }

  async removeRecentSearch(query: string): Promise<void> {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) return;

      let searches: string[] = JSON.parse(stored);
      searches = searches.filter(s => s !== query);

      if (searches.length === 0) {
        localStorage.removeItem(RECENT_SEARCHES_KEY);
      } else {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
      }
    } catch (error) {
      console.error("Error removing recent search:", error);
    }
  }
}

export const searchService = new SearchService();

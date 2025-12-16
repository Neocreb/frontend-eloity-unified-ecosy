import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Star,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Video,
  ShoppingBag,
  Briefcase,
  FileText,
  User,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Clock,
  UserCheck,
} from "lucide-react";
import { globalSearchService } from "@/services/globalSearchService";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  type: "user" | "product" | "service" | "post" | "video" | "crypto" | "job";
  title: string;
  description: string;
  image?: string;
  price?: number;
  rating?: number;
  location?: string;
  category?: string;
  tags?: string[];
  timestamp?: Date;
  author?: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

interface SearchFilters {
  category: string;
  priceMin: string;
  priceMax: string;
  rating: string;
  dateRange: string;
  location: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const GlobalSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const query = searchParams.get("q") || "";
  const activeTab = searchParams.get("type") || "all";

  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: "",
    priceMin: "",
    priceMax: "",
    rating: "",
    dateRange: "",
    location: "",
    sortBy: "relevance",
    sortOrder: "desc",
  });

  const searchTabs = [
    { id: "all", label: "All", icon: Search },
    { id: "users", label: "Users", icon: User },
    { id: "products", label: "Products", icon: ShoppingBag },
    { id: "services", label: "Services", icon: Briefcase },
    { id: "jobs", label: "Freelance Jobs", icon: UserCheck },
    { id: "posts", label: "Posts", icon: FileText },
    { id: "videos", label: "Videos", icon: Video },
    { id: "crypto", label: "Crypto", icon: TrendingUp },
  ];

  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "date", label: "Date" },
    { value: "rating", label: "Rating" },
    { value: "price", label: "Price" },
    { value: "popularity", label: "Popularity" },
    { value: "alphabetical", label: "Alphabetical" },
  ];

  // Perform search when query or filters change
  useEffect(() => {
    if (searchQuery) {
      performSearch();
    }
  }, [searchQuery, activeTab, filters]);

  const performSearch = async () => {
    setIsLoading(true);

    try {
      const searchResults = await globalSearchService.search({
        query: searchQuery,
        type: activeTab === "all" ? undefined : activeTab,
        filters,
      });

      setResults(searchResults.results);
    } catch (error) {
      console.error("Search failed:", error instanceof Error ? error.message : JSON.stringify(error));
      toast({
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({
        q: searchQuery.trim(),
        type: activeTab,
      });
    }
  };

  const handleTabChange = (value: string) => {
    setSearchParams({
      q: searchQuery,
      type: value,
    });
  };

  const handleResultClick = (result: SearchResult) => {
    // Navigate based on result type
    switch (result.type) {
      case "user":
        navigate(
          `/app/user/${result.title.toLowerCase().replace(/\s+/g, "-")}`,
        );
        break;
      case "product":
        navigate(`/app/marketplace/product/${result.id}`);
        break;
      case "service":
        navigate(`/app/freelance/service/${result.id}`);
        break;
      case "job":
        navigate(`/app/freelance/job/${result.id}`);
        break;
      case "post":
        navigate(`/app/post/${result.id}`);
        break;
      case "video":
        navigate(`/app/videos/${result.id}`);
        break;
      case "crypto":
        navigate(`/app/crypto/${result.title.toLowerCase()}`);
        break;
      default:
        console.log("Unknown result type:", result.type);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", { notation: "compact" }).format(num);
  };

  const getResultsByType = (type: string) => {
    if (type === "all") return results;
    return results.filter((result) => result.type === type);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
      onClick={() => handleResultClick(result)}
    >
      <CardContent className={viewMode === "grid" ? "p-4" : "p-3"}>
        <div className={viewMode === "grid" ? "space-y-3" : "flex gap-3"}>
          {result.image && (
            <div
              className={
                viewMode === "grid"
                  ? "w-full h-48 rounded-lg overflow-hidden"
                  : "w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden"
              }
            >
              <img
                src={result.image}
                alt={result.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3
                  className={`font-semibold ${viewMode === "grid" ? "text-lg" : "text-base"} line-clamp-2`}
                >
                  {result.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                  {result.description}
                </p>
              </div>
              <Badge
                variant={result.type === "job" ? "default" : "outline"}
                className={`ml-2 text-xs ${result.type === "job" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
              >
                {result.type === "job" ? "💼 Job" : result.type}
              </Badge>
            </div>

            {result.author && (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={result.author.avatar} />
                  <AvatarFallback className="text-xs">
                    {result.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {result.author.name}
                </span>
                {result.author.verified && (
                  <Star className="w-4 h-4 text-blue-500 fill-current" />
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                {result.price && (
                  <span className="font-semibold text-green-600">
                    {formatPrice(result.price)}
                  </span>
                )}
                {result.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span>{result.rating}</span>
                  </div>
                )}
                {result.location && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{result.location}</span>
                  </div>
                )}
              </div>

              {result.stats && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {result.stats.views && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{formatNumber(result.stats.views)}</span>
                    </div>
                  )}
                  {result.stats.likes && (
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{formatNumber(result.stats.likes)}</span>
                    </div>
                  )}
                  {result.stats.comments && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{formatNumber(result.stats.comments)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {result.tags && result.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {result.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {result.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{result.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for anything..."
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {query && (
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Search results for "{query}"</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <div className="flex border rounded">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-r-none"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-l-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category
                </label>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        priceMin: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        priceMax: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Rating</label>
                <Select
                  value={filters.rating}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, rating: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any rating</SelectItem>
                    <SelectItem value="4">4+ stars</SelectItem>
                    <SelectItem value="4.5">4.5+ stars</SelectItem>
                    <SelectItem value="5">5 stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, sortBy: value }))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
                      }))
                    }
                  >
                    {filters.sortOrder === "desc" ? (
                      <SortDesc className="w-4 h-4" />
                    ) : (
                      <SortAsc className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {query && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            {searchTabs.map((tab) => {
              const Icon = tab.icon;
              const count = getResultsByType(tab.id).length;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {searchTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Searching...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {getResultsByType(tab.id).length > 0 ? (
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            : "space-y-4"
                        }
                      >
                        {getResultsByType(tab.id).map((result) => (
                          <ResultCard key={result.id} result={result} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">
                          No results found
                        </h3>
                        <p className="text-muted-foreground">
                          Try adjusting your search terms or filters
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* No query state */}
      {!query && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Search Eloity</h2>
          <p className="text-muted-foreground mb-6">
            Find users, products, services, jobs, videos, and more
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {searchTabs.slice(1).map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => {
                    setSearchQuery(tab.label.toLowerCase());
                    handleTabChange(tab.id);
                  }}
                >
                  <Icon className="w-6 h-6" />
                  <span>{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;

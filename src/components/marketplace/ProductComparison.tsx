import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Star,
  Check,
  X as XIcon,
  ShoppingCart,
  Share2,
  Download,
  Plus,
  Filter,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface ComparisonProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  seller: string;
  inStock: boolean;
  specifications: Record<string, string | number | boolean>;
  features: string[];
  warranty?: string;
  shippingTime?: string;
  returnPolicy?: string;
}

interface ComparisonSpec {
  name: string;
  category: "specs" | "features" | "details";
  products: Record<string, string | number | boolean | undefined>;
}

interface ProductComparisonProps {
  initialProducts?: ComparisonProduct[];
  onCompare?: (products: ComparisonProduct[]) => void;
  className?: string;
  maxProducts?: number;
}

/**
 * Product Comparison Tool
 * Allows customers to compare products side-by-side with detailed specifications,
 * features, pricing, and other important attributes
 */
export const ProductComparison: React.FC<ProductComparisonProps> = ({
  initialProducts = [],
  onCompare,
  className,
  maxProducts = 4,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState<ComparisonProduct[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "rating" | "newest">("price");
  const [filterCategory, setFilterCategory] = useState("all");
  const [expandedSpecs, setExpandedSpecs] = useState<Record<string, boolean>>({
    specs: true,
    features: true,
    details: true,
  });

  // Mock product database
  const availableProducts: ComparisonProduct[] = [
    {
      id: "prod-1",
      name: "Wireless Headphones Pro",
      price: 199.99,
      originalPrice: 249.99,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      rating: 4.5,
      reviewCount: 324,
      seller: "Tech Store",
      inStock: true,
      specifications: {
        "Battery Life": "40 hours",
        "Bluetooth Version": "5.3",
        "Noise Cancellation": "Active",
        "Frequency Response": "20Hz-20kHz",
        "Driver Size": "40mm",
        Weight: "250g",
      },
      features: [
        "Active Noise Cancellation",
        "Transparency Mode",
        "Multipoint Connection",
        "Fast Charging",
        "Built-in Microphone",
      ],
      warranty: "2 Years",
      shippingTime: "2-3 Days",
      returnPolicy: "30 Days",
    },
    {
      id: "prod-2",
      name: "Premium Wireless Earbuds",
      price: 129.99,
      originalPrice: 149.99,
      image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400",
      rating: 4.3,
      reviewCount: 512,
      seller: "Audio Pro",
      inStock: true,
      specifications: {
        "Battery Life": "8 hours (32 hours with case)",
        "Bluetooth Version": "5.2",
        "Noise Cancellation": "Passive",
        "Frequency Response": "20Hz-20kHz",
        "Driver Size": "8.2mm",
        Weight: "4.5g per earbud",
      },
      features: [
        "Touch Controls",
        "IPX5 Water Resistance",
        "Wireless Charging Case",
        "Voice Assistant Support",
        "Auto Pause on Remove",
      ],
      warranty: "1 Year",
      shippingTime: "1-2 Days",
      returnPolicy: "14 Days",
    },
    {
      id: "prod-3",
      name: "Studio Monitor Headphones",
      price: 349.99,
      image: "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=400",
      rating: 4.7,
      reviewCount: 189,
      seller: "Studio Equipment Co",
      inStock: false,
      specifications: {
        "Battery Life": "N/A (Wired)",
        "Bluetooth Version": "N/A",
        "Noise Cancellation": "None",
        "Frequency Response": "5Hz-40kHz",
        "Driver Size": "50mm",
        Weight: "320g",
      },
      features: [
        "Flat Frequency Response",
        "Foldable Design",
        "Replaceable Ear Pads",
        "Detachable Cable",
        "Professional Grade",
      ],
      warranty: "3 Years",
      shippingTime: "5-7 Days",
      returnPolicy: "60 Days",
    },
  ];

  const toggleProduct = (product: ComparisonProduct) => {
    setProducts((prev) => {
      const isAdded = prev.find((p) => p.id === product.id);
      if (isAdded) {
        return prev.filter((p) => p.id !== product.id);
      } else if (prev.length < maxProducts) {
        return [...prev, product];
      } else {
        toast({
          title: "Maximum products reached",
          description: `You can compare up to ${maxProducts} products`,
          variant: "destructive",
        });
        return prev;
      }
    });
  };

  const removeProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const exportComparison = () => {
    const csv = generateCSV();
    downloadCSV(csv, "product-comparison.csv");
    toast({
      title: "Exported",
      description: "Comparison has been exported as CSV",
    });
  };

  const generateCSV = (): string => {
    let csv = "Product Comparison\n\n";

    // Header row
    csv += "Attribute," + products.map((p) => p.name).join(",") + "\n";

    // Price
    csv +=
      "Price," + products.map((p) => `$${p.price.toFixed(2)}`).join(",") + "\n";

    // Rating
    csv +=
      "Rating," + products.map((p) => `${p.rating}/5 (${p.reviewCount} reviews)`).join(",") + "\n";

    // Specifications
    const allSpecs = new Set<string>();
    products.forEach((p) => {
      Object.keys(p.specifications).forEach((key) => allSpecs.add(key));
    });

    allSpecs.forEach((spec) => {
      csv +=
        spec +
        "," +
        products
          .map((p) => p.specifications[spec] || "N/A")
          .join(",") +
        "\n";
    });

    return csv;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
    );
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const shareComparison = () => {
    const productIds = products.map((p) => p.id).join(",");
    const shareUrl = `${window.location.origin}/marketplace/compare?products=${productIds}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Copied to clipboard",
      description: "Share link has been copied",
    });
  };

  const filteredProducts = availableProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filterCategory === "all" || p.seller === filterCategory)
  );

  // Aggregate all specification keys
  const allSpecKeys = new Map<string, ComparisonSpec>();
  products.forEach((product) => {
    // Add specifications
    Object.entries(product.specifications).forEach(([name, value]) => {
      if (!allSpecKeys.has(name)) {
        allSpecKeys.set(name, {
          name,
          category: "specs",
          products: {},
        });
      }
      allSpecKeys.get(name)!.products[product.id] = value;
    });

    // Add features
    if (!allSpecKeys.has("Features")) {
      allSpecKeys.set("Features", {
        name: "Features",
        category: "features",
        products: {},
      });
    }
    allSpecKeys.get("Features")!.products[product.id] = product.features.join(
      ", "
    );

    // Add warranty and other details
    if (product.warranty && !allSpecKeys.has("Warranty")) {
      allSpecKeys.set("Warranty", {
        name: "Warranty",
        category: "details",
        products: {},
      });
    }
    if (product.warranty) {
      allSpecKeys.get("Warranty")!.products[product.id] = product.warranty;
    }

    if (product.shippingTime && !allSpecKeys.has("Shipping Time")) {
      allSpecKeys.set("Shipping Time", {
        name: "Shipping Time",
        category: "details",
        products: {},
      });
    }
    if (product.shippingTime) {
      allSpecKeys
        .get("Shipping Time")!.products[product.id] = product.shippingTime;
    }

    if (product.returnPolicy && !allSpecKeys.has("Return Policy")) {
      allSpecKeys.set("Return Policy", {
        name: "Return Policy",
        category: "details",
        products: {},
      });
    }
    if (product.returnPolicy) {
      allSpecKeys.get("Return Policy")!.products[product.id] =
        product.returnPolicy;
    }
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Product Comparison</h2>

        {products.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={exportComparison}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={shareComparison}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Product Search Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Add Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Sort by Price</SelectItem>
                <SelectItem value="rating">Sort by Rating</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => {
                const isSelected = products.some((p) => p.id === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product)}
                    className={cn(
                      "w-full text-left p-3 border rounded-lg transition-colors",
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full aspect-square object-cover rounded mb-2"
                    />
                    <p className="font-medium text-sm line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-sm font-bold text-blue-600 mt-1">
                      ${product.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating} ({product.reviewCount})</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Comparison Table */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              Comparing {products.length} Product
              {products.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Plus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Add products to compare</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold min-w-40">
                        Product
                      </th>
                      {products.map((product) => (
                        <th key={product.id} className="text-center py-3 px-4 min-w-48">
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProduct(product.id)}
                              className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>

                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full aspect-square object-cover rounded mb-2"
                            />
                            <p className="font-medium line-clamp-2">
                              {product.name}
                            </p>
                            <p className="text-lg font-bold text-blue-600 mt-1">
                              ${product.price.toFixed(2)}
                            </p>
                            {product.originalPrice && (
                              <p className="text-xs text-gray-500 line-through">
                                ${product.originalPrice.toFixed(2)}
                              </p>
                            )}

                            <div className="flex items-center justify-center gap-1 mt-1 mb-3">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">
                                {product.rating} ({product.reviewCount})
                              </span>
                            </div>

                            <div className="space-y-2">
                              <Button
                                onClick={() =>
                                  navigate(`/marketplace/product/${product.id}`)
                                }
                                className="w-full h-8 text-xs"
                                variant="outline"
                              >
                                View Details
                              </Button>
                              <Button
                                onClick={() => {
                                  // Add to cart logic
                                  toast({
                                    title: "Added to cart",
                                    description: product.name,
                                  });
                                }}
                                disabled={!product.inStock}
                                className="w-full h-8 text-xs"
                              >
                                <ShoppingCart className="w-3 h-3 mr-1" />
                                {product.inStock ? "Add to Cart" : "Out of Stock"}
                              </Button>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Price Comparison */}
                    <tr className="border-b bg-blue-50">
                      <td className="py-3 px-4 font-semibold">Price</td>
                      {products.map((product) => (
                        <td key={product.id} className="text-center py-3 px-4">
                          <p className="text-lg font-bold text-blue-600">
                            ${product.price.toFixed(2)}
                          </p>
                        </td>
                      ))}
                    </tr>

                    {/* Stock Status */}
                    <tr className="border-b">
                      <td className="py-3 px-4 font-semibold">Availability</td>
                      {products.map((product) => (
                        <td key={product.id} className="text-center py-3 px-4">
                          <Badge
                            className={
                              product.inStock
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </td>
                      ))}
                    </tr>

                    {/* All Specifications */}
                    {Array.from(allSpecKeys.values()).map((spec) => (
                      <tr key={spec.name} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{spec.name}</td>
                        {products.map((product) => (
                          <td key={product.id} className="text-center py-3 px-4 text-xs">
                            {spec.products[product.id] ? (
                              <span>{String(spec.products[product.id])}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductComparison;

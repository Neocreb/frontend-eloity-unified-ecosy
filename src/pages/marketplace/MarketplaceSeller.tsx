import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Store, MapPin, Star, Calendar, AlertCircle, Check, ChevronLeft } from "lucide-react";
import { useMarketplace } from "@/contexts/MarketplaceContext";
import ProductCard from "@/components/marketplace/ProductCard";
import { useToast } from "@/components/ui/use-toast";
import { SellerProfile } from "@/types/marketplace";
import { useAuth } from "@/contexts/AuthContext";
import MarketplaceBreadcrumb from "@/components/marketplace/MarketplaceBreadcrumb";

const MarketplaceSeller = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    sellers, 
    getSellerProducts, 
    addToCart, 
    addToWishlist, 
    setActiveProduct,
    messageUser,
    setActiveSeller
  } = useMarketplace();
  const { isAuthenticated } = useAuth();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  
  useEffect(() => {
    // Find seller by username
    const foundSeller = sellers.find(s => s.username.toLowerCase() === username?.toLowerCase());
    
    if (foundSeller) {
      setSeller(foundSeller);
      setActiveSeller(foundSeller);
      setSellerProducts(getSellerProducts(foundSeller.id));
    } else {
      // Seller not found
      toast({
        title: "Seller Not Found",
        description: "The seller you're looking for doesn't exist",
        variant: "destructive"
      });
      navigate('/marketplace');
    }
  }, [username, sellers, getSellerProducts]);
  
  const handleAddToCart = (productId: string) => {
    addToCart(productId);
  };
  
  const handleAddToWishlist = (productId: string) => {
    addToWishlist(productId);
  };
  
  const handleViewProduct = (product: any) => {
    setActiveProduct(product);
    // TODO: Navigate to product detail page once created
    // navigate(`/marketplace/product/${product.id}`);
  };
  
  const handleContactSeller = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    if (seller) {
      messageUser(seller.id, `Hello ${seller.name}, I'm interested in your products`);
      navigate('/chat');
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };
  
  if (!seller) {
    return (
      <div className="container py-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading seller profile...</p>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <MarketplaceBreadcrumb
        items={[
          { label: "Marketplace", href: "/app/marketplace" },
          { label: `Store: ${seller.name}` }
        ]}
      />

      <Button variant="ghost" className="mb-4 mt-4" onClick={() => navigate('/app/marketplace')}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Marketplace
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-24 w-24 rounded-full overflow-hidden mb-4">
                  <img 
                    src={seller.avatar} 
                    alt={seller.name}
                    className="w-full h-full object-cover" 
                  />
                </div>
                
                <h1 className="text-xl font-bold flex items-center gap-1">
                  {seller.name}
                  {seller.isVerified && (
                    <Badge variant="outline" className="bg-blue-500 p-0 ml-1">
                      <Check className="h-3 w-3 text-white" />
                    </Badge>
                  )}
                </h1>
                
                <p className="text-muted-foreground">@{seller.username}</p>
                
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="ml-1">{seller.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground ml-1">({seller.reviewCount} reviews)</span>
                </div>
              </div>
              
              <Button 
                className="w-full flex items-center gap-2"
                onClick={handleContactSeller}
              >
                <MessageCircle className="h-4 w-4" />
                Contact Seller
              </Button>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Store className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{seller.productCount} Products</span>
                    <p className="text-sm text-muted-foreground">Total listings</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Joined {formatDate(seller.joinedDate)}</span>
                    <p className="text-sm text-muted-foreground">Member for 2 years</p>
                  </div>
                </div>
                
                {seller.salesCount && (
                  <div className="flex items-start gap-2">
                    <Store className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{seller.salesCount}+ Sales</span>
                      <p className="text-sm text-muted-foreground">Completed orders</p>
                    </div>
                  </div>
                )}
              </div>
              
              {seller.bio && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">About</h3>
                    <p className="text-sm text-muted-foreground">{seller.bio}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="products">
                <TabsList>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="products" className="mt-6">
                  {sellerProducts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-md">
                      <Store className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium">No Products Listed</h3>
                      <p className="text-muted-foreground">
                        This seller has no products listed at the moment.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sellerProducts.map(product => (
                        <ProductCard 
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                          onAddToWishlist={handleAddToWishlist}
                          onViewProduct={handleViewProduct}
                          sponsored={product.isSponsored}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-6">
                  <div className="text-center py-12 bg-gray-50 rounded-md">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium">No Reviews Yet</h3>
                    <p className="text-muted-foreground">
                      Be the first to leave a review for this seller.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceSeller;

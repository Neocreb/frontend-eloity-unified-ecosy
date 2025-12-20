import React, { useState, useEffect } from "react";
import {
  Heart,
  Share2,
  Bell,
  Trash2,
  Plus,
  Folder,
  AlertCircle,
  Copy,
  Check,
  DollarSign,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { wishlistService, WishlistCollection, PriceAlert, BackInStockAlert } from "@/services/wishlistService";
import ProductCard from "@/components/marketplace/ProductCard";
import type { WishlistItem } from "@/types/enhanced-marketplace";

const EnhancedWishlist: React.FC = () => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [collections, setCollections] = useState<WishlistCollection[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [backInStockAlerts, setBackInStockAlerts] = useState<BackInStockAlert[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New collection dialog
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  // Price alert dialog
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [selectedProductForAlert, setSelectedProductForAlert] = useState<string | null>(null);
  const [alertPrice, setAlertPrice] = useState("");

  // Share collection dialog
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadWishlistData();
    }
  }, [user?.id]);

  const loadWishlistData = async () => {
    try {
      setLoading(true);
      const [items, cols, alerts, backAlerts] = await Promise.all([
        wishlistService.getUserWishlist(user!.id),
        wishlistService.getUserCollections(user!.id),
        wishlistService.getUserPriceAlerts(user!.id),
        wishlistService.getUserBackInStockAlerts(user!.id),
      ]);

      setWishlistItems(items);
      setCollections(cols);
      setPriceAlerts(alerts);
      setBackInStockAlerts(backAlerts);
    } catch (error) {
      console.error("Error loading wishlist data:", error);
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error("Collection name is required");
      return;
    }

    try {
      const collection = await wishlistService.createCollection(
        user!.id,
        newCollectionName,
        newCollectionDesc,
        isPublic
      );

      if (collection) {
        setCollections([collection, ...collections]);
        setNewCollectionName("");
        setNewCollectionDesc("");
        setIsPublic(false);
        setShowNewCollection(false);
        toast.success("Collection created!");
      }
    } catch (error) {
      toast.error("Failed to create collection");
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!window.confirm("Delete this collection?")) return;

    try {
      const success = await wishlistService.deleteCollection(collectionId);
      if (success) {
        setCollections(collections.filter(c => c.id !== collectionId));
        toast.success("Collection deleted");
      }
    } catch (error) {
      toast.error("Failed to delete collection");
    }
  };

  const handleCreatePriceAlert = async (productId: string) => {
    if (!alertPrice || isNaN(parseFloat(alertPrice))) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      const product = wishlistItems.find(w => w.productId === productId);
      const alert = await wishlistService.createPriceAlert(
        user!.id,
        productId,
        parseFloat(alertPrice),
        product?.product?.price || 0
      );

      if (alert) {
        setPriceAlerts([alert, ...priceAlerts]);
        setShowPriceAlert(false);
        setSelectedProductForAlert(null);
        setAlertPrice("");
        toast.success("Price alert created!");
      }
    } catch (error) {
      toast.error("Failed to create price alert");
    }
  };

  const handleCreateBackInStockAlert = async (productId: string) => {
    try {
      const alert = await wishlistService.createBackInStockAlert(
        user!.id,
        productId
      );

      if (alert) {
        setBackInStockAlerts([alert, ...backInStockAlerts]);
        toast.success("Back-in-stock alert created!");
      } else {
        toast.info("You already have an alert for this product");
      }
    } catch (error) {
      toast.error("Failed to create alert");
    }
  };

  const handleDeletePriceAlert = async (alertId: string) => {
    try {
      const success = await wishlistService.deletePriceAlert(alertId);
      if (success) {
        setPriceAlerts(priceAlerts.filter(a => a.id !== alertId));
        toast.success("Alert deleted");
      }
    } catch (error) {
      toast.error("Failed to delete alert");
    }
  };

  const handleDeleteBackInStockAlert = async (alertId: string) => {
    try {
      const success = await wishlistService.deleteBackInStockAlert(alertId);
      if (success) {
        setBackInStockAlerts(backInStockAlerts.filter(a => a.id !== alertId));
        toast.success("Alert deleted");
      }
    } catch (error) {
      toast.error("Failed to delete alert");
    }
  };

  const handleShareCollection = async (collectionId: string) => {
    if (!shareEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    try {
      const share = await wishlistService.shareCollection(collectionId, shareEmail);
      if (share) {
        toast.success("Collection shared!");
        setShowShareDialog(false);
        setShareEmail("");
      }
    } catch (error) {
      toast.error("Failed to share collection");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view your wishlist</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="h-8 w-8 fill-red-500 text-red-500" />
              My Wishlist
            </h1>
            <p className="text-muted-foreground mt-2">
              {wishlistItems.length} items • {collections.length} collections
            </p>
          </div>

          <Dialog open={showNewCollection} onOpenChange={setShowNewCollection}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Collection</DialogTitle>
                <DialogDescription>
                  Organize your wishlist items into collections
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Collection Name</Label>
                  <Input
                    placeholder="e.g., Dream Gadgets"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="Describe this collection..."
                    value={newCollectionDesc}
                    onChange={(e) => setNewCollectionDesc(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="public"
                    checked={isPublic}
                    onCheckedChange={(checked) => setIsPublic(!!checked)}
                  />
                  <Label htmlFor="public" className="font-normal cursor-pointer">
                    Make this collection public (others can view)
                  </Label>
                </div>

                <Button
                  onClick={handleCreateCollection}
                  className="w-full"
                >
                  Create Collection
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="items" className="space-y-6">
          <TabsList>
            <TabsTrigger value="items">
              Items ({wishlistItems.length})
            </TabsTrigger>
            <TabsTrigger value="collections">
              Collections ({collections.length})
            </TabsTrigger>
            <TabsTrigger value="alerts">
              Price Alerts ({priceAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="stock">
              Back in Stock ({backInStockAlerts.length})
            </TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
                <p className="text-muted-foreground">
                  Start adding items to save them for later
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistItems.map((item) => (
                  <div key={item.id} className="group relative">
                    <ProductCard product={item.product!} />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Dialog open={showPriceAlert && selectedProductForAlert === item.productId} onOpenChange={setShowPriceAlert}>
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={() => setSelectedProductForAlert(item.productId)}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Price Alert</DialogTitle>
                            <DialogDescription>
                              Get notified when {item.product?.name} drops below your target price
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <Label>Current Price: ${item.product?.price}</Label>
                            </div>
                            <div>
                              <Label>Target Price</Label>
                              <Input
                                type="number"
                                placeholder="Enter price"
                                value={alertPrice}
                                onChange={(e) => setAlertPrice(e.target.value)}
                              />
                            </div>

                            <Button
                              onClick={() => handleCreatePriceAlert(item.productId)}
                              className="w-full"
                            >
                              Create Alert
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => handleCreateBackInStockAlert(item.productId)}
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections">
            {collections.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create collections to organize your wishlist
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map((collection) => (
                  <div key={collection.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold">{collection.name}</h3>
                        {collection.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {collection.description}
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteCollection(collection.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      {collection.isPublic && (
                        <Badge variant="outline">Public</Badge>
                      )}
                      <Badge variant="secondary">
                        0 items
                      </Badge>
                    </div>

                    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Share Collection</DialogTitle>
                          <DialogDescription>
                            Share "{collection.name}" with others
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div>
                            <Label>Email Address</Label>
                            <Input
                              placeholder="recipient@example.com"
                              value={shareEmail}
                              onChange={(e) => setShareEmail(e.target.value)}
                            />
                          </div>

                          <Button
                            onClick={() => handleShareCollection(collection.id)}
                            className="w-full"
                          >
                            Share Collection
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Price Alerts Tab */}
          <TabsContent value="alerts">
            {priceAlerts.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No price alerts</h3>
                <p className="text-muted-foreground">
                  Get notified when prices drop on your wishlist items
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {priceAlerts.map((alert) => {
                  const product = wishlistItems.find(
                    (w) => w.productId === alert.productId
                  )?.product;

                  return (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{product?.name || "Product"}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: ${alert.currentPrice} → Target: ${alert.targetPrice}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePriceAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Back in Stock Alerts Tab */}
          <TabsContent value="stock">
            {backInStockAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No stock alerts</h3>
                <p className="text-muted-foreground">
                  Get notified when out-of-stock items are available again
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {backInStockAlerts.map((alert) => {
                  const product = wishlistItems.find(
                    (w) => w.productId === alert.productId
                  )?.product;

                  return (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{product?.name || "Product"}</p>
                        <p className="text-sm text-muted-foreground">
                          Alert created {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteBackInStockAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedWishlist;

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Plus,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  sellerAnalyticsService,
  InventoryAlert as InventoryAlertType,
} from "@/services/sellerAnalyticsService";
import { MarketplaceService } from "@/services/marketplaceService";

interface InventoryAlertsProps {
  sellerId: string;
}

const InventoryAlerts: React.FC<InventoryAlertsProps> = ({ sellerId }) => {
  const [alerts, setAlerts] = useState<InventoryAlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Form state for creating new alert
  const [selectedProduct, setSelectedProduct] = useState("");
  const [alertType, setAlertType] = useState<
    "low_stock" | "out_of_stock" | "overstock"
  >("low_stock");
  const [thresholdValue, setThresholdValue] = useState("");
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [sellerId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await sellerAnalyticsService.getInventoryAlerts(
        sellerId,
        true
      );
      setAlerts(data);
    } catch (error) {
      console.error("Error loading inventory alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const loadSellerProducts = async () => {
    try {
      setLoadingProducts(true);
      const products = await MarketplaceService.getProducts({
        sellerId,
        limit: 100,
      });
      setSellerProducts(products);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!selectedProduct || !thresholdValue) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const currentStock =
        sellerProducts.find((p) => p.id === selectedProduct)?.stockQuantity || 0;

      const success = await sellerAnalyticsService.setInventoryAlert(
        sellerId,
        selectedProduct,
        alertType,
        currentStock,
        parseInt(thresholdValue)
      );

      if (success) {
        toast.success("Alert created successfully");
        setShowDialog(false);
        setSelectedProduct("");
        setThresholdValue("");
        await loadAlerts();
      }
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Failed to create alert");
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      const success = await sellerAnalyticsService.dismissInventoryAlert(
        alertId
      );
      if (success) {
        toast.success("Alert dismissed");
        await loadAlerts();
      }
    } catch (error) {
      console.error("Error dismissing alert:", error);
      toast.error("Failed to dismiss alert");
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadAlerts();
      toast.success("Alerts refreshed");
    } catch (error) {
      toast.error("Failed to refresh alerts");
    } finally {
      setRefreshing(false);
    }
  };

  const getAlertSeverity = (alert: InventoryAlertType) => {
    if (alert.alertType === "out_of_stock") {
      return {
        color: "text-red-600",
        bgColor: "bg-red-50 border-red-200",
        badge: "destructive",
        icon: AlertTriangle,
      };
    }
    if (alert.alertType === "low_stock") {
      return {
        color: "text-orange-600",
        bgColor: "bg-orange-50 border-orange-200",
        badge: "secondary",
        icon: AlertCircle,
      };
    }
    return {
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 border-yellow-200",
      badge: "outline",
      icon: AlertCircle,
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Alerts</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Inventory Alerts</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {alerts.length} active alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => loadSellerProducts()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Inventory Alert</DialogTitle>
                <DialogDescription>
                  Set up alerts for low stock, out of stock, or overstock
                  situations
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Select Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger disabled={loadingProducts}>
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellerProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} (Stock: {product.stockQuantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Alert Type</Label>
                  <Select
                    value={alertType}
                    onValueChange={(value: any) => setAlertType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low_stock">
                        Low Stock (Threshold)
                      </SelectItem>
                      <SelectItem value="out_of_stock">
                        Out of Stock
                      </SelectItem>
                      <SelectItem value="overstock">Overstock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Threshold Value</Label>
                  <Input
                    type="number"
                    placeholder="Enter threshold (e.g., 10)"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(e.target.value)}
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Alert will trigger when stock reaches this level
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateAlert} className="flex-1">
                    Create Alert
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {alerts.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No active alerts. Your inventory is healthy!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const severity = getAlertSeverity(alert);
              const SeverityIcon = severity.icon;

              return (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${severity.bgColor}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <SeverityIcon className={`h-5 w-5 ${severity.color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">
                            {alert.productName}
                          </p>
                          <Badge
                            variant={severity.badge as any}
                            className="text-xs"
                          >
                            {alert.alertType.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Current Stock: {alert.currentStock} | Threshold:{" "}
                          {alert.thresholdValue}
                        </p>
                        {alert.lastNotifiedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last notified:{" "}
                            {new Date(alert.lastNotifiedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleDismissAlert(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryAlerts;

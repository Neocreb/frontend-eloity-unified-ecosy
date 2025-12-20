import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  Package,
  RefreshCw,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sellerAnalyticsService, InventoryAlert } from "@/services/sellerAnalyticsService";
import { useToast } from "@/components/ui/use-toast";

interface InventoryAlertsProps {
  sellerId: string;
  onRefresh?: () => void;
}

export const InventoryAlerts: React.FC<InventoryAlertsProps> = ({ sellerId, onRefresh }) => {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [reorderLevel, setReorderLevel] = useState(10);
  const { toast } = useToast();

  useEffect(() => {
    loadInventoryAlerts();
  }, [sellerId, reorderLevel]);

  const loadInventoryAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await sellerAnalyticsService.getInventoryAlerts(sellerId, reorderLevel);
      setAlerts(data);
    } catch (error) {
      console.error("Error loading inventory alerts:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory alerts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStock = async (productId: string, newQuantity: number) => {
    try {
      // TODO: Implement stock update API call
      toast({
        title: "Success",
        description: "Stock quantity updated",
      });
      loadInventoryAlerts();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "Failed to update stock quantity",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "out_of_stock":
        return "bg-red-100 text-red-800";
      case "low_stock":
        return "bg-yellow-100 text-yellow-800";
      case "in_stock":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "out_of_stock":
        return <AlertTriangle className="w-4 h-4" />;
      case "low_stock":
        return <AlertCircle className="w-4 h-4" />;
      case "in_stock":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const outOfStockCount = alerts.filter((a) => a.status === "out_of_stock").length;
  const lowStockCount = alerts.filter((a) => a.status === "low_stock").length;
  const totalAlerts = alerts.length;

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-3xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-3xl font-bold text-yellow-600">{lowStockCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-3xl font-bold text-orange-600">{totalAlerts}</p>
              </div>
              <Package className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Alert Settings</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadInventoryAlerts}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                Reorder Level (minimum stock)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(Math.max(1, parseInt(e.target.value) || 1))}
                  className="px-3 py-2 border border-gray-300 rounded-md w-24"
                  min="1"
                />
                <span className="text-sm text-gray-600">
                  Products with less than {reorderLevel} units will trigger an alert
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Alerts ({alerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No inventory alerts</p>
              <p className="text-sm text-gray-500">All your products are well stocked</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.productId}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  {/* Main Alert Row */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() =>
                      setExpandedProductId(
                        expandedProductId === alert.productId ? null : alert.productId
                      )
                    }
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${getStatusColor(
                          alert.status
                        ).replace("text-", "bg-").replace(" ", "")}`}
                      >
                        {getStatusIcon(alert.status)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{alert.productName}</h3>
                        <p className="text-sm text-gray-600">
                          Current: <span className="font-medium">{alert.currentStock}</span> units
                        </p>
                      </div>
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status === "out_of_stock"
                          ? "Out of Stock"
                          : alert.status === "low_stock"
                            ? "Low Stock"
                            : "In Stock"}
                      </Badge>
                    </div>
                    <div className="text-gray-400 ml-2">
                      {expandedProductId === alert.productId ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedProductId === alert.productId && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Reorder Level</p>
                          <p className="text-lg font-semibold">{alert.reorderLevel} units</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Current Stock</p>
                          <p className="text-lg font-semibold">{alert.currentStock} units</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Stock Status</p>
                          <div className="mt-1 flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  alert.status === "out_of_stock"
                                    ? "#dc2626"
                                    : alert.status === "low_stock"
                                      ? "#eab308"
                                      : "#16a34a",
                              }}
                            />
                            <span className="font-medium">
                              {alert.status === "out_of_stock"
                                ? "Out of Stock"
                                : alert.status === "low_stock"
                                  ? "Low Stock"
                                  : "In Stock"}
                            </span>
                          </div>
                        </div>
                        {alert.lastRestocked && (
                          <div>
                            <p className="text-sm text-gray-600">Last Restocked</p>
                            <p className="text-sm">
                              {new Date(alert.lastRestocked).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            // Open update stock dialog
                            const newQuantity = prompt("Enter new stock quantity:");
                            if (newQuantity) {
                              handleUpdateStock(alert.productId, parseInt(newQuantity));
                            }
                          }}
                        >
                          <RefreshCw className="w-4 h-4" />
                          Update Stock
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            // View product
                            window.open(`/marketplace/product/${alert.productId}`, "_blank");
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          View Product
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-2 text-red-600 hover:text-red-700"
                          onClick={() => {
                            // Delete product
                            if (
                              confirm(
                                `Are you sure you want to delete "${alert.productName}"?`
                              )
                            ) {
                              toast({
                                title: "Success",
                                description: "Product deleted",
                              });
                              loadInventoryAlerts();
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Stock Management Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Monitor low stock alerts daily to avoid stockouts</li>
            <li>Set reorder level based on your average daily sales</li>
            <li>Keep popular items in higher quantities</li>
            <li>Update stock immediately after restocking</li>
            <li>Consider automated inventory sync from your warehouse</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryAlerts;

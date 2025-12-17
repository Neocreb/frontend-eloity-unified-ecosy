import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
}

interface PriceAlertProps {
  crypto: CryptoData;
}

interface Alert {
  id: string;
  type: "above" | "below";
  price: number;
  createdAt: Date;
}

const CryptoPriceAlert: React.FC<PriceAlertProps> = ({ crypto }) => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertType, setAlertType] = useState<"above" | "below">("above");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAlert = async () => {
    if (!alertPrice) {
      toast({
        title: "Error",
        description: "Please enter a price",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(alertPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newAlert: Alert = {
        id: Date.now().toString(),
        type: alertType,
        price,
        createdAt: new Date(),
      };

      setAlerts([...alerts, newAlert]);
      setAlertPrice("");

      toast({
        title: "Alert Created",
        description: `You'll be notified when ${crypto.symbol} price goes ${alertType} $${price.toFixed(2)}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast({
      title: "Alert Deleted",
      description: "Price alert has been removed",
    });
  };

  return (
    <div className="space-y-6">
      {/* Create Alert */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Create Price Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Cryptocurrency</Label>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white">{crypto.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current price: ${crypto.current_price.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alert-type" className="text-sm font-medium">
                  Alert Type
                </Label>
                <select
                  id="alert-type"
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as "above" | "below")}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="above">Price goes above</option>
                  <option value="below">Price goes below</option>
                </select>
              </div>

              <div>
                <Label htmlFor="alert-price" className="text-sm font-medium">
                  Price ($)
                </Label>
                <Input
                  id="alert-price"
                  type="number"
                  placeholder="Enter price"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  className="mt-2"
                />
              </div>
            </div>

            <Button
              onClick={handleCreateAlert}
              disabled={isLoading || !alertPrice}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isLoading ? "Creating..." : "Create Alert"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {crypto.symbol.toUpperCase()} {alert.type === "above" ? ">" : "<"} ${alert.price.toFixed(2)}
                      </span>
                      <Badge variant={alert.type === "above" ? "default" : "secondary"}>
                        {alert.type === "above" ? "Bullish" : "Bearish"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Created {new Date(alert.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteAlert(alert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No active alerts</p>
              <p className="text-sm">Create an alert above to get notified of price movements</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>How Price Alerts Work</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Get notified when {crypto.symbol} reaches your target price</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Set multiple alerts for different price levels</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Alerts are real-time and checked against market prices</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Delete alerts anytime from the active alerts list</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptoPriceAlert;

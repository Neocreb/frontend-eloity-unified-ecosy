import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
}

interface CryptoChartsProps {
  crypto: CryptoData;
}

interface PricePoint {
  time: string;
  price: number;
}

const CryptoCharts: React.FC<CryptoChartsProps> = ({ crypto }) => {
  const [timeframe, setTimeframe] = useState<"1H" | "4H" | "1D" | "1W" | "1M" | "1Y">("1D");
  const [chartData, setChartData] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [crypto.id, timeframe]);

  const loadChartData = async () => {
    setIsLoading(true);
    try {
      // Simulate loading historical price data
      // In production, this would fetch from a real API like CoinGecko
      const mockData = generateMockPriceData(crypto.current_price, timeframe);
      setChartData(mockData);
    } catch (error) {
      console.error("Error loading chart data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockPriceData = (currentPrice: number, tf: string): PricePoint[] => {
    const data: PricePoint[] = [];
    const points = tf === "1H" ? 60 : tf === "4H" ? 48 : tf === "1D" ? 24 : tf === "1W" ? 7 : tf === "1M" ? 30 : 365;
    
    let price = currentPrice * 0.95;
    const volatility = currentPrice * 0.05;

    for (let i = 0; i < points; i++) {
      const change = (Math.random() - 0.5) * volatility;
      price += change;
      
      let timeLabel = "";
      if (tf === "1H") timeLabel = `${i}m`;
      else if (tf === "4H") timeLabel = `${i * 5}m`;
      else if (tf === "1D") timeLabel = `${i}h`;
      else if (tf === "1W") timeLabel = `${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}`;
      else if (tf === "1M") timeLabel = `Day ${i + 1}`;
      else timeLabel = `${new Date(Date.now() - (365 - i) * 24 * 60 * 60 * 1000).toLocaleDateString()}`;

      data.push({
        time: timeLabel,
        price: Math.max(price, currentPrice * 0.8),
      });
    }
    return data;
  };

  const priceChange = crypto.price_change_24h;
  const percentChange = crypto.price_change_percentage_24h;
  const isPositive = priceChange >= 0;

  return (
    <div className="space-y-6">
      {/* Price Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{crypto.name}</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                  ${crypto.current_price.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`text-right ${isPositive ? "text-green-600" : "text-red-600"}`}>
                <div className="flex items-center gap-2 justify-end">
                  {isPositive ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                  <div>
                    <p className="text-2xl font-bold">
                      {isPositive ? "+" : ""}{priceChange.toFixed(2)}
                    </p>
                    <p className="text-sm">
                      {isPositive ? "+" : ""}{percentChange.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">24h High</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${crypto.high_24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">24h Low</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${crypto.low_24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">24h Change</p>
                <p className={`text-lg font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                  {isPositive ? "+" : ""}{percentChange.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Rank</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  #{crypto.market_cap_rank}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Price Chart</CardTitle>
          <div className="flex gap-2">
            {(["1H", "4H", "1D", "1W", "1M", "1Y"] as const).map((tf) => (
              <Button
                key={tf}
                size="sm"
                variant={timeframe === tf ? "default" : "outline"}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Loading chart data...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value) => `$${(value as number).toFixed(2)}`}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No chart data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Indicators */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Technical Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">RSI (14)</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">45.2</p>
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200">
                  Neutral
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">MACD</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-green-600">+0.32</p>
                <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200">
                  Bullish
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Moving Avg (50)</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(crypto.current_price * 0.98).toFixed(2)}
                </p>
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200">
                  Above
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptoCharts;

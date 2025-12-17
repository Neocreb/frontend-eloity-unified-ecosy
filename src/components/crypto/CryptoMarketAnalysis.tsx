import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Zap } from "lucide-react";

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
}

interface MarketAnalysisProps {
  crypto: CryptoData;
}

const CryptoMarketAnalysis: React.FC<MarketAnalysisProps> = ({ crypto }) => {
  const isPositive = crypto.price_change_percentage_24h >= 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Market Cap</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(crypto.market_cap / 1e9).toFixed(2)}B
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Billion USD</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">24h Volume</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(crypto.total_volume / 1e9).toFixed(2)}B
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Trading Volume</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Vol/MCap Ratio</p>
            <p className={`text-2xl font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {((crypto.total_volume / crypto.market_cap) * 100).toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Liquidity Ratio</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Volatility (24h)</p>
            <p className={`text-2xl font-bold ${isPositive ? "text-green-600" : "text-orange-600"}`}>
              {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Price Movement</p>
          </CardContent>
        </Card>
      </div>

      {/* Market Sentiment */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Sentiment</span>
                <Badge className={isPositive ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"}>
                  {isPositive ? "Bullish" : "Bearish"}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${isPositive ? "bg-green-600" : "bg-red-600"}`}
                  style={{ width: `${50 + (isPositive ? 20 : -20)}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Social Volume</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">High</p>
                <p className="text-xs text-green-600 dark:text-green-400">↑ +45%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Developer Activity</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Active</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Sustained</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">News Sentiment</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Positive</p>
                <p className="text-xs text-green-600 dark:text-green-400">70%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Overview */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Technical Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Price Strength</span>
              <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Strong</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Momentum</span>
              <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">Neutral</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Volume Trend</span>
              <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Increasing</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Support Level</span>
              <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                ${(crypto.current_price * 0.95).toFixed(2)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Insights */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Market Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>{crypto.name} has shown strong momentum over the past 24 hours</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Trading volume is {((crypto.total_volume / crypto.market_cap) * 100).toFixed(1)}% of market cap - indicating healthy liquidity</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Technical indicators suggest potential for continued growth</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Monitor key support and resistance levels for entry/exit opportunities</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptoMarketAnalysis;

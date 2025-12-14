import React, { useState } from 'react';
import { useBybitPrice, useBybitOrderbook } from '../../hooks/use-bybit';
import { ArrowUpRight, ArrowDownRight, RefreshCw, TrendingUp } from 'lucide-react';

interface BybitPriceDisplayProps {
  symbol?: string;
  showOrderbook?: boolean;
  refreshInterval?: number;
  className?: string;
}

export function BybitPriceDisplay({
  symbol = 'BTCUSDT',
  showOrderbook = true,
  refreshInterval = 5000,
  className = ''
}: BybitPriceDisplayProps) {
  const { price, loading, error } = useBybitPrice({
    symbol,
    interval: refreshInterval,
    enabled: true
  });

  const { orderbook, loading: orderbookLoading } = useBybitOrderbook({
    symbol,
    limit: 10,
    interval: refreshInterval,
    enabled: showOrderbook
  });

  const isPositive = price && price.change24h >= 0;
  const displaySymbol = symbol.replace('USDT', '');

  if (error && !price) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600 text-sm font-medium">Failed to load Bybit data</p>
        <p className="text-red-500 text-xs mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Price Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900">
              {displaySymbol}
            </h3>
            <span className="text-sm font-medium text-gray-500">via Bybit</span>
          </div>
          {loading && (
            <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>

        {price ? (
          <div className="space-y-4">
            {/* Current Price */}
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Current Price</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900">
                  ${price.price.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>

            {/* 24h Change */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600 text-xs font-medium mb-1">24h Change</p>
                <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span className="font-semibold">
                    {isPositive ? '+' : ''}
                    {price.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* 24h High */}
              <div>
                <p className="text-gray-600 text-xs font-medium mb-1">24h High</p>
                <p className="font-semibold text-gray-900">
                  ${price.high24h.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>

              {/* 24h Low */}
              <div>
                <p className="text-gray-600 text-xs font-medium mb-1">24h Low</p>
                <p className="font-semibold text-gray-900">
                  ${price.low24h.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
            </div>

            {/* 24h Volume */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-gray-600 text-xs font-medium mb-1">24h Volume</p>
              <p className="font-semibold text-gray-900">
                {(price.volume24h / 1000000).toFixed(2)}M USDT
              </p>
            </div>

            {/* Last Updated */}
            <p className="text-gray-500 text-xs pt-2">
              Last updated: {new Date(price.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="inline-block">
                <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
              <p className="text-gray-500 text-sm mt-2">Loading price data...</p>
            </div>
          </div>
        )}
      </div>

      {/* Orderbook Section */}
      {showOrderbook && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Order Book
            </h3>
            {orderbookLoading && (
              <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>

          {orderbook ? (
            <div className="grid grid-cols-2 gap-6">
              {/* Asks (Sell Orders) */}
              <div>
                <h4 className="text-sm font-semibold text-red-600 mb-3">Asks (Sell)</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {orderbook.asks.slice(0, 10).reverse().map((ask, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-red-50 p-2 rounded">
                      <span className="font-medium text-red-700">
                        ${ask.price.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                      <span className="text-red-600">
                        {ask.quantity.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bids (Buy Orders) */}
              <div>
                <h4 className="text-sm font-semibold text-green-600 mb-3">Bids (Buy)</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {orderbook.bids.slice(0, 10).map((bid, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-green-50 p-2 rounded">
                      <span className="font-medium text-green-700">
                        ${bid.price.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                      <span className="text-green-600">
                        {bid.quantity.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-500 text-sm">Loading orderbook...</p>
            </div>
          )}
        </div>
      )}

      {/* Info Badge */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-blue-900 text-xs font-medium">
          💡 This component displays real-time data from Bybit API. Data updates every {refreshInterval / 1000} seconds.
        </p>
      </div>
    </div>
  );
}

export default BybitPriceDisplay;

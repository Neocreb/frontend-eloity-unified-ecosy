import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Newspaper } from "lucide-react";

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
}

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  category: "news" | "announcement" | "analysis" | "market";
  source: string;
  publishedAt: Date;
  link?: string;
  sentiment: "positive" | "neutral" | "negative";
}

interface CryptoNewsFeedProps {
  crypto: CryptoData;
}

const CryptoNewsFeed: React.FC<CryptoNewsFeedProps> = ({ crypto }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([
    {
      id: "1",
      title: `${crypto.name} Price Surge Driven by Institutional Interest`,
      description: "Major institutional investors show increased interest in cryptocurrency. Market analysts expect continued growth.",
      category: "news",
      source: "Crypto News Daily",
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      link: "#",
      sentiment: "positive",
    },
    {
      id: "2",
      title: `Technical Analysis: ${crypto.symbol} Trading Patterns`,
      description: "Breaking down the latest trading patterns and price movements in the market.",
      category: "analysis",
      source: "Trading Insights",
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      link: "#",
      sentiment: "neutral",
    },
    {
      id: "3",
      title: `New Regulatory Framework for ${crypto.name}`,
      description: "Governments worldwide are implementing new regulations that could affect crypto markets.",
      category: "announcement",
      source: "Blockchain News",
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      link: "#",
      sentiment: "neutral",
    },
    {
      id: "4",
      title: "Market Update: Cryptos Continue Recovery",
      description: "Recovery continues as the cryptocurrency market shows signs of stabilization after recent volatility.",
      category: "market",
      source: "Market Watch",
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      link: "#",
      sentiment: "positive",
    },
  ]);

  const [activeFilter, setActiveFilter] = useState<"all" | NewsArticle["category"]>("all");

  const filteredArticles = activeFilter === "all"
    ? articles
    : articles.filter(article => article.category === activeFilter);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "news":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      case "announcement":
        return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200";
      case "analysis":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "market":
        return "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 dark:text-green-400";
      case "negative":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* News Filters */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            {(["all", "news", "announcement", "analysis", "market"] as const).map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={activeFilter === filter ? "default" : "outline"}
                onClick={() => setActiveFilter(filter)}
                className="capitalize"
              >
                {filter}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* News Feed */}
      <div className="space-y-4">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <Card
              key={article.id}
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCategoryColor(article.category)}>
                          {article.category}
                        </Badge>
                        <span className={`text-xs font-medium ${getSentimentColor(article.sentiment)}`}>
                          {article.sentiment === "positive" ? "🟢" : article.sentiment === "negative" ? "🔴" : "⚪"} {article.sentiment}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">
                        {article.title}
                      </h3>
                    </div>
                    <Newspaper className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {article.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <p className="font-medium">{article.source}</p>
                      <p>{formatTimeAgo(article.publishedAt)}</p>
                    </div>
                    {article.link && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => article.link && window.open(article.link, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Read More
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <Newspaper className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 dark:text-gray-400">No articles found for this category</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Subscribe Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Stay Updated</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
            Subscribe to get the latest news and analysis about {crypto.name}
          </p>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Subscribe to Alerts
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptoNewsFeed;

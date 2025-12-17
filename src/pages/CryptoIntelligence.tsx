import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Search, Bell, Bookmark, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CryptoCharts from "@/components/crypto/CryptoCharts";
import CryptoWatchlist from "@/components/crypto/CryptoWatchlist";
import CryptoPriceAlert from "@/components/crypto/CryptoPriceAlert";
import CryptoMarketAnalysis from "@/components/crypto/CryptoMarketAnalysis";
import CryptoNewsFeed from "@/components/crypto/CryptoNewsFeed";

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  image: string;
}

const CryptoIntelligence: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Get coin from URL params
  const selectedCoin = searchParams.get("coin");

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access crypto intelligence.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    loadCryptoData();
  }, []);

  useEffect(() => {
    if (selectedCoin && cryptoData.length > 0) {
      const crypto = cryptoData.find(c => c.id.toLowerCase() === selectedCoin.toLowerCase());
      if (crypto) {
        setSelectedCrypto(crypto);
      }
    }
  }, [selectedCoin, cryptoData]);

  const loadCryptoData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/crypto/prices?symbols=bitcoin,ethereum,cardano,solana,polkadot,binancecoin,ripple,litecoin,bitcoin-cash,zcash");
      const data = await response.json();
      setCryptoData(data || []);
      
      // Select first crypto by default if none selected
      if (!selectedCrypto && data.length > 0) {
        setSelectedCrypto(data[0]);
      }
    } catch (error) {
      console.error("Error loading crypto data:", error);
      toast({
        title: "Error",
        description: "Failed to load cryptocurrency data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCryptos = cryptoData.filter(crypto =>
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Crypto Intelligence Hub - Market Analysis & Insights | Eloity</title>
        <meta name="description" content="Advanced cryptocurrency market intelligence, real-time charts, price alerts, and market analysis tools." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/app/crypto")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Crypto Intelligence Hub
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Advanced market analysis, charts, and insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Live Market
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar - Crypto List */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Cryptocurrencies</CardTitle>
                  <div className="mt-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      Loading cryptocurrencies...
                    </div>
                  ) : filteredCryptos.length > 0 ? (
                    filteredCryptos.map((crypto) => (
                      <button
                        key={crypto.id}
                        onClick={() => setSelectedCrypto(crypto)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedCrypto?.id === crypto.id
                            ? "bg-blue-100 dark:bg-blue-900 border border-blue-300"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                              {crypto.symbol.toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {crypto.name}
                            </p>
                          </div>
                          {crypto.price_change_percentage_24h >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                          ${crypto.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs mt-1 ${
                          crypto.price_change_percentage_24h >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}>
                          {crypto.price_change_percentage_24h >= 0 ? "+" : ""}
                          {crypto.price_change_percentage_24h.toFixed(2)}%
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No cryptocurrencies found
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {selectedCrypto ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-5 mb-6">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Charts</span>
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="hidden sm:inline">Analysis</span>
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span className="hidden sm:inline">Alerts</span>
                    </TabsTrigger>
                    <TabsTrigger value="watchlist" className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4" />
                      <span className="hidden sm:inline">Watch</span>
                    </TabsTrigger>
                    <TabsTrigger value="news" className="flex items-center gap-2">
                      News
                    </TabsTrigger>
                  </TabsList>

                  {/* Charts Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    <CryptoCharts crypto={selectedCrypto} />
                  </TabsContent>

                  {/* Analysis Tab */}
                  <TabsContent value="analysis" className="space-y-6">
                    <CryptoMarketAnalysis crypto={selectedCrypto} />
                  </TabsContent>

                  {/* Alerts Tab */}
                  <TabsContent value="alerts" className="space-y-6">
                    <CryptoPriceAlert crypto={selectedCrypto} />
                  </TabsContent>

                  {/* Watchlist Tab */}
                  <TabsContent value="watchlist" className="space-y-6">
                    <CryptoWatchlist />
                  </TabsContent>

                  {/* News Tab */}
                  <TabsContent value="news" className="space-y-6">
                    <CryptoNewsFeed crypto={selectedCrypto} />
                  </TabsContent>
                </Tabs>
              ) : (
                <Card className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500">Select a cryptocurrency to view detailed analysis</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CryptoIntelligence;

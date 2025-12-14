import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Search,
  Star,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface Cryptocurrency {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  image: string;
  total_volume: number;
}

const SYMBOL_META: Record<string, { symbol: string; name: string; image: string; rank: number }> = {
  bitcoin: { symbol: "BTC", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", rank: 1 },
  ethereum: { symbol: "ETH", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", rank: 2 },
  tether: { symbol: "USDT", name: "Tether", image: "https://assets.coingecko.com/coins/images/325/large/Tether.png", rank: 3 },
  solana: { symbol: "SOL", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/large/solana.png", rank: 4 },
  cardano: { symbol: "ADA", name: "Cardano", image: "https://assets.coingecko.com/coins/images/975/large/cardano.png", rank: 5 },
  chainlink: { symbol: "LINK", name: "Chainlink", image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", rank: 6 },
  polygon: { symbol: "MATIC", name: "Polygon", image: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png", rank: 7 },
  avalanche: { symbol: "AVAX", name: "Avalanche", image: "https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png", rank: 8 },
  polkadot: { symbol: "DOT", name: "Polkadot", image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png", rank: 9 },
  dogecoin: { symbol: "DOGE", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png", rank: 10 },
};

const TRACKED = Object.keys(SYMBOL_META);

type TabType = "favorites" | "trending" | "gainers" | "losers";

const ViewAllCoins = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency, selectedCurrency, convertAmount } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get("tab") as TabType) || "trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [gainersListings, setGainersListings] = useState<Cryptocurrency[]>([]);
  const [losersListings, setLosersListings] = useState<Cryptocurrency[]>([]);
  const [trendingCryptos, setTrendingCryptos] = useState<Cryptocurrency[]>([]);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType;
    if (tabParam && ["favorites", "trending", "gainers", "losers"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let pricesRes;
      let retries = 3;
      let lastError: Error | null = null;

      while (retries > 0) {
        try {
          pricesRes = await fetch(
            `/api/crypto/prices?symbols=bitcoin,ethereum,tether,binancecoin,solana,cardano,polkadot,avalanche`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          break;
        } catch (fetchError) {
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
          retries--;
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      if (!pricesRes) {
        throw lastError || new Error("Failed to fetch cryptocurrency prices after retries");
      }

      const pricesText = await pricesRes.text();

      if (!pricesRes.ok) {
        throw new Error(`API returned HTTP ${pricesRes.status}`);
      }

      let pricesPayload;
      try {
        pricesPayload = pricesText ? JSON.parse(pricesText) : null;
      } catch (parseError) {
        throw new Error("Failed to parse API response as JSON");
      }

      const prices: Record<string, any> = {};
      if (pricesPayload.prices) {
        Object.entries(pricesPayload.prices).forEach(([symbol, data]: [string, any]) => {
          prices[symbol] = {
            usd: parseFloat(data.usd || "0"),
            usd_market_cap: parseFloat(data.usd_market_cap || "0"),
            usd_24h_change: parseFloat(data.usd_24h_change || "0"),
            usd_24h_vol: parseFloat(data.usd_24h_vol || "0"),
          };
        });
      }

      const list: Cryptocurrency[] = TRACKED.map((id) => {
        const p = prices[id] || {};
        const meta = SYMBOL_META[id];
        return {
          id,
          name: meta.name,
          symbol: meta.symbol,
          current_price: Number(p.usd) || 0,
          market_cap: Number(p.usd_market_cap) || 0,
          market_cap_rank: meta.rank,
          price_change_percentage_24h: Number(p.usd_24h_change) || 0,
          image: meta.image,
          total_volume: Number(p.usd_24h_vol) || 0,
        };
      }).sort((a, b) => a.market_cap_rank - b.market_cap_rank);

      setCryptos(list);

      const gainers = list
        .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
      setGainersListings(gainers);

      const losers = list
        .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
      setLosersListings(losers);

      setTrendingCryptos(list.slice(0, 8));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[ViewAllCoins] Error loading crypto prices:", errorMessage);
      toast({
        title: "Error",
        description: `Failed to load cryptocurrency prices: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPercentage = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

  const handleNavigateToTrade = (cryptoId: string) => {
    navigate(`/app/crypto-trading?pair=${cryptoId.toUpperCase()}USDT`);
  };

  const getFilteredCoins = () => {
    let coins: Cryptocurrency[] = [];

    switch (activeTab) {
      case "favorites":
        coins = cryptos.slice(0, 10);
        break;
      case "trending":
        coins = trendingCryptos;
        break;
      case "gainers":
        coins = gainersListings;
        break;
      case "losers":
        coins = losersListings;
        break;
      default:
        coins = cryptos;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      coins = coins.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(query) ||
          crypto.symbol.toLowerCase().includes(query)
      );
    }

    return coins;
  };

  const filteredCoins = getFilteredCoins();

  return (
    <>
      <Helmet>
        <title>All Cryptocurrencies - Eloity Crypto</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/app/crypto")}
                className="hover:bg-gray-200 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  All Cryptocurrencies
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Browse all cryptocurrencies by your preferred filter
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="dark:bg-slate-800 dark:border-slate-700 mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
                  <TabsList className="grid w-full max-w-2xl grid-cols-4 dark:bg-slate-700">
                    <TabsTrigger value="favorites" className="text-xs sm:text-sm dark:data-[state=active]:bg-slate-800">
                      <Star className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Favorites</span>
                      <span className="sm:hidden">Fav</span>
                    </TabsTrigger>
                    <TabsTrigger value="trending" className="text-xs sm:text-sm dark:data-[state=active]:bg-slate-800">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      <span>Trending</span>
                    </TabsTrigger>
                    <TabsTrigger value="gainers" className="text-xs sm:text-sm dark:data-[state=active]:bg-slate-800">
                      <span className="text-green-500 font-bold mr-2">↑</span>
                      <span className="hidden sm:inline">Gainers</span>
                      <span className="sm:hidden">Gain</span>
                    </TabsTrigger>
                    <TabsTrigger value="losers" className="text-xs sm:text-sm dark:data-[state=active]:bg-slate-800">
                      <span className="text-red-500 font-bold mr-2">↓</span>
                      <span className="hidden sm:inline">Losers</span>
                      <span className="sm:hidden">Loss</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or symbol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredCoins.length === 0 ? (
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No cryptocurrencies found matching your search.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-0">
                <div className="grid gap-0">
                  {/* Header */}
                  <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-slate-700 border-b dark:border-slate-600 font-semibold text-sm text-gray-700 dark:text-gray-300 sticky top-32">
                    <div className="col-span-4">Asset</div>
                    <div className="col-span-3 text-right">Price</div>
                    <div className="col-span-3 text-right">24h Change</div>
                    <div className="col-span-2 text-right">Volume</div>
                  </div>

                  {/* Coins List */}
                  {filteredCoins.map((crypto, index) => (
                    <div
                      key={crypto.id}
                      onClick={() => handleNavigateToTrade(crypto.id)}
                      className={cn(
                        "grid md:grid-cols-12 gap-4 p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border-b dark:border-slate-700 last:border-b-0",
                        "flex flex-col"
                      )}
                    >
                      <div className="md:col-span-4 flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <img
                            src={crypto.image}
                            alt={crypto.name}
                            className="w-12 h-12 rounded-full ring-2 ring-gray-200 dark:ring-slate-600"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                              #{crypto.market_cap_rank}
                            </span>
                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                              {crypto.symbol.toUpperCase()}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{crypto.name}</p>
                        </div>
                      </div>

                      <div className="md:col-span-3 md:text-right">
                        <span className="md:hidden text-xs text-gray-500 dark:text-gray-400">Price: </span>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {formatCurrency(convertAmount(crypto.current_price, "USD", selectedCurrency?.code || "USD"))}
                        </p>
                      </div>

                      <div className="md:col-span-3 md:text-right">
                        <span className="md:hidden text-xs text-gray-500 dark:text-gray-400">24h Change: </span>
                        <div
                          className={cn(
                            "flex items-center gap-1 font-semibold text-sm md:justify-end",
                            crypto.price_change_percentage_24h >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {crypto.price_change_percentage_24h >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span>{formatPercentage(crypto.price_change_percentage_24h)}</span>
                        </div>
                      </div>

                      <div className="md:col-span-2 md:text-right">
                        <span className="md:hidden text-xs text-gray-500 dark:text-gray-400">Volume: </span>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {formatCurrency(crypto.total_volume)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Count */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredCoins.length} of {cryptos.length} cryptocurrencies
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewAllCoins;

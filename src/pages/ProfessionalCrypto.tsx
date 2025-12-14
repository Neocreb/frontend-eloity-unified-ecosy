import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Users,
  PieChart,
  BookOpen,
  ChevronRight,
  Star,
  Blocks,
  Zap,
  Plus,
  Send,
  Clock,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import FeaturedCryptoService, { FeaturedCryptoListing, CommunityFeaturedPost } from "@/services/featuredCryptoService";

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

interface MarketStats {
  totalMarketCap: number;
  totalVolume24h: number;
  bitcoinDominance: number;
  activeCoins: number;
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

const ProfessionalCrypto = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency, selectedCurrency, convertAmount } = useCurrency();
  const navigate = useNavigate();

  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState(0);
  const [totalChangeUSD, setTotalChangeUSD] = useState(0);
  const [totalChangePct, setTotalChangePct] = useState(0);
  const [primaryAsset, setPrimaryAsset] = useState<{ symbol: string; balance: number; value: number; valueInUserCurrency: number }>({ symbol: "USDT", balance: 0, value: 0, valueInUserCurrency: 0 });
  const [activeMarketTab, setActiveMarketTab] = useState<"favorites" | "trending" | "gemw" | "new_listings">("trending");
  const [activeCommunityTab, setActiveCommunityTab] = useState<"discover" | "community" | "event" | "announcement">("discover");
  const [gemwListings, setGemwListings] = useState<FeaturedCryptoListing[]>([]);
  const [newListings, setNewListings] = useState<FeaturedCryptoListing[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityFeaturedPost[]>([]);

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
          pricesRes = await fetch(`/api/crypto/prices?symbols=bitcoin,ethereum,tether,binancecoin,solana,cardano,polkadot,avalanche`, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          break;
        } catch (fetchError) {
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (!pricesRes) {
        throw lastError || new Error('Failed to fetch cryptocurrency prices after retries');
      }

      const pricesText = await pricesRes.text();

      if (pricesText.includes('<!doctype html') || pricesText.includes('<html')) {
        throw new Error('API returned HTML (server error). Please check that the backend is running.');
      }

      if (!pricesRes.ok) {
        throw new Error(`API returned HTTP ${pricesRes.status}: ${pricesText.substring(0, 100)}`);
      }

      const contentType = pricesRes.headers.get('content-type');
      let pricesPayload;
      if (!contentType || !contentType.includes('application/json')) {
        try {
          pricesPayload = pricesText ? JSON.parse(pricesText) : null;
        } catch (parseError) {
          throw new Error(`API returned non-JSON response: ${pricesText.substring(0, 100)}`);
        }
      } else {
        try {
          pricesPayload = pricesText ? JSON.parse(pricesText) : null;
        } catch (parseError) {
          throw new Error('Failed to parse API response as JSON');
        }
      }

      const prices: Record<string, any> = {};
      if (pricesPayload.prices) {
        Object.entries(pricesPayload.prices).forEach(([symbol, data]: [string, any]) => {
          prices[symbol] = {
            usd: parseFloat(data.usd || '0'),
            usd_market_cap: parseFloat(data.usd_market_cap || '0'),
            usd_24h_change: parseFloat(data.usd_24h_change || '0'),
            usd_24h_vol: parseFloat(data.usd_24h_vol || '0')
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

      const totalMarketCap = list.reduce((s, c) => s + (c.market_cap || 0), 0);
      const totalVolume24h = list.reduce((s, c) => s + (c.total_volume || 0), 0);
      const btc = list.find((c) => c.id === "bitcoin");
      const btcDominance = totalMarketCap > 0 && btc ? (btc.market_cap / totalMarketCap) * 100 : 0;
      setMarketStats({ totalMarketCap, totalVolume24h, bitcoinDominance: btcDominance, activeCoins: list.length });

      let perCurrency: { currency: string; balance: number }[] = [];
      try {
        if (!user?.id) throw new Error("No user");
        const { data, error } = await (supabase as any)
          .from("crypto_wallets")
          .select("currency,balance")
          .eq("user_id", user.id);
        if (error) throw error;
        perCurrency = (data || [])
          .filter((r: any) => r.currency && typeof r.balance !== "undefined")
          .map((r: any) => ({ currency: String(r.currency).toUpperCase(), balance: Number(r.balance) || 0 }));
      } catch (walletError) {
        try {
          if (user?.id) {
            const r = await fetch(`/api/wallet/balance?userId=${encodeURIComponent(user.id)}`);
            const walletText = await r.text();

            if (!r.ok) {
              throw new Error(`HTTP error! status: ${r.status}`);
            }

            const contentType = r.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              throw new Error(`Received non-JSON response from wallet balance API`);
            }

            let j;
            try {
              j = walletText ? JSON.parse(walletText) : null;
            } catch (parseError) {
              throw new Error('Failed to parse wallet balance response as JSON');
            }
            const total = Number(j?.data?.balances?.crypto || 0);
            perCurrency = total > 0 ? [{ currency: "USDT", balance: total }] : [];
          }
        } catch (fallbackError) {
          perCurrency = [];
        }
      }

      const priceMap = new Map(list.map((c) => [c.symbol.toUpperCase(), c.current_price]));
      let sumUSD = 0;
      let sumUSDPrev = 0;
      let top = { symbol: "USDT", balance: 0, value: 0, valueInUserCurrency: 0 };
      for (const h of perCurrency) {
        const sym = h.currency.toUpperCase();
        const norm = sym;
        const px = priceMap.get(norm) ?? (norm === "USDT" ? 1 : 0);
        const usd = h.balance * px;
        sumUSD += usd;
        const changePct = list.find((c) => c.symbol.toUpperCase() === norm)?.price_change_percentage_24h || 0;
        const prev = usd / (1 + changePct / 100);
        sumUSDPrev += isFinite(prev) ? prev : usd;
        if (usd > top.value) top = { symbol: norm, balance: h.balance, value: usd, valueInUserCurrency: convertAmount(usd, "USD", selectedCurrency?.code || "USD") };
      }
      setTotalBalanceUSD(sumUSD);
      const delta = sumUSD - sumUSDPrev;
      setTotalChangeUSD(delta);
      setTotalChangePct(sumUSDPrev > 0 ? (delta / sumUSDPrev) * 100 : 0);
      setPrimaryAsset(top);

      // Load featured listings and community posts in parallel
      const [gemwData, newListingsData, communityData] = await Promise.all([
        FeaturedCryptoService.getFeaturedListingsByCategory('gemw', 6),
        FeaturedCryptoService.getFeaturedListingsByCategory('new_listing', 6),
        FeaturedCryptoService.getCommunityFeaturedPosts(undefined, 3),
      ]);

      setGemwListings(gemwData);
      setNewListings(newListingsData);
      setCommunityPosts(communityData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[Crypto] Error loading crypto prices:", errorMessage);
      toast({
        title: "Error",
        description: `Failed to load cryptocurrency prices: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `${selectedCurrency?.symbol || "$"}${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `${selectedCurrency?.symbol || "$"}${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${selectedCurrency?.symbol || "$"}${(value / 1000).toFixed(2)}K`;
    }
    return formatCurrency(value);
  };

  const formatPercentage = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

  const handleNavigateToTrade = (cryptoId: string) => {
    navigate(`/app/crypto-trading?pair=${cryptoId.toUpperCase()}USDT`);
  };

  const handleQuickNavigation = (section: string) => {
    switch (section) {
      case "portfolio":
        navigate("/app/crypto-portfolio");
        break;
      case "trade":
        navigate("/app/crypto-trading");
        break;
      case "p2p":
        navigate("/app/crypto-p2p");
        break;
      case "learn":
        navigate("/app/crypto-learn");
        break;
      case "defi":
        navigate("/app/defi");
        break;
      case "convert":
        navigate("/app/crypto-trading?type=convert");
        break;
      default:
        break;
    }
  };

  const handleDeposit = () => navigate("/app/crypto/deposit");
  const handleWithdraw = () => navigate("/app/crypto/withdraw");
  const handleConvert = () => navigate("/app/crypto-trading?type=convert");

  const trendingCryptos = useMemo(
    () => cryptos.sort((a, b) => b.total_volume - a.total_volume).slice(0, 6),
    [cryptos]
  );

  const sampleCommunityPosts = [
    {
      id: 1,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
      username: "CryptoEnthusiast",
      timestamp: "2 hours ago",
      content: "USDT just hit a new milestone! 🚀 +11.10%",
      change: "+11.10%",
      changeType: "positive",
    },
    {
      id: 2,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
      username: "BlockchainGuru",
      timestamp: "4 hours ago",
      content: "New DeFi opportunities unlocked this week",
      change: "+8.50%",
      changeType: "positive",
    },
    {
      id: 3,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user3",
      username: "TradingMaster",
      timestamp: "6 hours ago",
      content: "Bitcoin holding strong above resistance",
      change: "+2.30%",
      changeType: "positive",
    },
  ];

  const quickAccessItems = [
    { 
      label: "Portfolio", 
      icon: PieChart, 
      description: "Asset Management", 
      section: "portfolio",
      color: "from-purple-500 to-violet-600",
      iconColor: "text-purple-500"
    },
    { 
      label: "Trade", 
      icon: ArrowUpDown, 
      description: "Spot & Futures Trading", 
      section: "trade",
      color: "from-green-500 to-emerald-600",
      iconColor: "text-green-500",
      badge: "Hot"
    },
    { 
      label: "P2P", 
      icon: Users, 
      description: "Peer-to-Peer Trading", 
      section: "p2p",
      color: "from-blue-500 to-cyan-600",
      iconColor: "text-blue-500"
    },
    { 
      label: "Learn & Earn", 
      icon: BookOpen, 
      description: "Courses, Articles & Rewards", 
      section: "learn",
      color: "from-orange-500 to-red-600",
      iconColor: "text-orange-500",
      badge: "100%"
    },
    { 
      label: "DeFi", 
      icon: Blocks, 
      description: "Yield & Lending Hub", 
      section: "defi",
      color: "from-teal-500 to-cyan-600",
      iconColor: "text-teal-500",
      badge: "New"
    },
    { 
      label: "Convert", 
      icon: Zap, 
      description: "Swap Assets Instantly", 
      section: "convert",
      color: "from-purple-600 to-pink-600",
      iconColor: "text-purple-600"
    },
  ];

  return (
    <>
      <Helmet>
        <title>Crypto - Professional Trading Platform | Eloity</title>
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-slate-950">
        {/* UPPER ZONE - Full-bleed gradient with animated wave */}
        <div className="relative w-full bg-gradient-to-b from-purple-500 via-purple-500 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 pt-8 pb-32 overflow-hidden">
          {/* Animated wave/blob background */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20 dark:opacity-10"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            style={{
              animation: "wave 15s ease-in-out infinite",
            }}
          >
            <style>
              {`
                @keyframes wave {
                  0%, 100% { transform: translateX(0); }
                  50% { transform: translateX(25px); }
                }
                @keyframes float {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-20px) rotate(5deg); }
                }
              `}
            </style>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0.1 }} />
              </linearGradient>
            </defs>
            <path
              fill="url(#gradient)"
              d="M0,50 Q300,20 600,50 T1200,50 L1200,120 L0,120 Z"
            />
          </svg>

          {/* Content container */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top greeting section */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <h1 className="text-2xl sm:text-4xl font-bold text-white">
                Hi {user?.user_metadata?.full_name?.split(' ')[0] || 'User'} 👋
              </h1>
              <Badge className="bg-green-400 text-green-900 border-0 font-semibold shrink-0">
                🔒 Secured
              </Badge>
            </div>
            <p className="text-white/80 text-sm sm:text-base mb-6">Digital asset portfolio</p>

            {/* Portfolio value section */}
            <div className="mb-4">
              <p className="text-white/70 text-xs sm:text-sm font-medium mb-2">Total Portfolio Value</p>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-4xl sm:text-6xl font-bold text-white flex-1">
                  {formatCompactCurrency(convertAmount(totalBalanceUSD, "USD", selectedCurrency?.code || "USD"))}
                </h2>
                <div className={cn(
                  "px-2 sm:px-4 py-1 sm:py-2 rounded-full font-semibold text-xs sm:text-sm flex items-center gap-1 shrink-0 mt-1",
                  totalChangePct >= 0
                    ? "bg-green-400/20 text-green-100"
                    : "bg-red-400/20 text-red-100"
                )}>
                  {totalChangePct >= 0 ? (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden sm:inline">{formatCurrency(convertAmount(totalChangeUSD, "USD", selectedCurrency?.code || "USD"))} ({formatPercentage(totalChangePct)}) 24h</span>
                  <span className="sm:hidden">{formatPercentage(totalChangePct)} 24h</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FLOATING ACTION BUTTONS - positioned above divider */}
        <div className="relative z-20 -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex gap-2 sm:gap-4 justify-center sm:justify-start">
            <Button
              onClick={handleDeposit}
              className="bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:shadow-lg shadow-lg rounded-xl h-10 sm:h-12 px-3 sm:px-6 font-semibold flex items-center gap-1 sm:gap-2 transition-all text-sm sm:text-base flex-1 sm:flex-none justify-center"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Deposit</span>
            </Button>
            <Button
              onClick={handleConvert}
              className="bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:shadow-lg shadow-lg rounded-xl h-10 sm:h-12 px-3 sm:px-6 font-semibold flex items-center gap-1 sm:gap-2 transition-all text-sm sm:text-base flex-1 sm:flex-none justify-center"
            >
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Convert</span>
            </Button>
            <Button
              onClick={handleWithdraw}
              className="bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:shadow-lg shadow-lg rounded-xl h-10 sm:h-12 px-3 sm:px-6 font-semibold flex items-center gap-1 sm:gap-2 transition-all text-sm sm:text-base flex-1 sm:flex-none justify-center"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Withdraw</span>
            </Button>
          </div>
        </div>

        {/* LOWER ZONE - Pure white/dark gray content */}
        <div className="relative bg-white dark:bg-slate-900 px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto space-y-12">
            {/* QUICK ACCESS SECTION */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Access</h3>
                <button
                  onClick={() => handleQuickNavigation("portfolio")}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                {quickAccessItems.map((item, index) => (
                  <Card
                    key={index}
                    onClick={() => handleQuickNavigation(item.section)}
                    className="cursor-pointer hover:shadow-lg dark:hover:shadow-purple-900/30 transition-all duration-300 hover:scale-105 dark:bg-slate-800 dark:border-slate-700 group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <item.icon className={cn("h-7 w-7", item.iconColor)} />
                        </div>
                        {item.badge && (
                          <Badge className={cn(
                            "text-xs font-semibold",
                            item.badge === "Hot" && "bg-yellow-400 text-yellow-900 border-0",
                            item.badge === "100%" && "bg-green-400 text-green-900 border-0",
                            item.badge === "New" && "bg-red-400 text-white border-0"
                          )}>
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {item.label}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{item.description}</p>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* MARKET DATA SECTION */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-500" />
                  Top Cryptocurrencies
                </h3>
                <Badge variant="outline" className="dark:bg-slate-800 dark:border-slate-700">
                  Live Prices
                </Badge>
              </div>

              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                  <Tabs value={activeMarketTab} onValueChange={(value) => setActiveMarketTab(value as any)} className="w-full">
                    <div className="border-b dark:border-slate-700 px-6 pt-6">
                      <TabsList className="grid w-full max-w-2xl grid-cols-4 dark:bg-slate-700">
                        <TabsTrigger value="favorites" className="text-xs sm:text-sm dark:data-[state=active]:bg-slate-800">
                          Favorites
                        </TabsTrigger>
                        <TabsTrigger value="trending" className="text-xs sm:text-sm dark:data-[state=active]:bg-slate-800">
                          Trending
                        </TabsTrigger>
                        <TabsTrigger value="gemw" className="text-xs sm:text-sm dark:data-[state=active]:bg-slate-800">
                          GemW
                        </TabsTrigger>
                        <TabsTrigger value="new_listings" className="text-xs sm:text-sm dark:data-[state=active]:bg-slate-800">
                          New Listings
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="favorites" className="p-0 mt-0">
                      <div className="divide-y dark:divide-slate-700">
                        {cryptos.slice(0, 4).map((crypto) => (
                          <div
                            key={crypto.id}
                            onClick={() => handleNavigateToTrade(crypto.id)}
                            className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <img
                                src={crypto.image}
                                alt={crypto.name}
                                className="w-12 h-12 rounded-full ring-2 ring-gray-200 dark:ring-slate-600"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {crypto.symbol.toUpperCase()}/USDT
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{crypto.name}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(convertAmount(crypto.current_price, "USD", selectedCurrency?.code || "USD"))}</p>
                              <div className={cn(
                                "flex items-center gap-1 justify-end px-2 py-1 rounded-full text-xs font-semibold mt-1",
                                crypto.price_change_percentage_24h >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              )}>
                                {crypto.price_change_percentage_24h >= 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                <span>{formatPercentage(crypto.price_change_percentage_24h)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="trending" className="p-0 mt-0">
                      <div className="divide-y dark:divide-slate-700">
                        {trendingCryptos.map((crypto) => (
                          <div
                            key={crypto.id}
                            onClick={() => handleNavigateToTrade(crypto.id)}
                            className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <img
                                src={crypto.image}
                                alt={crypto.name}
                                className="w-12 h-12 rounded-full ring-2 ring-gray-200 dark:ring-slate-600"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {crypto.symbol.toUpperCase()}/USDT
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{crypto.name}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(convertAmount(crypto.current_price, "USD", selectedCurrency?.code || "USD"))}</p>
                              <div className={cn(
                                "flex items-center gap-1 justify-end px-2 py-1 rounded-full text-xs font-semibold mt-1",
                                crypto.price_change_percentage_24h >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              )}>
                                {crypto.price_change_percentage_24h >= 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                <span>{formatPercentage(crypto.price_change_percentage_24h)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="gemw" className="p-0 mt-0">
                      <div className="divide-y dark:divide-slate-700">
                        {gemwListings.length > 0 ? (
                          gemwListings.map((listing) => (
                            <div
                              key={listing.id}
                              className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <img
                                  src={listing.image_url || 'https://via.placeholder.com/48'}
                                  alt={listing.name}
                                  className="w-12 h-12 rounded-full ring-2 ring-gray-200 dark:ring-slate-600"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {listing.symbol.toUpperCase()}/USDT
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{listing.name}</p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 flex items-center gap-3">
                                <Badge className="bg-yellow-400 text-yellow-900 border-0 font-semibold">Hot</Badge>
                                <div>
                                  <p className="font-bold text-gray-900 dark:text-white">${listing.current_price?.toFixed(8) || '-.--'}</p>
                                  <div className={cn(
                                    "flex items-center gap-1 justify-end px-2 py-1 rounded-full text-xs font-semibold mt-1",
                                    listing.price_change_24h >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  )}>
                                    {listing.price_change_24h >= 0 ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3" />
                                    )}
                                    <span>{formatPercentage(listing.price_change_24h)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            No GemW listings available
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="new_listings" className="p-0 mt-0">
                      <div className="divide-y dark:divide-slate-700">
                        {newListings.length > 0 ? (
                          newListings.map((listing) => (
                            <div
                              key={listing.id}
                              className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <img
                                  src={listing.image_url || 'https://via.placeholder.com/48'}
                                  alt={listing.name}
                                  className="w-12 h-12 rounded-full ring-2 ring-gray-200 dark:ring-slate-600"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {listing.symbol.toUpperCase()}/USDT
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{listing.name}</p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 flex items-center gap-3">
                                <Badge className="bg-red-400 text-white border-0 font-semibold">New</Badge>
                                <div>
                                  <p className="font-bold text-gray-900 dark:text-white">${listing.current_price?.toFixed(8) || '-.--'}</p>
                                  <div className={cn(
                                    "flex items-center gap-1 justify-end px-2 py-1 rounded-full text-xs font-semibold mt-1",
                                    listing.price_change_24h >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  )}>
                                    {listing.price_change_24h >= 0 ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3" />
                                    )}
                                    <span>{formatPercentage(listing.price_change_24h)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            No new listings available
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="p-6 border-t dark:border-slate-700 text-center">
                    <button
                      onClick={() => handleNavigateToTrade("bitcoin")}
                      className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 font-medium text-sm transition-colors"
                    >
                      View More Coins →
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* COMMUNITY SECTION */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                Community
              </h3>

              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                  <Tabs value={activeCommunityTab} onValueChange={(value) => setActiveCommunityTab(value as any)} className="w-full">
                    <div className="border-b dark:border-slate-700 px-6 pt-6">
                      <TabsList className="grid w-full max-w-2xl grid-cols-4 dark:bg-slate-700">
                        <TabsTrigger value="discover" className="text-xs sm:text-sm dark:data-[state=active]:bg-slate-800">
                          Discover
                        </TabsTrigger>
                        <TabsTrigger value="community" className="text-xs sm:text-sm dark:data-[state=active]:bg-slate-800">
                          Community
                        </TabsTrigger>
                        <TabsTrigger value="event" className="text-xs sm:text-sm dark:data-[state=active]:bg-slate-800">
                          Event
                        </TabsTrigger>
                        <TabsTrigger value="announcement" className="text-xs sm:text-sm dark:data-[state=active]:bg-slate-800">
                          Announcement
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="discover" className="p-6 mt-0 space-y-4">
                      {sampleCommunityPosts.map((post) => (
                        <div
                          key={post.id}
                          className="p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border dark:border-slate-700"
                        >
                          <div className="flex gap-4">
                            <img
                              src={post.avatar}
                              alt={post.username}
                              className="w-12 h-12 rounded-full flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900 dark:text-white">{post.username}</p>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {post.timestamp}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 mb-3">{post.content}</p>
                              <div className={cn(
                                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold",
                                post.changeType === "positive"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                              )}>
                                {post.changeType === "positive" ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                {post.change}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="community" className="p-6 mt-0">
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Join our crypto community to connect with other traders</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="events" className="p-6 mt-0">
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Upcoming crypto events and webinars coming soon</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="announcements" className="p-6 mt-0">
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Latest announcements and market updates</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfessionalCrypto;

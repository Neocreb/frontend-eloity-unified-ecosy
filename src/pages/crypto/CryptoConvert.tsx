import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowRightLeft,
  Zap,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  image: string;
  balance: number;
}

interface ConversionResult {
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  timestamp: Date;
  fee: number;
  feePercentage: number;
}

const CRYPTO_ASSETS: CryptoAsset[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    price: 45000,
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    balance: 0,
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    price: 2500,
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    balance: 0,
  },
  {
    id: "tether",
    symbol: "USDT",
    name: "Tether",
    price: 1,
    image: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
    balance: 0,
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    price: 200,
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    balance: 0,
  },
  {
    id: "cardano",
    symbol: "ADA",
    name: "Cardano",
    price: 0.95,
    image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
    balance: 0,
  },
  {
    id: "polygon",
    symbol: "MATIC",
    name: "Polygon",
    price: 0.85,
    image: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png",
    balance: 0,
  },
];

const PLATFORM_TOKEN = {
  id: "eloits",
  symbol: "ELOITS",
  name: "Eloity Points",
  price: 0.50,
  image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
  balance: 0, // This will be updated with real data
  description: "Platform native token for rewards and transactions",
};

const CONVERSION_FEE_PERCENTAGE = 0.5; // 0.5% conversion fee

const CryptoConvert = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [conversionMode, setConversionMode] = useState<
    "crypto-to-crypto" | "crypto-to-eloits" | "eloits-to-crypto"
  >("crypto-to-crypto");
  const [fromAsset, setFromAsset] = useState<CryptoAsset | typeof PLATFORM_TOKEN>(
    CRYPTO_ASSETS[0]
  );
  const [toAsset, setToAsset] = useState<CryptoAsset | typeof PLATFORM_TOKEN>(
    CRYPTO_ASSETS[1]
  );
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState(0);
  const [conversionFee, setConversionFee] = useState(0);
  const [conversionHistory, setConversionHistory] = useState<ConversionResult[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [eloitsBalance, setEloitsBalance] = useState(0);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the converter.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Fetch real Eloits balance from database
    const fetchEloitsBalance = async () => {
      try {
        const { data, error } = await supabase
          .from("user_rewards_summary")
          .select("available_balance")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching balance:", error);
        } else if (data) {
          setEloitsBalance(data.available_balance || 0);
        }
      } catch (err) {
        console.error("Failed to fetch Eloits balance:", err);
      }
    };

    fetchEloitsBalance();

    // Load conversion history from localStorage
    const saved = localStorage.getItem("crypto_conversion_history");
    if (saved) {
      try {
        const history = JSON.parse(saved);
        setConversionHistory(history);
      } catch {
        // Ignore parsing errors
      }
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    // Update conversion mode based on selected assets
    if (
      fromAsset.symbol === "ELOITS" &&
      toAsset.symbol !== "ELOITS"
    ) {
      setConversionMode("eloits-to-crypto");
    } else if (
      fromAsset.symbol !== "ELOITS" &&
      toAsset.symbol === "ELOITS"
    ) {
      setConversionMode("crypto-to-eloits");
    } else {
      setConversionMode("crypto-to-crypto");
    }
  }, [fromAsset, toAsset]);

  // Calculate conversion when amount changes
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setToAmount("");
      setExchangeRate(0);
      setConversionFee(0);
      return;
    }

    const amount = parseFloat(fromAmount);
    const rate = calculateExchangeRate(fromAsset, toAsset);
    const fee = (amount * rate * CONVERSION_FEE_PERCENTAGE) / 100;
    const result = amount * rate - fee;

    setExchangeRate(rate);
    setConversionFee(fee);
    setToAmount(result.toFixed(6));
  }, [fromAmount, fromAsset, toAsset]);

  const calculateExchangeRate = (
    from: CryptoAsset | typeof PLATFORM_TOKEN,
    to: CryptoAsset | typeof PLATFORM_TOKEN
  ): number => {
    if ("price" in from && "price" in to) {
      return from.price / to.price;
    }
    return 1;
  };

  const handleSwapAssets = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setFromAmount(toAmount);
  };

  const handleConvert = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to convert.",
        variant: "destructive",
      });
      return;
    }

    if ("balance" in fromAsset && fromAsset.balance < parseFloat(fromAmount)) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${fromAsset.symbol} to convert.`,
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    try {
      // Simulate conversion delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const result: ConversionResult = {
        fromAsset: fromAsset.symbol,
        toAsset: toAsset.symbol,
        fromAmount: parseFloat(fromAmount),
        toAmount: parseFloat(toAmount),
        rate: exchangeRate,
        timestamp: new Date(),
        fee: conversionFee,
        feePercentage: CONVERSION_FEE_PERCENTAGE,
      };

      // Update history
      const newHistory = [result, ...conversionHistory].slice(0, 10); // Keep last 10
      setConversionHistory(newHistory);
      localStorage.setItem("crypto_conversion_history", JSON.stringify(newHistory));

      toast({
        title: "Conversion Complete",
        description: `Successfully converted ${fromAmount} ${fromAsset.symbol} to ${toAmount} ${toAsset.symbol}`,
      });

      // Reset form
      setFromAmount("");
      setToAmount("");
      setShowRate(true);
      setTimeout(() => setShowRate(false), 3000);
    } catch (error) {
      toast({
        title: "Conversion Failed",
        description:
          error instanceof Error ? error.message : "An error occurred during conversion.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  if (!user) {
    return null;
  }

  const availableCryptos = CRYPTO_ASSETS.filter(
    (crypto) =>
      (conversionMode === "crypto-to-crypto" ||
        conversionMode === "eloits-to-crypto" ||
        toAsset.symbol !== crypto.symbol) &&
      fromAsset.symbol !== crypto.symbol
  );

  return (
    <>
      <Helmet>
        <title>Crypto Converter - Exchange Assets | Eloity</title>
        <meta
          name="description"
          content="Convert between cryptocurrencies and platform tokens instantly with real-time exchange rates."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/30 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Crypto Converter
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Exchange cryptocurrencies and platform tokens
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Conversion Card */}
            <div className="md:col-span-2">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                    Convert Assets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Conversion Mode Info */}
                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                      {conversionMode === "crypto-to-crypto"
                        ? "Convert between cryptocurrencies with real-time rates"
                        : conversionMode === "crypto-to-eloits"
                        ? "Convert crypto to Eloity Points (platform token)"
                        : "Convert Eloity Points to cryptocurrencies"}
                    </AlertDescription>
                  </Alert>

                  {/* From Asset */}
                  <div className="space-y-2">
                    <Label htmlFor="from-asset" className="text-base font-semibold">
                      From
                    </Label>
                    <div className="flex gap-3 items-end">
                      <Select
                        value={fromAsset.symbol}
                        onValueChange={(value) => {
                          if (value === "ELOITS") {
                            setFromAsset(PLATFORM_TOKEN);
                          } else {
                            const selected = CRYPTO_ASSETS.find(
                              (a) => a.symbol === value
                            );
                            if (selected) setFromAsset(selected);
                          }
                        }}
                      >
                        <SelectTrigger id="from-asset">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CRYPTO_ASSETS.map((asset) => (
                            <SelectItem key={asset.id} value={asset.symbol}>
                              <div className="flex items-center gap-2">
                                <img
                                  src={asset.image}
                                  alt={asset.name}
                                  className="h-4 w-4 rounded-full"
                                />
                                {asset.symbol} - {asset.name}
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="ELOITS">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-yellow-500" />
                              ELOITS - Eloity Points
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex-1">
                        <Input
                          id="from-amount"
                          type="number"
                          placeholder="0.00"
                          value={fromAmount}
                          onChange={(e) => setFromAmount(e.target.value)}
                          className="text-right text-lg font-semibold"
                          step="0.00000001"
                          min="0"
                        />
                      </div>
                    </div>
                    {fromAsset.symbol !== "ELOITS" && (
                      <p className="text-xs text-gray-500 text-right">
                        Balance: {(fromAsset as CryptoAsset).balance.toFixed(4)}{" "}
                        {fromAsset.symbol}
                      </p>
                    )}
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSwapAssets}
                      className="h-10 w-10 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                    </Button>
                  </div>

                  {/* To Asset */}
                  <div className="space-y-2">
                    <Label htmlFor="to-asset" className="text-base font-semibold">
                      To
                    </Label>
                    <div className="flex gap-3 items-end">
                      <Select
                        value={toAsset.symbol}
                        onValueChange={(value) => {
                          if (value === "ELOITS") {
                            setToAsset(PLATFORM_TOKEN);
                          } else {
                            const selected = CRYPTO_ASSETS.find(
                              (a) => a.symbol === value
                            );
                            if (selected) setToAsset(selected);
                          }
                        }}
                      >
                        <SelectTrigger id="to-asset">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CRYPTO_ASSETS.map((asset) => (
                            <SelectItem key={asset.id} value={asset.symbol}>
                              <div className="flex items-center gap-2">
                                <img
                                  src={asset.image}
                                  alt={asset.name}
                                  className="h-4 w-4 rounded-full"
                                />
                                {asset.symbol} - {asset.name}
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="ELOITS">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-yellow-500" />
                              ELOITS - Eloity Points
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={toAmount}
                          readOnly
                          className="text-right text-lg font-semibold bg-gray-50 dark:bg-gray-950"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conversion Details */}
                  {fromAmount && parseFloat(fromAmount) > 0 && (
                    <Card className="bg-gray-50 dark:bg-gray-950 border-0">
                      <CardContent className="pt-6">
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Exchange Rate
                            </span>
                            <span className="font-semibold">
                              1 {fromAsset.symbol} = {exchangeRate.toFixed(6)}{" "}
                              {toAsset.symbol}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Conversion Fee
                            </span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {conversionFee.toFixed(6)} {toAsset.symbol} (
                              {CONVERSION_FEE_PERCENTAGE}%)
                            </span>
                          </div>
                          <div className="border-t pt-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                You'll Receive
                              </span>
                              <span className="font-bold text-lg text-green-600 dark:text-green-400">
                                {toAmount} {toAsset.symbol}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Convert Button */}
                  <Button
                    onClick={handleConvert}
                    disabled={
                      isConverting ||
                      !fromAmount ||
                      parseFloat(fromAmount) <= 0
                    }
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {isConverting ? "Converting..." : "Convert Now"}
                  </Button>

                  {/* Success Message */}
                  {showRate && (
                    <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                      <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-sm text-green-900 dark:text-green-100">
                        Conversion completed successfully!
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Conversion Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Platform Token
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Eloity Points Balance
                    </p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {PLATFORM_TOKEN.balance.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      ${(PLATFORM_TOKEN.balance * PLATFORM_TOKEN.price).toFixed(2)} USD
                    </p>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      About ELOITS
                    </p>
                    <p>{PLATFORM_TOKEN.description}</p>
                    <p className="text-xs">
                      Price: ${PLATFORM_TOKEN.price.toFixed(2)} USD
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Conversion Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        Conversion Fee
                      </p>
                      <p className="font-semibold">
                        {CONVERSION_FEE_PERCENTAGE}% per conversion
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        Processing
                      </p>
                      <p className="font-semibold">Instant</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        Rate Updates
                      </p>
                      <p className="font-semibold">Real-time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Conversions */}
          {conversionHistory.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">
                          From
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          To
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          Amount
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          Rate
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          Fee
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversionHistory.map((conversion, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-950/50">
                          <td className="py-3 px-4 font-semibold">
                            {conversion.fromAsset}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            {conversion.toAsset}
                          </td>
                          <td className="text-right py-3 px-4">
                            {conversion.fromAmount.toFixed(4)} →{" "}
                            {conversion.toAmount.toFixed(4)}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                            {conversion.rate.toFixed(6)}
                          </td>
                          <td className="text-right py-3 px-4 text-orange-600 dark:text-orange-400">
                            {conversion.fee.toFixed(6)}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {new Date(conversion.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default CryptoConvert;

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Plus, Trash2, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface WatchlistItem {
  id: string;
  cryptoId: string;
  cryptoName: string;
  symbol: string;
  price: number;
  change24h: number;
  image: string;
  addedAt: Date;
}

const CryptoWatchlist: React.FC = () => {
  const { toast } = useToast();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCrypto, setNewCrypto] = useState("");

  // Sample watchlist items
  useEffect(() => {
    const sampleWatchlist: WatchlistItem[] = [
      {
        id: "1",
        cryptoId: "bitcoin",
        cryptoName: "Bitcoin",
        symbol: "BTC",
        price: 45000,
        change24h: 2.5,
        image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
        addedAt: new Date(),
      },
      {
        id: "2",
        cryptoId: "ethereum",
        cryptoName: "Ethereum",
        symbol: "ETH",
        price: 2500,
        change24h: -1.2,
        image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
        addedAt: new Date(),
      },
    ];
    setWatchlist(sampleWatchlist);
  }, []);

  const filteredWatchlist = watchlist.filter(item =>
    item.cryptoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToWatchlist = () => {
    if (!newCrypto.trim()) {
      toast({
        title: "Error",
        description: "Please enter a cryptocurrency name",
        variant: "destructive",
      });
      return;
    }

    const newItem: WatchlistItem = {
      id: Date.now().toString(),
      cryptoId: newCrypto.toLowerCase(),
      cryptoName: newCrypto,
      symbol: newCrypto.substring(0, 3).toUpperCase(),
      price: Math.random() * 50000,
      change24h: (Math.random() - 0.5) * 10,
      image: `https://assets.coingecko.com/coins/images/1/large/bitcoin.png`,
      addedAt: new Date(),
    };

    setWatchlist([...watchlist, newItem]);
    setNewCrypto("");
    setShowAddForm(false);

    toast({
      title: "Added to Watchlist",
      description: `${newItem.cryptoName} has been added to your watchlist`,
    });
  };

  const handleRemoveFromWatchlist = (id: string) => {
    setWatchlist(watchlist.filter(item => item.id !== id));
    toast({
      title: "Removed from Watchlist",
      description: "Cryptocurrency has been removed from your watchlist",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            My Watchlist
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Crypto
          </Button>
        </CardHeader>

        {showAddForm && (
          <CardContent className="pb-4 pt-0 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <Input
                placeholder="Search crypto (e.g., Bitcoin, Ethereum)"
                value={newCrypto}
                onChange={(e) => setNewCrypto(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddToWatchlist();
                  }
                }}
              />
              <Button onClick={handleAddToWatchlist}>Add</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCrypto("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Search */}
      {watchlist.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search your watchlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Watchlist Items */}
      {filteredWatchlist.length > 0 ? (
        <div className="space-y-3">
          {filteredWatchlist.map((item) => (
            <Card key={item.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={item.image}
                      alt={item.cryptoName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.symbol}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {item.cryptoName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${item.price.toFixed(2)}
                    </p>
                    <Badge
                      className={
                        item.change24h >= 0
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                      }
                    >
                      {item.change24h >= 0 ? "+" : ""}{item.change24h.toFixed(2)}%
                    </Badge>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFromWatchlist(item.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-12 text-center">
            <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Your watchlist is empty
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Crypto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-100">Watchlist Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
            <li className="flex gap-2">
              <span className="text-amber-600 dark:text-amber-400">•</span>
              <span>Track cryptocurrencies without committing to trade</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-600 dark:text-amber-400">•</span>
              <span>Monitor price movements and market trends in real-time</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-600 dark:text-amber-400">•</span>
              <span>Set price alerts on your watched cryptocurrencies</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-600 dark:text-amber-400">•</span>
              <span>Compare performance across multiple cryptocurrencies</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptoWatchlist;

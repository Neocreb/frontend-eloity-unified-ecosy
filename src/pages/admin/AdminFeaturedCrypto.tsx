import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface FeaturedListing {
  id: string;
  symbol: string;
  name: string;
  image_url: string;
  current_price: number;
  price_change_24h: number;
  category: 'gainers' | 'losers' | 'trending' | 'hot';
  is_featured: boolean;
  order_index: number;
}

interface CommunityPost {
  id: string;
  username: string;
  title?: string;
  content: string;
  category: 'discover' | 'community' | 'announcement' | 'event';
  sentiment: 'positive' | 'negative' | 'neutral';
  impact_percentage: number;
  is_featured: boolean;
  order_index: number;
}

export default function AdminFeaturedCrypto() {
  const { toast } = useToast();
  const [listings, setListings] = useState<FeaturedListing[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [listingForm, setListingForm] = useState({
    symbol: '',
    name: '',
    image_url: '',
    current_price: '',
    price_change_24h: '',
    category: 'gainers' as const,
    order_index: '',
  });

  const [postForm, setPostForm] = useState({
    username: '',
    title: '',
    content: '',
    category: 'discover' as const,
    sentiment: 'positive' as const,
    impact_percentage: '',
    order_index: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listingsRes, postsRes] = await Promise.all([
        supabase.from('featured_crypto_listings').select('*'),
        supabase.from('community_featured_posts').select('*')
      ]);

      if (listingsRes.data) setListings(listingsRes.data as FeaturedListing[]);
      if (postsRes.data) setPosts(postsRes.data as CommunityPost[]);
    } catch (err) {
      console.error('Error loading data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load featured content',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddListing = async () => {
    try {
      const { error } = await supabase.from('featured_crypto_listings').insert([{
        symbol: listingForm.symbol.toUpperCase(),
        name: listingForm.name,
        image_url: listingForm.image_url,
        current_price: parseFloat(listingForm.current_price),
        price_change_24h: parseFloat(listingForm.price_change_24h),
        category: listingForm.category,
        is_featured: true,
        order_index: parseInt(listingForm.order_index) || 0,
      }]);

      if (error) throw error;

      toast({ title: 'Success', description: 'Listing added successfully' });
      setListingForm({
        symbol: '', name: '', image_url: '', current_price: '', 
        price_change_24h: '', category: 'gainers', order_index: ''
      });
      setIsAddingNew(false);
      loadData();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add listing',
        variant: 'destructive'
      });
    }
  };

  const handleAddPost = async () => {
    try {
      const { error } = await supabase.from('community_featured_posts').insert([{
        username: postForm.username,
        title: postForm.title || null,
        content: postForm.content,
        category: postForm.category,
        sentiment: postForm.sentiment,
        impact_percentage: parseFloat(postForm.impact_percentage) || 0,
        is_featured: true,
        order_index: parseInt(postForm.order_index) || 0,
      }]);

      if (error) throw error;

      toast({ title: 'Success', description: 'Post added successfully' });
      setPostForm({
        username: '', title: '', content: '', category: 'discover',
        sentiment: 'positive', impact_percentage: '', order_index: ''
      });
      setIsAddingNew(false);
      loadData();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add post',
        variant: 'destructive'
      });
    }
  };

  const handleToggleFeatured = async (id: string, type: 'listing' | 'post', current: boolean) => {
    try {
      const table = type === 'listing' ? 'featured_crypto_listings' : 'community_featured_posts';
      const { error } = await supabase
        .from(table)
        .update({ is_featured: !current })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Updated successfully' });
      loadData();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string, type: 'listing' | 'post') => {
    if (!confirm('Are you sure you want to delete this?')) return;

    try {
      const table = type === 'listing' ? 'featured_crypto_listings' : 'community_featured_posts';
      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Deleted successfully' });
      loadData();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Featured Crypto Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage featured listings and community posts on the crypto page
          </p>
        </div>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList>
          <TabsTrigger value="listings">Featured Listings</TabsTrigger>
          <TabsTrigger value="posts">Community Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Gainers & Losers</h2>
            <Dialog open={isAddingNew && false} onOpenChange={setIsAddingNew}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Listing
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Featured Listing</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Symbol (e.g., BTC)"
                    value={listingForm.symbol}
                    onChange={(e) => setListingForm({ ...listingForm, symbol: e.target.value })}
                  />
                  <Input
                    placeholder="Name (e.g., Bitcoin)"
                    value={listingForm.name}
                    onChange={(e) => setListingForm({ ...listingForm, name: e.target.value })}
                  />
                  <Input
                    placeholder="Image URL"
                    value={listingForm.image_url}
                    onChange={(e) => setListingForm({ ...listingForm, image_url: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Current Price"
                    value={listingForm.current_price}
                    onChange={(e) => setListingForm({ ...listingForm, current_price: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="24h Change %"
                    value={listingForm.price_change_24h}
                    onChange={(e) => setListingForm({ ...listingForm, price_change_24h: e.target.value })}
                  />
                  <Select value={listingForm.category} onValueChange={(val) => setListingForm({ ...listingForm, category: val as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gainers">Gainers</SelectItem>
                      <SelectItem value="losers">Losers</SelectItem>
                      <SelectItem value="trending">Trending</SelectItem>
                      <SelectItem value="hot">Hot</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Order Index"
                    value={listingForm.order_index}
                    onChange={(e) => setListingForm({ ...listingForm, order_index: e.target.value })}
                  />
                  <Button onClick={handleAddListing} className="w-full">Add Listing</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={listing.image_url}
                        alt={listing.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{listing.symbol}</h3>
                          <Badge variant={listing.category === 'gainers' ? 'default' : 'secondary'}>
                            {listing.category}
                          </Badge>
                          {!listing.is_featured && (
                            <Badge variant="outline">Hidden</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{listing.name}</p>
                        <p className="text-sm font-semibold mt-2">
                          ${listing.current_price.toFixed(8)}
                          {' '}
                          <span className={listing.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {listing.price_change_24h >= 0 ? '+' : ''}{listing.price_change_24h.toFixed(2)}%
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleFeatured(listing.id, 'listing', listing.is_featured)}
                      >
                        {listing.is_featured ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(listing.id, 'listing')}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Community Posts</h2>
            <Dialog open={isAddingNew && true} onOpenChange={setIsAddingNew}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Community Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Username"
                    value={postForm.username}
                    onChange={(e) => setPostForm({ ...postForm, username: e.target.value })}
                  />
                  <Input
                    placeholder="Title (optional)"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Content"
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  />
                  <Select value={postForm.category} onValueChange={(val) => setPostForm({ ...postForm, category: val as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discover">Discover</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={postForm.sentiment} onValueChange={(val) => setPostForm({ ...postForm, sentiment: val as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Impact %"
                    value={postForm.impact_percentage}
                    onChange={(e) => setPostForm({ ...postForm, impact_percentage: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Order Index"
                    value={postForm.order_index}
                    onChange={(e) => setPostForm({ ...postForm, order_index: e.target.value })}
                  />
                  <Button onClick={handleAddPost} className="w-full">Add Post</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{post.username}</h3>
                        <Badge variant="outline">{post.category}</Badge>
                        <Badge variant={post.sentiment === 'positive' ? 'default' : post.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                          {post.sentiment}
                        </Badge>
                        {!post.is_featured && (
                          <Badge variant="outline">Hidden</Badge>
                        )}
                      </div>
                      {post.title && <p className="font-semibold text-sm mb-1">{post.title}</p>}
                      <p className="text-sm text-gray-600 dark:text-gray-400">{post.content}</p>
                      {post.impact_percentage > 0 && (
                        <p className="text-sm mt-2 font-semibold">Impact: {post.impact_percentage.toFixed(2)}%</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleFeatured(post.id, 'post', post.is_featured)}
                      >
                        {post.is_featured ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(post.id, 'post')}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

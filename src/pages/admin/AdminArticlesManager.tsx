import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit2, Trash2, Eye, EyeOff, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  reading_time: number;
  is_published: boolean;
  published_at: string | null;
  views_count: number;
  likes_count: number;
  quiz_attempts: number;
  created_at: string;
}

const AdminArticlesManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Form states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    difficulty: 'Beginner',
    category: '',
    reading_time: 5,
    featured_image: '',
    tags: [] as string[],
  });

  useEffect(() => {
    if (user) {
      loadArticles();
    }
  }, [user]);

  useEffect(() => {
    filterArticles();
  }, [articles, searchTerm, filterDifficulty]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('educational_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load articles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(a => a.difficulty === filterDifficulty);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.title.toLowerCase().includes(search) ||
          a.excerpt?.toLowerCase().includes(search) ||
          a.category?.toLowerCase().includes(search)
      );
    }

    setFilteredArticles(filtered);
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Error',
        description: 'Title and content are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingArticle) {
        // Update existing article
        const { error } = await supabase
          .from('educational_articles')
          .update({
            title: formData.title,
            excerpt: formData.excerpt,
            content: formData.content,
            difficulty: formData.difficulty,
            category: formData.category,
            reading_time: formData.reading_time,
            featured_image: formData.featured_image,
            tags: formData.tags,
          })
          .eq('id', editingArticle.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Article updated successfully',
        });
      } else {
        // Create new article
        const { error } = await supabase
          .from('educational_articles')
          .insert({
            title: formData.title,
            excerpt: formData.excerpt,
            content: formData.content,
            difficulty: formData.difficulty,
            category: formData.category,
            reading_time: formData.reading_time,
            featured_image: formData.featured_image,
            tags: formData.tags,
            author_id: user?.id,
            is_published: false,
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Article created successfully',
        });
      }

      setFormData({
        title: '',
        excerpt: '',
        content: '',
        difficulty: 'Beginner',
        category: '',
        reading_time: 5,
        featured_image: '',
        tags: [],
      });
      setEditingArticle(null);
      setShowCreateDialog(false);
      loadArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: 'Error',
        description: 'Failed to save article',
        variant: 'destructive',
      });
    }
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      difficulty: article.difficulty,
      category: article.category,
      reading_time: article.reading_time,
      featured_image: '',
      tags: [],
    });
    setShowCreateDialog(true);
  };

  const handleTogglePublish = async (articleId: string, isPublished: boolean) => {
    try {
      const { error } = await supabase
        .from('educational_articles')
        .update({
          is_published: !isPublished,
          published_at: !isPublished ? new Date().toISOString() : null,
        })
        .eq('id', articleId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: isPublished ? 'Article unpublished' : 'Article published',
      });

      loadArticles();
    } catch (error) {
      console.error('Error updating article:', error);
      toast({
        title: 'Error',
        description: 'Failed to update article',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;

    try {
      const { error } = await supabase.from('educational_articles').delete().eq('id', articleId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Article deleted',
      });

      loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete article',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Articles Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage educational articles with quizzes</p>
        </div>
        <Button
          onClick={() => {
            setEditingArticle(null);
            setFormData({
              title: '',
              excerpt: '',
              content: '',
              difficulty: 'Beginner',
              category: '',
              reading_time: 5,
              featured_image: '',
              tags: [],
            });
            setShowCreateDialog(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Article
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle>Articles ({filteredArticles.length})</CardTitle>
          <CardDescription>Total: {articles.length} articles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading articles...</div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No articles found</div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {filteredArticles.map(article => (
                  <Card key={article.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg truncate">{article.title}</h3>
                            <Badge variant={article.is_published ? 'default' : 'secondary'}>
                              {article.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {article.excerpt}
                          </p>
                          <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                            <Badge variant="outline">{article.difficulty}</Badge>
                            <span>{article.category}</span>
                            <span>📖 {article.reading_time}m read</span>
                            <span>👁️ {article.views_count} views</span>
                            <span>👍 {article.likes_count} likes</span>
                            <span>❓ {article.quiz_attempts} quiz attempts</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditArticle(article)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePublish(article.id, article.is_published)}
                          >
                            {article.is_published ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteArticle(article.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Article Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle ? 'Edit Article' : 'Create New Article'}</DialogTitle>
            <DialogDescription>
              {editingArticle ? 'Update article details' : 'Create a new educational article'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateArticle} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Article Title*</label>
              <Input
                placeholder="e.g., Understanding Smart Contracts"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Excerpt</label>
              <Input
                placeholder="Brief summary of the article..."
                value={formData.excerpt}
                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Content*</label>
              <Textarea
                placeholder="Full article content (supports markdown)..."
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                <Select value={formData.difficulty} onValueChange={v => setFormData({ ...formData, difficulty: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Input
                  placeholder="e.g., Blockchain"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Reading Time (min)</label>
                <Input
                  type="number"
                  placeholder="5"
                  value={formData.reading_time}
                  onChange={e => setFormData({ ...formData, reading_time: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
              <Input
                placeholder="e.g., blockchain, smart contracts, web3"
                onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600">
                {editingArticle ? 'Update Article' : 'Create Article'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminArticlesManager;

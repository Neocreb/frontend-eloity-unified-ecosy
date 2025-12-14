import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import ArticleDbService from '../services/articleDbService';

const router = Router();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Middleware to check if user is admin
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    return !error && data?.role === 'admin';
  } catch (error) {
    return false;
  }
}

/**
 * Middleware to verify admin authorization
 */
async function requireAdmin(req: Request, res: Response, next: Function) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const admin = await isAdmin(userId);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  next();
}

/**
 * POST /api/admin/articles
 * Create a new educational article (admin only)
 */
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      excerpt,
      content,
      difficulty,
      category,
      reading_time,
      featured_image,
      quiz_questions,
      quiz_passing_score,
      reward_reading,
      reward_quiz_completion,
      reward_perfect_score,
      tags,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const authorId = req.user?.id;
    if (!authorId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const result = await ArticleDbService.createArticle(authorId, {
      title,
      excerpt,
      content,
      difficulty,
      category,
      reading_time,
      featured_image,
      quiz_questions,
      quiz_passing_score,
      reward_reading,
      reward_quiz_completion,
      reward_perfect_score,
      tags,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

/**
 * GET /api/admin/articles/:id
 * Get article details (admin only)
 */
router.get('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await ArticleDbService.getArticleById(id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

/**
 * PUT /api/admin/articles/:id
 * Update article (admin only)
 */
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await ArticleDbService.updateArticle(id, updateData);
    res.json(result);
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

/**
 * DELETE /api/admin/articles/:id
 * Delete article (admin only)
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await ArticleDbService.deleteArticle(id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

/**
 * POST /api/admin/articles/:id/publish
 * Publish article (admin only)
 */
router.post('/:id/publish', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await ArticleDbService.publishArticle(id);
    res.json(result);
  } catch (error) {
    console.error('Error publishing article:', error);
    res.status(500).json({ error: 'Failed to publish article' });
  }
});

/**
 * POST /api/admin/articles/:id/unpublish
 * Unpublish article (admin only)
 */
router.post('/:id/unpublish', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await ArticleDbService.unpublishArticle(id);
    res.json(result);
  } catch (error) {
    console.error('Error unpublishing article:', error);
    res.status(500).json({ error: 'Failed to unpublish article' });
  }
});

/**
 * GET /api/admin/articles
 * List all articles (admin only)
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { difficulty, category } = req.query;

    const { data, error } = await supabase
      .from('educational_articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let articles = data || [];

    if (difficulty) {
      articles = articles.filter((a) => a.difficulty === difficulty);
    }
    if (category) {
      articles = articles.filter((a) => a.category === category);
    }

    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

export default router;

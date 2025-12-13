import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import ArticleDbService from '../services/articleDbService';
import { ActivityRewardService } from '../services/activityRewardService';

const router = Router();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Middleware to verify user is authenticated
 */
function requireAuth(req: Request, res: Response, next: Function) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/**
 * GET /api/articles
 * Get all published articles with filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { difficulty, category, search } = req.query;

    let articles = await ArticleDbService.getAllPublishedArticles({
      difficulty: difficulty as string,
      category: category as string,
    });

    // Simple search filter for title/excerpt/content
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      articles = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm) ||
          article.excerpt?.toLowerCase().includes(searchTerm) ||
          article.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
      );
    }

    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

/**
 * GET /api/articles/:id
 * Get article details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await ArticleDbService.getArticleById(id);

    if (!article || !article.is_published) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

/**
 * POST /api/articles/:id/read
 * Mark article as read and track progress
 */
router.post('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { timeSpent } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const article = await ArticleDbService.getArticleById(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const result = await ArticleDbService.markArticleRead(userId, id, timeSpent || 0);

    // Award reading reward
    if (article.reward_reading > 0) {
      const progress = await ArticleDbService.getUserArticleProgress(userId, id);
      if (progress && !progress.reading_reward_claimed) {
        await ActivityRewardService.logActivity({
          userId,
          actionType: 'read_article',
          targetId: id,
          targetType: 'article',
          value: Number(article.reward_reading) || 1,
          metadata: {
            rewardType: 'reading',
            articleTitle: article.title,
            difficulty: article.difficulty,
            points: Number(article.reward_reading),
          },
        });

        // Mark reward as claimed
        await ArticleDbService.claimReadingReward(userId, id, Number(article.reward_reading));
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error marking article read:', error);
    res.status(500).json({ error: 'Failed to mark article as read' });
  }
});

/**
 * POST /api/articles/:id/quiz
 * Submit article quiz answer
 */
router.post('/:id/quiz', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { score } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    if (score === undefined) {
      return res.status(400).json({ error: 'Score is required' });
    }

    const article = await ArticleDbService.getArticleById(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const result = await ArticleDbService.submitArticleQuiz(userId, id, score);

    // Award quiz completion reward
    if (score >= (article.quiz_passing_score || 70) && article.reward_quiz_completion > 0) {
      const progress = await ArticleDbService.getUserArticleProgress(userId, id);
      if (progress && !progress.quiz_reward_claimed) {
        await ActivityRewardService.logActivity({
          userId,
          actionType: 'complete_article_quiz',
          targetId: id,
          targetType: 'article_quiz',
          value: Number(article.reward_quiz_completion) || 2,
          metadata: {
            rewardType: 'quiz_completion',
            articleTitle: article.title,
            score,
            points: Number(article.reward_quiz_completion),
          },
        });

        await ArticleDbService.claimQuizReward(userId, id, Number(article.reward_quiz_completion));

        // Award perfect score bonus if applicable
        if (score === 100 && article.reward_perfect_score > 0) {
          await ActivityRewardService.logActivity({
            userId,
            actionType: 'achieve_milestone',
            targetId: id,
            targetType: 'article_perfect_score',
            value: Number(article.reward_perfect_score) || 3,
            metadata: {
              rewardType: 'perfect_score',
              articleTitle: article.title,
              points: Number(article.reward_perfect_score),
            },
          });

          await ArticleDbService.claimPerfectScoreReward(userId, id, Number(article.reward_perfect_score));
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

/**
 * POST /api/articles/:id/bookmark
 * Bookmark article
 */
router.post('/:id/bookmark', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { bookmarked } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const result = await ArticleDbService.bookmarkArticle(userId, id, bookmarked);
    res.json(result);
  } catch (error) {
    console.error('Error bookmarking article:', error);
    res.status(500).json({ error: 'Failed to bookmark article' });
  }
});

/**
 * POST /api/articles/:id/like
 * Like article
 */
router.post('/:id/like', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { liked } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const result = await ArticleDbService.likeArticle(userId, id, liked);
    res.json(result);
  } catch (error) {
    console.error('Error liking article:', error);
    res.status(500).json({ error: 'Failed to like article' });
  }
});

/**
 * GET /api/articles/:id/progress
 * Get user's progress on article
 */
router.get('/:id/progress', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const progress = await ArticleDbService.getUserArticleProgress(userId, id);
    res.json(progress || { read: false, liked: false, bookmarked: false });
  } catch (error) {
    console.error('Error fetching article progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

/**
 * GET /api/articles/user/progress
 * Get user's progress on all articles
 */
router.get('/user/progress', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const progress = await ArticleDbService.getUserArticlesProgress(userId);
    res.json(progress);
  } catch (error) {
    console.error('Error fetching user article progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

export default router;

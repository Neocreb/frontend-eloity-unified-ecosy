import { Router, Request, Response } from 'express';
import ArticleDbService from '../services/articleDbService';

const router = Router();

/**
 * GET /api/articles
 * Get all published articles with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { difficulty, category, search } = req.query;

    let articles = await ArticleDbService.getAllPublishedArticles({
      difficulty: difficulty as string,
      category: category as string,
    });

    // Apply search filter
    if (search) {
      const searchLower = (search as string).toLowerCase();
      articles = articles.filter(
        (article: any) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.excerpt?.toLowerCase().includes(searchLower) ||
          article.content?.toLowerCase().includes(searchLower) ||
          article.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
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

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check if article is published or user is author
    const userId = req.user?.id;
    const isPublished = article.is_published;
    const isAuthor = article.author_id === userId;

    if (!isPublished && !isAuthor) {
      return res.status(403).json({ error: 'Article not available' });
    }

    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

/**
 * POST /api/articles/:id/read
 * Mark article as read
 */
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const result = await ArticleDbService.markArticleRead(userId, id);

    // Claim reading reward if not already claimed
    const article = await ArticleDbService.getArticleById(id);
    if (article && !await ArticleDbService.hasClaimedReward(userId, id, 'reading')) {
      await ArticleDbService.claimArticleReward(
        userId,
        id,
        'reading',
        article.reward_reading
      );
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error marking article read:', error);
    res.status(500).json({ error: 'Failed to mark article as read' });
  }
});

/**
 * POST /api/articles/:id/quiz
 * Submit quiz answer for article
 */
router.post('/:id/quiz', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quizScore } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    if (quizScore === undefined) {
      return res.status(400).json({ error: 'Quiz score is required' });
    }

    const result = await ArticleDbService.submitArticleQuiz(userId, id, quizScore);

    // Claim quiz completion reward
    const article = await ArticleDbService.getArticleById(id);
    if (article && !await ArticleDbService.hasClaimedReward(userId, id, 'quiz_completion')) {
      await ArticleDbService.claimArticleReward(
        userId,
        id,
        'quiz_completion',
        article.reward_quiz_completion
      );
    }

    // Claim perfect score reward if applicable
    if (quizScore === 100 && article && !await ArticleDbService.hasClaimedReward(userId, id, 'perfect_score')) {
      await ArticleDbService.claimArticleReward(
        userId,
        id,
        'perfect_score',
        article.reward_perfect_score
      );
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
router.post('/:id/bookmark', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { bookmarked } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const result = await ArticleDbService.toggleArticleBookmark(userId, id, bookmarked);
    res.json(result);
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

/**
 * POST /api/articles/:id/like
 * Like article
 */
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { liked } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const result = await ArticleDbService.toggleArticleLike(userId, id, liked);
    res.json(result);
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

/**
 * GET /api/articles/:id/progress
 * Get user's progress on article
 */
router.get('/:id/progress', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const progress = await ArticleDbService.getUserArticleProgress(userId, id);
    res.json(progress || {});
  } catch (error) {
    console.error('Error fetching article progress:', error);
    res.status(500).json({ error: 'Failed to fetch article progress' });
  }
});

/**
 * GET /api/articles/user/bookmarked
 * Get user's bookmarked articles
 */
router.get('/user/bookmarked', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const articles = await ArticleDbService.getUserBookmarkedArticles(userId);
    res.json(articles);
  } catch (error) {
    console.error('Error fetching bookmarked articles:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarked articles' });
  }
});

export default router;

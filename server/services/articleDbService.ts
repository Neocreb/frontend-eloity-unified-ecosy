import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface ArticleInput {
  title: string;
  excerpt?: string;
  content: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  category?: string;
  reading_time?: number;
  featured_image?: string;
  quiz_questions?: any;
  quiz_passing_score?: number;
  tags?: string[];
  reward_reading?: number;
  reward_quiz_completion?: number;
  reward_perfect_score?: number;
}

export interface ArticleUpdateInput extends Partial<ArticleInput> {
  is_published?: boolean;
  published_at?: string;
}

export class ArticleDbService {
  /**
   * Create a new article
   */
  static async createArticle(authorId: string, input: ArticleInput) {
    try {
      const { data, error } = await supabase
        .from('educational_articles')
        .insert({
          author_id: authorId,
          title: input.title,
          excerpt: input.excerpt || '',
          content: input.content,
          difficulty: input.difficulty || 'Beginner',
          category: input.category || '',
          reading_time: input.reading_time || 5,
          featured_image: input.featured_image || '',
          quiz_questions: input.quiz_questions || null,
          quiz_passing_score: input.quiz_passing_score || 70,
          tags: input.tags || [],
          reward_reading: input.reward_reading || 1,
          reward_quiz_completion: input.reward_quiz_completion || 2,
          reward_perfect_score: input.reward_perfect_score || 3,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  }

  /**
   * Get article by ID
   */
  static async getArticleById(articleId: string) {
    try {
      const { data, error } = await supabase
        .from('educational_articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  }

  /**
   * Get all published articles
   */
  static async getAllPublishedArticles(filters?: {
    difficulty?: string;
    category?: string;
  }) {
    try {
      let query = supabase
        .from('educational_articles')
        .select('*')
        .eq('is_published', true);

      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query.order('published_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  }

  /**
   * Get articles by author
   */
  static async getArticlesByAuthor(authorId: string) {
    try {
      const { data, error } = await supabase
        .from('educational_articles')
        .select('*')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching author articles:', error);
      throw error;
    }
  }

  /**
   * Update article
   */
  static async updateArticle(articleId: string, input: ArticleUpdateInput) {
    try {
      const { data, error } = await supabase
        .from('educational_articles')
        .update(input)
        .eq('id', articleId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  }

  /**
   * Delete article
   */
  static async deleteArticle(articleId: string) {
    try {
      const { error } = await supabase
        .from('educational_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  }

  /**
   * Publish article
   */
  static async publishArticle(articleId: string) {
    try {
      const { data, error } = await supabase
        .from('educational_articles')
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq('id', articleId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error publishing article:', error);
      throw error;
    }
  }

  /**
   * Mark article as read
   */
  static async markArticleRead(userId: string, articleId: string) {
    try {
      const { data, error } = await supabase
        .from('article_progress')
        .upsert(
          {
            user_id: userId,
            article_id: articleId,
            read: true,
            read_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,article_id' }
        )
        .select()
        .single();

      if (error) throw error;

      // Increment views count
      await supabase
        .from('educational_articles')
        .update({ views_count: supabase.rpc('increment_views', { article_id: articleId }) })
        .eq('id', articleId);

      return { success: true, data };
    } catch (error) {
      console.error('Error marking article read:', error);
      throw error;
    }
  }

  /**
   * Submit quiz for article
   */
  static async submitArticleQuiz(
    userId: string,
    articleId: string,
    quizScore: number
  ) {
    try {
      const { data, error } = await supabase
        .from('article_progress')
        .upsert(
          {
            user_id: userId,
            article_id: articleId,
            quiz_score: quizScore,
          },
          { onConflict: 'user_id,article_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  }

  /**
   * Bookmark article
   */
  static async toggleArticleBookmark(userId: string, articleId: string, bookmarked: boolean) {
    try {
      const { data, error } = await supabase
        .from('article_progress')
        .upsert(
          {
            user_id: userId,
            article_id: articleId,
            bookmarked: bookmarked,
          },
          { onConflict: 'user_id,article_id' }
        )
        .select()
        .single();

      if (error) throw error;

      // Update bookmarks count
      const increment = bookmarked ? 1 : -1;
      await supabase.rpc('increment_article_bookmarks', {
        article_id: articleId,
        increment: increment,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw error;
    }
  }

  /**
   * Like article
   */
  static async toggleArticleLike(userId: string, articleId: string, liked: boolean) {
    try {
      const { data, error } = await supabase
        .from('article_progress')
        .upsert(
          {
            user_id: userId,
            article_id: articleId,
            liked: liked,
          },
          { onConflict: 'user_id,article_id' }
        )
        .select()
        .single();

      if (error) throw error;

      // Update likes count
      const increment = liked ? 1 : -1;
      await supabase.rpc('increment_article_likes', {
        article_id: articleId,
        increment: increment,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Get user's article progress
   */
  static async getUserArticleProgress(userId: string, articleId: string) {
    try {
      const { data, error } = await supabase
        .from('article_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('article_id', articleId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data || null;
    } catch (error) {
      console.error('Error fetching article progress:', error);
      throw error;
    }
  }

  /**
   * Claim article reward
   */
  static async claimArticleReward(
    userId: string,
    articleId: string,
    rewardType: 'reading' | 'quiz_completion' | 'perfect_score',
    amount: number
  ) {
    try {
      const { data, error } = await supabase
        .from('article_reward_claims')
        .insert({
          user_id: userId,
          article_id: articleId,
          reward_type: rewardType,
          amount: amount,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error claiming reward:', error);
      throw error;
    }
  }

  /**
   * Check if reward has been claimed
   */
  static async hasClaimedReward(
    userId: string,
    articleId: string,
    rewardType: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('article_reward_claims')
        .select('id')
        .eq('user_id', userId)
        .eq('article_id', articleId)
        .eq('reward_type', rewardType)
        .single();

      if (error && error.code === 'PGRST116') return false; // Not found
      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking reward claim:', error);
      throw error;
    }
  }

  /**
   * Get user's bookmarked articles
   */
  static async getUserBookmarkedArticles(userId: string) {
    try {
      const { data, error } = await supabase
        .from('article_progress')
        .select(`
          *,
          educational_articles(*)
        `)
        .eq('user_id', userId)
        .eq('bookmarked', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bookmarked articles:', error);
      throw error;
    }
  }

  /**
   * Increment quiz attempts
   */
  static async incrementQuizAttempts(articleId: string) {
    try {
      const { data, error } = await supabase.rpc('increment_quiz_attempts', {
        article_id: articleId,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error incrementing quiz attempts:', error);
      throw error;
    }
  }
}

export default ArticleDbService;

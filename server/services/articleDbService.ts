import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: any = null;

// Only initialize Supabase if credentials are available
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.warn('Failed to initialize Supabase client in ArticleDbService:', error);
  }
} else {
  console.warn('Supabase credentials not configured. Article database features will be unavailable.');
}

export interface ArticleInput {
  title: string;
  excerpt?: string;
  content: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  category?: string;
  reading_time?: number;
  featured_image?: string;
  quiz_questions?: any;
  tags?: string[];
  reward_reading?: number;
  reward_completion?: number;
  author_avatar?: string;
  author_name?: string;
  author_bio?: string;
}

export interface ArticleUpdateInput extends Partial<ArticleInput> {
  is_published?: boolean;
  published_at?: string;
  is_active?: boolean;
}

export class ArticleDbService {
  private static ensureSupabase() {
    if (!supabase) {
      throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }
  }

  /**
   * Create a new article
   */
  static async createArticle(authorId: string, input: ArticleInput) {
    try {
      this.ensureSupabase();
      const { data, error } = await supabase
        .from('articles')
        .insert({
          author_id: authorId,
          title: input.title,
          excerpt: input.excerpt || '',
          content: input.content,
          difficulty: input.difficulty || 'Beginner',
          category: input.category || '',
          reading_time: input.reading_time || 0,
          featured_image: input.featured_image || '',
          quiz_questions: input.quiz_questions || [],
          tags: input.tags || [],
          reward_reading: input.reward_reading || 0.5,
          reward_completion: input.reward_completion || 2,
          author_avatar: input.author_avatar || '',
          author_name: input.author_name || '',
          author_bio: input.author_bio || '',
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
      this.ensureSupabase();
      const { data, error } = await supabase
        .from('articles')
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
  static async getAllPublishedArticles(filters?: { category?: string; difficulty?: string }) {
    try {
      this.ensureSupabase();
      let query = supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .eq('is_active', true);

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
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
      this.ensureSupabase();
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('author_id', authorId)
        .order('published_at', { ascending: false });

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
      this.ensureSupabase();
      const { data, error } = await supabase
        .from('articles')
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
      this.ensureSupabase();
      const { error } = await supabase.from('articles').delete().eq('id', articleId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  }
}

export default ArticleDbService;

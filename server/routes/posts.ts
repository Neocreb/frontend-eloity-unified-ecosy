import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { PostService } from '../../src/services/postService.js';
import { supabase } from '../../src/integrations/supabase/client.js';

const router = express.Router();

// Search endpoint for global search
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchQuery = `%${q}%`;

    // Search posts from Supabase
    const { data: postsResult, error } = await supabase
      .from('posts')
      .select('id, content, created_at, user_id, likes_count, comments_count, shares_count')
      .or(`content.ilike.${searchQuery}`)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (error) {
      logger.warn('Error searching posts from Supabase:', error);
      return res.json({ posts: [] });
    }

    const posts = (postsResult || []).map((post: any) => ({
      id: post.id,
      title: post.content ? post.content.substring(0, 50) + '...' : 'Untitled Post',
      content: post.content || 'No content available',
      category: 'General',
      author: {
        id: post.user_id,
        name: 'User',
        verified: false
      },
      stats: {
        views: 0,
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        shares: post.shares_count || 0
      },
      createdAt: post.created_at
    }));

    res.json({ posts });
  } catch (error) {
    logger.error('Error searching posts:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

// Get all posts (with pagination, filtering)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let posts;
    if (userId) {
      posts = await PostService.getUserPosts(userId as string, parseInt(limit as string), offset);
    } else {
      // For feed posts, we would need the current user's ID, but since this endpoint is not authenticated
      // we'll return an empty array or handle it differently based on your needs
      posts = [];
    }

    logger.info('Posts fetched', { page, limit, count: posts.length });
    res.json({
      data: posts,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: posts.length,
        totalPages: 1
      }
    });
  } catch (error) {
    logger.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const post = await PostService.getPostById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    logger.info('Post fetched', { postId: id });
    res.json(post);
  } catch (error) {
    logger.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create new post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, type = 'text', media_urls = [], privacy = 'public' } = req.body;
    const userId = req.userId;

    if (!content && (!media_urls || media_urls.length === 0)) {
      return res.status(400).json({ error: 'Content or media is required' });
    }

    const postData = {
      user_id: userId,
      content,
      type,
      media_urls,
      privacy
    };

    const newPost = await PostService.createPost(postData);

    if (!newPost) {
      return res.status(500).json({ error: 'Failed to create post' });
    }

    logger.info('Post created', { postId: newPost.id, userId });
    res.status(201).json(newPost);
  } catch (error) {
    logger.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, media_urls, privacy } = req.body;
    const userId = req.userId;

    // Type guard to ensure userId is a string
    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // First, check if the post exists and belongs to the user
    const existingPost = await PostService.getPostById(id);
    
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Cast to any to access user_id property (it should be there from the original post data)
    if ((existingPost as any).user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const { data, error } = await supabase
      .from('posts')
      .update({
        content,
        media_urls,
        privacy,
        updated_at: new Date()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating post:', error);
      return res.status(500).json({ error: 'Failed to update post' });
    }

    logger.info('Post updated', { postId: id, userId });
    res.json(data);
  } catch (error) {
    logger.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Type guard to ensure userId is a string
    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const success = await PostService.deletePost(id, userId);

    if (!success) {
      return res.status(404).json({ error: 'Post not found or not authorized' });
    }

    logger.info('Post deleted', { postId: id, userId });
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Like/Unlike post
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Type guard to ensure userId is a string
    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if already liked
    const isLiked = await PostService.isPostLikedByUser(id, userId);
    
    let result;
    if (isLiked) {
      // Unlike
      const success = await PostService.unlikePost(id, userId);
      result = {
        postId: id,
        liked: false
      };
    } else {
      // Like
      const success = await PostService.likePost(id, userId);
      result = {
        postId: id,
        liked: true
      };
    }

    // Get updated likes count
    const likesCount = await PostService.getPostLikesCount(id);
    result.likes_count = likesCount;

    logger.info('Post like toggled', { postId: id, userId, liked: result.liked });
    res.json(result);
  } catch (error) {
    logger.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Get post comments
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const comments = await PostService.getPostComments(id, parseInt(limit as string), offset);

    logger.info('Comments fetched', { postId: id, count: comments.length });
    res.json({
      data: comments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: comments.length,
        totalPages: 1
      }
    });
  } catch (error) {
    logger.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add comment to post
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parent_id = null } = req.body;
    const userId = req.userId;

    // Type guard to ensure userId is a string
    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const newComment = await PostService.addComment(id, userId, content);

    if (!newComment) {
      return res.status(500).json({ error: 'Failed to add comment' });
    }

    logger.info('Comment added', { postId: id, commentId: (newComment as any).id, userId });
    res.status(201).json(newComment);
  } catch (error) {
    logger.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;

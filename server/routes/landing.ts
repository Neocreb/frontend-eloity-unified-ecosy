import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import {
  TestimonialsService,
  FAQsService,
  UseCasesService,
  SocialProofStatsService,
  ComparisonMatrixService,
  WaitlistService,
} from '../services/landingService.js';

const router = Router();

// Rate limiting for waitlist signups
const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour per IP
  message: 'Too many waitlist signups, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// TESTIMONIALS ENDPOINTS
// ============================================================================

/**
 * GET /api/landing/testimonials
 * Get testimonials with optional filtering
 */
router.get('/testimonials', async (req: Request, res: Response) => {
  try {
    const { category, featured } = req.query;

    const testimonials = await Promise.race([
      TestimonialsService.getTestimonials({
        category: category as string,
        featured: featured === 'true',
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      ),
    ]) as any[];

    if (!testimonials) {
      return res.json([]);
    }

    res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    // Return empty array as fallback instead of error
    res.json([]);
  }
});

// ============================================================================
// FAQS ENDPOINTS
// ============================================================================

/**
 * GET /api/landing/faqs
 * Get FAQs with optional filtering
 */
router.get('/faqs', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const faqs = await Promise.race([
      FAQsService.getFAQs({
        category: category as string,
        active: true,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      ),
    ]) as any[];

    if (!faqs) {
      return res.json([]);
    }

    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    // Return empty array as fallback instead of error
    res.json([]);
  }
});

// ============================================================================
// USE CASES ENDPOINTS
// ============================================================================

/**
 * GET /api/landing/use-cases
 * Get use cases with optional filtering
 */
router.get('/use-cases', async (req: Request, res: Response) => {
  try {
    const { user_type, featured } = req.query;

    const useCases = await Promise.race([
      UseCasesService.getUseCases({
        user_type: user_type as string,
        featured: featured === 'true',
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      ),
    ]) as any[];

    if (!useCases) {
      return res.json([]);
    }

    res.json(useCases);
  } catch (error) {
    console.error('Error fetching use cases:', error);
    // Return empty array as fallback instead of error
    res.json([]);
  }
});

// ============================================================================
// SOCIAL PROOF STATS ENDPOINTS
// ============================================================================

/**
 * GET /api/landing/social-proof-stats
 * Get all social proof statistics
 */
router.get('/social-proof-stats', async (req: Request, res: Response) => {
  try {
    const stats = await SocialProofStatsService.getAllStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/landing/stats/overview
 * Get all landing page stats for hero section
 */
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const stats = await SocialProofStatsService.getAllStats();
    const testimonials = await TestimonialsService.getTestimonials({
      featured: true,
    });
    const useCases = await UseCasesService.getUseCases({
      featured: true,
    });

    res.json({
      stats,
      testimonials: testimonials.slice(0, 3),
      useCases: useCases.slice(0, 2),
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// ============================================================================
// COMPARISON MATRIX ENDPOINTS
// ============================================================================

/**
 * GET /api/landing/comparison-matrix
 * Get comparison matrix with optional filtering
 */
router.get('/comparison-matrix', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const comparisons = await Promise.race([
      ComparisonMatrixService.getComparisons({
        category: category as string,
        active: true,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      ),
    ]) as any[];

    if (!comparisons) {
      return res.json([]);
    }

    res.json(comparisons);
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    // Return empty array as fallback instead of error
    res.json([]);
  }
});

// ============================================================================
// WAITLIST ENDPOINTS
// ============================================================================

/**
 * POST /api/landing/waitlist
 * Add user to waitlist
 */
router.post('/waitlist', waitlistLimiter, async (req: Request, res: Response) => {
  try {
    const { email, name, user_type_interested, country, phone, message, source } =
      req.body;

    // Validate required fields
    if (!email || !name) {
      return res
        .status(400)
        .json({ error: 'Email and name are required' });
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email already exists
    const exists = await WaitlistService.checkEmailExists(email);
    if (exists) {
      return res
        .status(409)
        .json({ error: 'Email already on waitlist' });
    }

    // Calculate lead score based on interest signals
    let leadScore = 10;
    if (user_type_interested && user_type_interested !== 'not_sure') leadScore += 20;
    if (country) leadScore += 10;
    if (message && message.length > 20) leadScore += 15;

    const lead = await WaitlistService.addToWaitlist({
      email,
      name,
      user_type_interested: user_type_interested || 'not_sure',
      country,
      phone,
      message,
      source: source || 'homepage',
      lead_score: leadScore,
    });

    res.status(201).json({
      message: 'Successfully added to waitlist',
      lead,
    });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

/**
 * GET /api/landing/waitlist/status
 * Check if email is on waitlist
 */
router.get('/waitlist/status', async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const exists = await WaitlistService.checkEmailExists(email as string);

    res.json({
      onWaitlist: exists,
    });
  } catch (error) {
    console.error('Error checking waitlist status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

export default router;

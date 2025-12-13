import { Router, Request, Response } from 'express';
import {
  TestimonialsService,
  FAQsService,
  UseCasesService,
  SocialProofStatsService,
  ComparisonMatrixService,
  WaitlistService,
} from '../services/landingService.js';

const router = Router();

// ============================================================================
// ADMIN AUTH MIDDLEWARE
// ============================================================================

function requireAdminAuth(req: Request, res: Response, next: Function) {
  const userId = (req as any).userId;
  const userRole = (req as any).userRole;

  if (!userId || userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

// Apply admin auth to all routes
router.use(requireAdminAuth);

// ============================================================================
// TESTIMONIALS ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/landing/testimonials
 * Get all testimonials for admin
 */
router.get('/testimonials', async (req: Request, res: Response) => {
  try {
    const { category, featured } = req.query;

    const testimonials = await TestimonialsService.getTestimonials({
      category: category as string,
      featured: featured === 'true' ? true : undefined,
    });

    res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

/**
 * POST /api/admin/landing/testimonials
 * Create new testimonial
 */
router.post('/testimonials', async (req: Request, res: Response) => {
  try {
    const { name, title, quote, image_url, metrics, category, rating, is_verified, is_featured, order } =
      req.body;

    if (!name || !title || !quote) {
      return res
        .status(400)
        .json({ error: 'Name, title, and quote are required' });
    }

    const testimonial = await TestimonialsService.createTestimonial({
      name,
      title,
      quote,
      image_url,
      metrics,
      category,
      rating,
      is_verified,
      is_featured,
      order,
    });

    res.status(201).json(testimonial);
  } catch (error) {
    console.error('Error creating testimonial:', error);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

/**
 * PATCH /api/admin/landing/testimonials/:id
 * Update testimonial
 */
router.patch('/testimonials/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const testimonial = await TestimonialsService.updateTestimonial(id, req.body);

    res.json(testimonial);
  } catch (error) {
    console.error('Error updating testimonial:', error);
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

/**
 * DELETE /api/admin/landing/testimonials/:id
 * Delete testimonial
 */
router.delete('/testimonials/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await TestimonialsService.deleteTestimonial(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

/**
 * POST /api/admin/landing/testimonials/reorder
 * Reorder testimonials
 */
router.post('/testimonials/reorder', async (req: Request, res: Response) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: 'Orders must be an array' });
    }

    await TestimonialsService.reorderTestimonials(orders);

    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering testimonials:', error);
    res.status(500).json({ error: 'Failed to reorder testimonials' });
  }
});

// ============================================================================
// FAQS ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/landing/faqs
 * Get all FAQs for admin
 */
router.get('/faqs', async (req: Request, res: Response) => {
  try {
    const { category, active } = req.query;

    const faqs = await FAQsService.getFAQs({
      category: category as string,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
    });

    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

/**
 * POST /api/admin/landing/faqs
 * Create new FAQ
 */
router.post('/faqs', async (req: Request, res: Response) => {
  try {
    const { question, answer, category, order, is_active } = req.body;

    if (!question || !answer) {
      return res
        .status(400)
        .json({ error: 'Question and answer are required' });
    }

    const faq = await FAQsService.createFAQ({
      question,
      answer,
      category,
      order,
      is_active,
    });

    res.status(201).json(faq);
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

/**
 * PATCH /api/admin/landing/faqs/:id
 * Update FAQ
 */
router.patch('/faqs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const faq = await FAQsService.updateFAQ(id, req.body);

    res.json(faq);
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

/**
 * DELETE /api/admin/landing/faqs/:id
 * Delete FAQ
 */
router.delete('/faqs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await FAQsService.deleteFAQ(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// ============================================================================
// USE CASES ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/landing/use-cases
 * Get all use cases for admin
 */
router.get('/use-cases', async (req: Request, res: Response) => {
  try {
    const { user_type, featured } = req.query;

    const useCases = await UseCasesService.getUseCases({
      user_type: user_type as string,
      featured: featured === 'true' ? true : undefined,
    });

    res.json(useCases);
  } catch (error) {
    console.error('Error fetching use cases:', error);
    res.status(500).json({ error: 'Failed to fetch use cases' });
  }
});

/**
 * POST /api/admin/landing/use-cases
 * Create new use case
 */
router.post('/use-cases', async (req: Request, res: Response) => {
  try {
    const {
      user_type,
      title,
      description,
      avatar_url,
      results,
      timeline_weeks,
      image_url,
      is_featured,
      order,
    } = req.body;

    if (!user_type || !title || !description) {
      return res
        .status(400)
        .json({ error: 'User type, title, and description are required' });
    }

    const useCase = await UseCasesService.createUseCase({
      user_type,
      title,
      description,
      avatar_url,
      results,
      timeline_weeks,
      image_url,
      is_featured,
      order,
    });

    res.status(201).json(useCase);
  } catch (error) {
    console.error('Error creating use case:', error);
    res.status(500).json({ error: 'Failed to create use case' });
  }
});

/**
 * PATCH /api/admin/landing/use-cases/:id
 * Update use case
 */
router.patch('/use-cases/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const useCase = await UseCasesService.updateUseCase(id, req.body);

    res.json(useCase);
  } catch (error) {
    console.error('Error updating use case:', error);
    res.status(500).json({ error: 'Failed to update use case' });
  }
});

/**
 * DELETE /api/admin/landing/use-cases/:id
 * Delete use case
 */
router.delete('/use-cases/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await UseCasesService.deleteUseCase(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting use case:', error);
    res.status(500).json({ error: 'Failed to delete use case' });
  }
});

// ============================================================================
// SOCIAL PROOF STATS ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/landing/stats
 * Get all stats for admin
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await SocialProofStatsService.getAllStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * PATCH /api/admin/landing/stats/:metric_name
 * Update stat value
 */
router.patch('/stats/:metric_name', async (req: Request, res: Response) => {
  try {
    const { metric_name } = req.params;
    const { current_value } = req.body;

    if (current_value === undefined) {
      return res.status(400).json({ error: 'Current value is required' });
    }

    const stat = await SocialProofStatsService.updateStat(
      metric_name,
      Number(current_value)
    );

    res.json(stat);
  } catch (error) {
    console.error('Error updating stat:', error);
    res.status(500).json({ error: 'Failed to update stat' });
  }
});

// ============================================================================
// COMPARISON MATRIX ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/landing/comparison
 * Get all comparisons for admin
 */
router.get('/comparison', async (req: Request, res: Response) => {
  try {
    const { category, active } = req.query;

    const comparisons = await ComparisonMatrixService.getComparisons({
      category: category as string,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
    });

    res.json(comparisons);
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    res.status(500).json({ error: 'Failed to fetch comparisons' });
  }
});

/**
 * POST /api/admin/landing/comparison
 * Create new comparison
 */
router.post('/comparison', async (req: Request, res: Response) => {
  try {
    const {
      feature_name,
      category,
      eloity_has,
      feature_description,
      competitors,
      order,
      is_active,
    } = req.body;

    if (!feature_name || !category) {
      return res
        .status(400)
        .json({ error: 'Feature name and category are required' });
    }

    const comparison = await ComparisonMatrixService.createComparison({
      feature_name,
      category,
      eloity_has,
      feature_description,
      competitors,
      order,
      is_active,
    });

    res.status(201).json(comparison);
  } catch (error) {
    console.error('Error creating comparison:', error);
    res.status(500).json({ error: 'Failed to create comparison' });
  }
});

/**
 * PATCH /api/admin/landing/comparison/:id
 * Update comparison
 */
router.patch('/comparison/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comparison = await ComparisonMatrixService.updateComparison(id, req.body);

    res.json(comparison);
  } catch (error) {
    console.error('Error updating comparison:', error);
    res.status(500).json({ error: 'Failed to update comparison' });
  }
});

/**
 * DELETE /api/admin/landing/comparison/:id
 * Delete comparison
 */
router.delete('/comparison/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await ComparisonMatrixService.deleteComparison(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comparison:', error);
    res.status(500).json({ error: 'Failed to delete comparison' });
  }
});

// ============================================================================
// WAITLIST ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/landing/waitlist
 * Get all waitlist leads
 */
router.get('/waitlist', async (req: Request, res: Response) => {
  try {
    const { status, minScore } = req.query;

    const leads = await WaitlistService.getWaitlist({
      status: status as string,
      minScore: minScore ? Number(minScore) : undefined,
    });

    res.json(leads);
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
});

/**
 * GET /api/admin/landing/waitlist/:id
 * Get specific waitlist lead
 */
router.get('/waitlist/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const lead = await WaitlistService.getWaitlistById(id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

/**
 * PATCH /api/admin/landing/waitlist/:id
 * Update waitlist lead
 */
router.patch('/waitlist/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const lead = await WaitlistService.updateWaitlistLead(id, req.body);

    res.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

/**
 * DELETE /api/admin/landing/waitlist/:id
 * Delete waitlist lead
 */
router.delete('/waitlist/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await WaitlistService.deleteWaitlistLead(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

/**
 * POST /api/admin/landing/waitlist/export
 * Export waitlist (paginated)
 */
router.post('/waitlist/export', async (req: Request, res: Response) => {
  try {
    const { status, format = 'json', limit = 1000 } = req.body;

    const leads = await WaitlistService.getWaitlist({
      status: status as string,
    });

    const paginated = leads.slice(0, limit);

    if (format === 'csv') {
      const csv = [
        ['ID', 'Email', 'Name', 'User Type', 'Country', 'Lead Score', 'Status', 'Created At'].join(','),
        ...paginated.map((lead: any) =>
          [
            lead.id,
            lead.email,
            lead.name,
            lead.user_type_interested,
            lead.country || '',
            lead.lead_score,
            lead.conversion_status,
            lead.created_at,
          ].join(',')
        ),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="waitlist.csv"');
      res.send(csv);
    } else {
      res.json(paginated);
    }
  } catch (error) {
    console.error('Error exporting waitlist:', error);
    res.status(500).json({ error: 'Failed to export waitlist' });
  }
});

export default router;

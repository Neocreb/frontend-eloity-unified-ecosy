import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import CourseDbService from '../services/courseDbService';
import EnrollmentService from '../services/enrollmentService';

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
 * GET /api/courses
 * Get all published courses with filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { level, category, courseType, search } = req.query;

    let query = supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .eq('is_active', true);

    if (level) {
      query = query.eq('level', level as string);
    }
    if (category) {
      query = query.eq('category', category as string);
    }
    if (courseType) {
      query = query.eq('course_type', courseType as string);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    let courses = data || [];

    // Simple search filter for title/description
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      courses = courses.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm) ||
          course.description?.toLowerCase().includes(searchTerm)
      );
    }

    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * GET /api/courses/:id
 * Get course details with lessons
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const course = await CourseDbService.getCourseById(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

/**
 * POST /api/courses/:id/enroll
 * Enroll user in a course
 */
router.post('/:id/enroll', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const result = await EnrollmentService.enrollUserInCourse(userId, id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error enrolling user:', error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

/**
 * GET /api/courses/:id/enrollment
 * Get user's enrollment status for a course
 */
router.get('/:id/enrollment', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const enrollment = await CourseDbService.getUserEnrollment(userId, id);
    res.json(enrollment || { enrolled: false });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment' });
  }
});

/**
 * GET /api/courses/:id/progress
 * Get user's progress in a course
 */
router.get('/:id/progress', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const enrollment = await CourseDbService.getUserEnrollment(userId, id);
    if (!enrollment) {
      return res.status(404).json({ error: 'User not enrolled in course' });
    }

    const lessonProgress = await EnrollmentService.getLessonProgress(userId, id);

    res.json({
      enrollment,
      lessons: lessonProgress,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

/**
 * POST /api/courses/:id/lessons/:lessonId/complete
 * Mark lesson as completed
 */
router.post('/:id/lessons/:lessonId/complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id, lessonId } = req.params;
    const { quizScore } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const result = await EnrollmentService.completeLesson(userId, id, lessonId, quizScore);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

/**
 * POST /api/courses/:id/complete
 * Mark course as completed
 */
router.post('/:id/complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const enrollment = await CourseDbService.getUserEnrollment(userId, id);
    if (!enrollment) {
      return res.status(404).json({ error: 'User not enrolled in course' });
    }

    // Update enrollment status
    const { data, error } = await supabase
      .from('course_enrollments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress_percentage: 100,
      })
      .eq('id', enrollment.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error completing course:', error);
    res.status(500).json({ error: 'Failed to complete course' });
  }
});

/**
 * GET /api/courses/user/enrollments
 * Get user's enrolled courses
 */
router.get('/user/enrollments', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const enrollments = await EnrollmentService.getUserCourseEnrollments(userId);
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

/**
 * GET /api/courses/user/stats
 * Get user's course statistics
 */
router.get('/user/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const stats = await EnrollmentService.getCourseStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;

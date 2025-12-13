import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import CourseDbService from '../services/courseDbService';

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
 * POST /api/creator/courses
 * Create a new creator course
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      level,
      category,
      duration,
      objectives,
      requirements,
      tags,
      price,
      currency,
      is_paid,
      thumbnail_url,
      banner_url,
      instructor_avatar,
      instructor_name,
      instructor_title,
      instructor_bio,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const instructorId = req.user?.id;
    if (!instructorId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const result = await CourseDbService.createCourse(instructorId, 'creator', {
      title,
      description,
      level,
      category,
      duration,
      objectives,
      requirements,
      tags,
      price,
      currency,
      is_paid,
      thumbnail_url,
      banner_url,
      instructor_avatar,
      instructor_name,
      instructor_title,
      instructor_bio,
      reward_enrollment: 0.5,
      reward_completion: 5,
      reward_certificate: 10,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating creator course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

/**
 * GET /api/creator/courses
 * Get user's created courses
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const courses = await CourseDbService.getCoursesByInstructor(userId);

    // Filter to only creator courses
    const creatorCourses = courses.filter((c) => c.course_type === 'creator');

    res.json(creatorCourses);
  } catch (error) {
    console.error('Error fetching creator courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * GET /api/creator/courses/:id
 * Get user's course details
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const course = await CourseDbService.getCourseById(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Verify ownership
    if (course.instructor_id !== userId) {
      return res.status(403).json({ error: 'Forbidden - Not course owner' });
    }

    res.json(course);
  } catch (error) {
    console.error('Error fetching creator course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

/**
 * PUT /api/creator/courses/:id
 * Update user's course
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const course = await CourseDbService.getCourseById(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Verify ownership
    if (course.instructor_id !== userId) {
      return res.status(403).json({ error: 'Forbidden - Not course owner' });
    }

    const result = await CourseDbService.updateCourse(id, updateData);
    res.json(result);
  } catch (error) {
    console.error('Error updating creator course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

/**
 * DELETE /api/creator/courses/:id
 * Delete user's course
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const course = await CourseDbService.getCourseById(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Verify ownership
    if (course.instructor_id !== userId) {
      return res.status(403).json({ error: 'Forbidden - Not course owner' });
    }

    const result = await CourseDbService.deleteCourse(id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting creator course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

/**
 * POST /api/creator/courses/:id/lessons
 * Add lesson to user's course
 */
router.post('/:id/lessons', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const lessonData = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const course = await CourseDbService.getCourseById(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Verify ownership
    if (course.instructor_id !== userId) {
      return res.status(403).json({ error: 'Forbidden - Not course owner' });
    }

    const result = await CourseDbService.addLesson(id, lessonData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding lesson:', error);
    res.status(500).json({ error: 'Failed to add lesson' });
  }
});

/**
 * PUT /api/creator/courses/:courseId/lessons/:lessonId
 * Update lesson in user's course
 */
router.put('/:courseId/lessons/:lessonId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const course = await CourseDbService.getCourseById(courseId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Verify ownership
    if (course.instructor_id !== userId) {
      return res.status(403).json({ error: 'Forbidden - Not course owner' });
    }

    const result = await CourseDbService.updateLesson(lessonId, updateData);
    res.json(result);
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

/**
 * DELETE /api/creator/courses/:courseId/lessons/:lessonId
 * Delete lesson from user's course
 */
router.delete('/:courseId/lessons/:lessonId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const course = await CourseDbService.getCourseById(courseId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Verify ownership
    if (course.instructor_id !== userId) {
      return res.status(403).json({ error: 'Forbidden - Not course owner' });
    }

    const result = await CourseDbService.deleteLesson(lessonId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

/**
 * POST /api/creator/courses/:id/publish
 * Publish user's course
 */
router.post('/:id/publish', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const course = await CourseDbService.getCourseById(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Verify ownership
    if (course.instructor_id !== userId) {
      return res.status(403).json({ error: 'Forbidden - Not course owner' });
    }

    const result = await CourseDbService.updateCourse(id, {
      is_published: true,
      published_at: new Date().toISOString(),
    });

    res.json(result);
  } catch (error) {
    console.error('Error publishing course:', error);
    res.status(500).json({ error: 'Failed to publish course' });
  }
});

/**
 * GET /api/creator/courses/:id/stats
 * Get creator's course statistics
 */
router.get('/:id/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const course = await CourseDbService.getCourseById(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Verify ownership
    if (course.instructor_id !== userId) {
      return res.status(403).json({ error: 'Forbidden - Not course owner' });
    }

    const enrollments = await CourseDbService.getCourseEnrollments(id);

    const stats = {
      totalEnrollments: enrollments.length,
      completedEnrollments: enrollments.filter((e) => e.status === 'completed').length,
      averageProgress:
        enrollments.length > 0
          ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length)
          : 0,
      totalTimeSpent: enrollments.reduce((sum, e) => sum + (e.time_spent_minutes || 0), 0),
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching course stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;

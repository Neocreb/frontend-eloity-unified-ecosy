import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import CourseDbService from '../services/courseDbService';

const router = Router();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
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
 * POST /api/admin/courses
 * Create a new platform course (admin only)
 */
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, description, level, category, duration, objectives, requirements, tags, ...otherFields } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const instructorId = req.user?.id;
    if (!instructorId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const result = await CourseDbService.createCourse('platform', 'platform', {
      title,
      description,
      level,
      category,
      duration,
      objectives,
      requirements,
      tags,
      ...otherFields,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

/**
 * GET /api/admin/courses/:id
 * Get course details (admin only)
 */
router.get('/:id', requireAdmin, async (req: Request, res: Response) => {
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
 * PUT /api/admin/courses/:id
 * Update course (admin only)
 */
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await CourseDbService.updateCourse(id, updateData);
    res.json(result);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

/**
 * DELETE /api/admin/courses/:id
 * Delete course (admin only)
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await CourseDbService.deleteCourse(id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

/**
 * POST /api/admin/courses/:id/lessons
 * Add lesson to course (admin only)
 */
router.post('/:id/lessons', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lessonData = req.body;

    const result = await CourseDbService.addLesson(id, lessonData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding lesson:', error);
    res.status(500).json({ error: 'Failed to add lesson' });
  }
});

/**
 * PUT /api/admin/courses/:courseId/lessons/:lessonId
 * Update lesson (admin only)
 */
router.put('/:courseId/lessons/:lessonId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const updateData = req.body;

    const result = await CourseDbService.updateLesson(lessonId, updateData);
    res.json(result);
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

/**
 * DELETE /api/admin/courses/:courseId/lessons/:lessonId
 * Delete lesson (admin only)
 */
router.delete('/:courseId/lessons/:lessonId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const result = await CourseDbService.deleteLesson(lessonId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

/**
 * GET /api/admin/courses/:id/enrollments
 * Get all student enrollments for a course (admin only)
 */
router.get('/:id/enrollments', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const enrollments = await CourseDbService.getCourseEnrollments(id);
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

/**
 * GET /api/admin/courses
 * List all courses (admin only)
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { level, category, courseType } = req.query;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    let courses;
    if (courseType === 'platform') {
      // Admin can see all platform courses
      courses = await CourseDbService.getAllPublishedCourses({
        level: level as string,
        category: category as string,
        courseType: 'platform',
      });
    } else {
      // Get all courses for admin view
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      courses = data || [];
    }

    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * POST /api/admin/courses/:id/publish
 * Publish course (admin only)
 */
router.post('/:id/publish', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

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
 * POST /api/admin/courses/:id/unpublish
 * Unpublish course (admin only)
 */
router.post('/:id/unpublish', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await CourseDbService.updateCourse(id, {
      is_published: false,
    });

    res.json(result);
  } catch (error) {
    console.error('Error unpublishing course:', error);
    res.status(500).json({ error: 'Failed to unpublish course' });
  }
});

export default router;

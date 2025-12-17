import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: any = null;

// Only initialize Supabase if credentials are available
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
  }
} else {
  console.warn('Supabase credentials not configured. Course database features will be unavailable.');
}

export interface CourseInput {
  title: string;
  description?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  category?: string;
  duration?: string;
  thumbnail_url?: string;
  banner_url?: string;
  price?: number;
  currency?: string;
  is_paid?: boolean;
  objectives?: string[];
  requirements?: string[];
  tags?: string[];
  has_certificate?: boolean;
  reward_enrollment?: number;
  reward_completion?: number;
  reward_certificate?: number;
  instructor_avatar?: string;
  instructor_name?: string;
  instructor_title?: string;
  instructor_bio?: string;
}

export interface CourseUpdateInput extends Partial<CourseInput> {
  is_published?: boolean;
  published_at?: string;
  is_active?: boolean;
}

export interface LessonInput {
  title: string;
  description?: string;
  lesson_type?: 'video' | 'text' | 'quiz' | 'interactive';
  content?: string;
  video_url?: string;
  duration?: number;
  sort_order?: number;
  quiz_questions?: any;
}

export class CourseDbService {
  private static ensureSupabase() {
    if (!supabase) {
      throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }
  }

  /**
   * Create a new course
   */
  static async createCourse(
    instructorId: string,
    courseType: 'platform' | 'creator',
    input: CourseInput
  ) {
    try {
      this.ensureSupabase();
      const { data, error } = await supabase
        .from('courses')
        .insert({
          instructor_id: instructorId,
          course_type: courseType,
          title: input.title,
          description: input.description || '',
          level: input.level || 'Beginner',
          category: input.category || '',
          duration: input.duration || '',
          thumbnail_url: input.thumbnail_url || '',
          banner_url: input.banner_url || '',
          price: input.price || 0,
          currency: input.currency || 'USD',
          is_paid: input.is_paid || false,
          objectives: input.objectives || [],
          requirements: input.requirements || [],
          tags: input.tags || [],
          has_certificate: input.has_certificate !== false,
          reward_enrollment: input.reward_enrollment || 0.25,
          reward_completion: input.reward_completion || 3,
          reward_certificate: input.reward_certificate || 5,
          instructor_avatar: input.instructor_avatar || '',
          instructor_name: input.instructor_name || '',
          instructor_title: input.instructor_title || '',
          instructor_bio: input.instructor_bio || '',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  /**
   * Get course by ID
   */
  static async getCourseById(courseId: string) {
    try {
      this.ensureSupabase();
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_lessons(*)
        `)
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  }

  /**
   * Get all published courses
   */
  static async getAllPublishedCourses(filters?: {
    level?: string;
    category?: string;
    courseType?: 'platform' | 'creator';
  }) {
    try {
      this.ensureSupabase();
      let query = supabase
        .from('courses')
        .select(`
          *,
          course_lessons(id)
        `)
        .eq('is_published', true)
        .eq('is_active', true);

      if (filters?.level) {
        query = query.eq('level', filters.level);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.courseType) {
        query = query.eq('course_type', filters.courseType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  /**
   * Get courses by instructor
   */
  static async getCoursesByInstructor(instructorId: string) {
    try {
      this.ensureSupabase();
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_lessons(id)
        `)
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching instructor courses:', error);
      throw error;
    }
  }

  /**
   * Update course
   */
  static async updateCourse(courseId: string, input: CourseUpdateInput) {
    try {
      this.ensureSupabase();
      const { data, error } = await supabase
        .from('courses')
        .update(input)
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  /**
   * Delete course
   */
  static async deleteCourse(courseId: string) {
    try {
      this.ensureSupabase();
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  /**
   * Add lesson to course
   */
  static async addLesson(courseId: string, input: LessonInput) {
    try {
      this.ensureSupabase();
      const { data, error } = await supabase
        .from('course_lessons')
        .insert({
          course_id: courseId,
          title: input.title,
          description: input.description || '',
          lesson_type: input.lesson_type || 'video',
          content: input.content || '',
          video_url: input.video_url || '',
          duration: input.duration || 0,
          sort_order: input.sort_order || 0,
          quiz_questions: input.quiz_questions || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error adding lesson:', error);
      throw error;
    }
  }

  /**
   * Update lesson
   */
  static async updateLesson(lessonId: string, input: Partial<LessonInput>) {
    try {
      this.ensureSupabase();
      const { data, error } = await supabase
        .from('course_lessons')
        .update(input)
        .eq('id', lessonId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  }

  /**
   * Delete lesson
   */
  static async deleteLesson(lessonId: string) {
    try {
      this.ensureSupabase();
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  }

  /**
   * Get course lessons
   */
  static async getCourseLessons(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  }

  /**
   * Enroll user in course
   */
  static async enrollInCourse(userId: string, courseId: string) {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          status: 'enrolled',
        })
        .select()
        .single();

      if (error) throw error;

      // Increment total_students count
      await supabase
        .from('courses')
        .update({ total_students: supabase.rpc('increment_students', { course_id: courseId }) })
        .eq('id', courseId);

      return { success: true, data };
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }

  /**
   * Get user enrollment for a course
   */
  static async getUserEnrollment(userId: string, courseId: string) {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data || null;
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      throw error;
    }
  }

  /**
   * Get user's enrollments
   */
  static async getUserEnrollments(userId: string) {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses(*)
        `)
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user enrollments:', error);
      throw error;
    }
  }

  /**
   * Update enrollment progress
   */
  static async updateEnrollmentProgress(
    enrollmentId: string,
    progressPercentage: number,
    completedLessons: string[]
  ) {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .update({
          progress_percentage: progressPercentage,
          completed_lessons: completedLessons,
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating enrollment progress:', error);
      throw error;
    }
  }

  /**
   * Mark lesson as completed
   */
  static async markLessonComplete(
    userId: string,
    lessonId: string,
    courseId: string,
    quizScore?: number
  ) {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert(
          {
            user_id: userId,
            lesson_id: lessonId,
            course_id: courseId,
            completed: true,
            completed_at: new Date().toISOString(),
            quiz_score: quizScore,
          },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      throw error;
    }
  }

  /**
   * Get course enrollments (for instructors to view students)
   */
  static async getCourseEnrollments(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          user:user_id(id, email)
        `)
        .eq('course_id', courseId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching course enrollments:', error);
      throw error;
    }
  }

  /**
   * Claim course reward
   */
  static async claimCourseReward(
    userId: string,
    courseId: string,
    rewardType: 'enrollment' | 'completion' | 'certificate',
    amount: number
  ) {
    try {
      const { data, error } = await supabase
        .from('course_reward_claims')
        .insert({
          user_id: userId,
          course_id: courseId,
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
    courseId: string,
    rewardType: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('course_reward_claims')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
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
}

export default CourseDbService;

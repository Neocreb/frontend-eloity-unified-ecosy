import { createClient } from '@supabase/supabase-js';
import CourseDbService from './courseDbService';
import { ActivityRewardService } from '../services/activityRewardService';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export class EnrollmentService {
  /**
   * Enroll user in a course
   */
  static async enrollUserInCourse(userId: string, courseId: string) {
    try {
      // Check if already enrolled
      const existing = await CourseDbService.getUserEnrollment(userId, courseId);
      if (existing) {
        return { success: false, message: 'Already enrolled in this course', data: existing };
      }

      // Enroll user
      const result = await CourseDbService.enrollInCourse(userId, courseId);

      // Get course details for reward
      const course = await CourseDbService.getCourseById(courseId);

      // Award enrollment reward
      if (course && course.reward_enrollment > 0) {
        await this.awardEnrollmentReward(userId, courseId, course);
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error enrolling user:', error);
      throw error;
    }
  }

  /**
   * Mark lesson as completed and track progress
   */
  static async completeLesson(userId: string, courseId: string, lessonId: string, quizScore?: number) {
    try {
      // Mark lesson complete in database
      const lessonResult = await CourseDbService.markLessonComplete(userId, lessonId, courseId, quizScore);

      // Get enrollment to update progress
      const enrollment = await CourseDbService.getUserEnrollment(userId, courseId);
      if (!enrollment) {
        return { success: false, message: 'User not enrolled in course' };
      }

      // Get course to calculate new progress
      const course = await CourseDbService.getCourseById(courseId);
      if (!course) {
        return { success: false, message: 'Course not found' };
      }

      // Get all lessons to calculate progress
      const lessons = await CourseDbService.getCourseLessons(courseId);
      const currentProgress = enrollment.completed_lessons || [];
      const newProgress = [...new Set([...currentProgress, lessonId])]; // Avoid duplicates
      const progressPercentage = (newProgress.length / lessons.length) * 100;

      // Update enrollment progress
      await CourseDbService.updateEnrollmentProgress(enrollment.id, Math.round(progressPercentage), newProgress);

      // Award lesson completion reward
      if (course.reward_completion > 0) {
        await this.awardLessonCompletionReward(userId, courseId, lessonId, course);
      }

      // Award quiz reward if score provided
      if (quizScore !== undefined && quizScore >= 70 && course.reward_completion > 0) {
        await this.awardQuizCompletionReward(userId, courseId, lessonId, quizScore, course);
      }

      // Check if course is completed
      if (progressPercentage === 100) {
        // Update enrollment status
        await supabase
          .from('course_enrollments')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', enrollment.id);

        // Award completion reward
        if (course.reward_completion > 0) {
          await this.awardCourseCompletionReward(userId, courseId, course);
        }

        // Award certificate reward
        if (course.has_certificate && course.reward_certificate > 0) {
          await this.awardCertificateReward(userId, courseId, course);
        }
      }

      return { success: true, data: lessonResult.data };
    } catch (error) {
      console.error('Error completing lesson:', error);
      throw error;
    }
  }

  /**
   * Get user's course enrollments
   */
  static async getUserCourseEnrollments(userId: string) {
    try {
      const enrollments = await CourseDbService.getUserEnrollments(userId);
      return enrollments;
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      throw error;
    }
  }

  /**
   * Get course enrollment stats
   */
  static async getCourseStats(userId: string) {
    try {
      const enrollments = await CourseDbService.getUserEnrollments(userId);

      const totalCourses = enrollments.length;
      const completedCourses = enrollments.filter((e) => e.status === 'completed').length;
      const enrolledCourses = enrollments.filter((e) => e.status === 'enrolled').length;

      let totalTimeSpent = 0;
      let totalProgressPercentage = 0;

      enrollments.forEach((enrollment) => {
        totalTimeSpent += enrollment.time_spent_minutes || 0;
        totalProgressPercentage += enrollment.progress_percentage || 0;
      });

      const averageProgress = totalCourses > 0 ? totalProgressPercentage / totalCourses : 0;

      return {
        totalCourses,
        completedCourses,
        enrolledCourses,
        totalTimeSpent,
        averageProgress: Math.round(averageProgress),
      };
    } catch (error) {
      console.error('Error fetching course stats:', error);
      throw error;
    }
  }

  /**
   * Get lesson progress for user in a course
   */
  static async getLessonProgress(userId: string, courseId: string) {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
      throw error;
    }
  }

  // Private reward methods

  private static async awardEnrollmentReward(userId: string, courseId: string, course: any) {
    try {
      await ActivityRewardService.logActivity({
        userId,
        actionType: 'enroll_course',
        targetId: courseId,
        targetType: 'course',
        value: Number(course.reward_enrollment) || 0.25,
        metadata: {
          rewardType: 'enrollment',
          courseName: course.title,
          difficulty: course.level,
          points: Number(course.reward_enrollment),
        },
      });

      console.log(`✅ Enrollment reward earned! +${course.reward_enrollment} points for ${course.title}`);
    } catch (error) {
      console.error('Error awarding enrollment reward:', error);
    }
  }

  private static async awardLessonCompletionReward(userId: string, courseId: string, lessonId: string, course: any) {
    try {
      const { data: lesson } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('id', lessonId)
        .single()
        .catch(() => ({ data: null }));

      await ActivityRewardService.logActivity({
        userId,
        actionType: 'complete_lesson',
        targetId: lessonId,
        targetType: 'lesson',
        value: Number(course.reward_completion) / 10 || 0.1,
        metadata: {
          rewardType: 'lesson_completion',
          courseId,
          courseName: course.title,
          lessonTitle: lesson?.title || 'Unknown',
          lessonType: lesson?.lesson_type || 'video',
          points: Number(course.reward_completion) / 10,
        },
      });
    } catch (error) {
      console.error('Error awarding lesson completion reward:', error);
    }
  }

  private static async awardQuizCompletionReward(
    userId: string,
    courseId: string,
    lessonId: string,
    score: number,
    course: any
  ) {
    try {
      const { data: lesson } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('id', lessonId)
        .single()
        .catch(() => ({ data: null }));

      const bonus = score === 100 ? Number(course.reward_completion) / 5 : 0;

      await ActivityRewardService.logActivity({
        userId,
        actionType: 'complete_quiz',
        targetId: lessonId,
        targetType: 'quiz',
        value: (Number(course.reward_completion) / 10) * (score / 100) + bonus,
        metadata: {
          rewardType: 'quiz_completion',
          courseId,
          courseName: course.title,
          lessonTitle: lesson?.title || 'Unknown',
          score,
          bonus,
          points: (Number(course.reward_completion) / 10) * (score / 100) + bonus,
        },
      });
    } catch (error) {
      console.error('Error awarding quiz reward:', error);
    }
  }

  private static async awardCourseCompletionReward(userId: string, courseId: string, course: any) {
    try {
      await ActivityRewardService.logActivity({
        userId,
        actionType: 'complete_course',
        targetId: courseId,
        targetType: 'course',
        value: Number(course.reward_completion) || 3,
        metadata: {
          rewardType: 'course_completion',
          courseName: course.title,
          difficulty: course.level,
          points: Number(course.reward_completion),
        },
      });

      console.log(`🎓 Course completion reward! +${course.reward_completion} points for ${course.title}`);
    } catch (error) {
      console.error('Error awarding course completion reward:', error);
    }
  }

  private static async awardCertificateReward(userId: string, courseId: string, course: any) {
    try {
      await ActivityRewardService.logActivity({
        userId,
        actionType: 'achieve_milestone',
        targetId: courseId,
        targetType: 'course_certificate',
        value: Number(course.reward_certificate) || 5,
        metadata: {
          rewardType: 'certificate',
          milestone: 'course_certificate',
          courseName: course.title,
          difficulty: course.level,
          points: Number(course.reward_certificate),
        },
      });

      console.log(`🏆 Certificate reward! +${course.reward_certificate} points for ${course.title}`);
    } catch (error) {
      console.error('Error awarding certificate reward:', error);
    }
  }
}

export default EnrollmentService;

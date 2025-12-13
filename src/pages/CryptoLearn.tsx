import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Trophy,
  Play,
  Clock,
  Users,
  Star,
  TrendingUp,
  Shield,
  Brain,
  Target
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { blogService } from "@/services/blogService";
import { BlogPost } from "@/types/blog";
import LearningProgressDashboard from "@/components/rewards/LearningProgressDashboard";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Course {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  duration: string;
  course_type: 'platform' | 'creator';
  instructor_name: string;
  thumbnail_url: string;
  rating: number;
  total_students: number;
  price: number;
  is_paid: boolean;
  has_certificate: boolean;
  reward_enrollment: number;
  reward_completion: number;
  reward_certificate: number;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  reading_time: number;
  featured_image: string;
  views_count: number;
  quiz_attempts: number;
  tags: string[];
}

const CryptoLearn = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [platformCourses, setPlatformCourses] = useState<Course[]>([]);
  const [creatorCourses, setCreatorCourses] = useState<Course[]>([]);
  const [userEnrollments, setUserEnrollments] = useState<string[]>([]);

  const [courseStats, setCourseStats] = useState({
    totalCourses: 0,
    enrolledCourses: 0,
    completedCourses: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access the learning center.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    loadData();
  }, [user, navigate, toast]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load platform courses
      const { data: platformCoursesData, error: platformError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .eq('course_type', 'platform')
        .order('created_at', { ascending: false });

      if (platformError) throw platformError;

      // Load creator courses
      const { data: creatorCoursesData, error: creatorError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .eq('course_type', 'creator')
        .order('created_at', { ascending: false });

      if (creatorError) throw creatorError;

      setPlatformCourses(platformCoursesData || []);
      setCreatorCourses(creatorCoursesData || []);

      // Load user enrollments
      if (user) {
        const { data: enrollmentsData, error: enrollError } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('user_id', user.id);

        if (enrollError) throw enrollError;

        const enrolledIds = (enrollmentsData || []).map(e => e.course_id);
        setUserEnrollments(enrolledIds);

        // Calculate stats
        const completedCount = (enrollmentsData || []).filter(e => e.status === 'completed').length;
        setCourseStats({
          totalCourses: (platformCoursesData || []).length + (creatorCoursesData || []).length,
          enrolledCourses: enrolledIds.length,
          completedCourses: completedCount,
        });
      }

      // Load articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('educational_articles')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(12);

      if (articlesError) throw articlesError;
      setArticles(articlesData || []);

      // Load blog posts
      try {
        const blogResult = await blogService.getBlogPosts({ limit: 6 });
        setBlogPosts(blogResult?.posts || []);
      } catch (error) {
        console.error('Error loading blog posts:', error);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load learning content.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/app/course/${courseId}`);
  };

  const handleArticleClick = (articleId: string) => {
    navigate(`/app/article/${articleId}`);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const filterCourses = (courses: Course[]) => {
    return courses.filter(course => {
      const matchLevel = filterLevel === 'all' || course.level === filterLevel;
      const matchCategory = filterCategory === 'all' || course.category === filterCategory;
      const matchSearch =
        !searchTerm ||
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchLevel && matchCategory && matchSearch;
    });
  };

  if (!user) {
    return null;
  }

  const allCourses = [...platformCourses, ...creatorCourses];
  const categories = Array.from(new Set(allCourses.map(c => c.category).filter(Boolean)));

  return (
    <>
      <Helmet>
        <title>Crypto Education Center - Learn Trading & Blockchain | Eloity</title>
        <meta
          name="description"
          content="Comprehensive cryptocurrency education with courses, tutorials, and expert insights on trading, blockchain, and DeFi."
        />
      </Helmet>

      <div className="min-h-screen bg-platform">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Header */}
          <div className="mb-6 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app/crypto")}
              aria-label="Back to Crypto"
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0 text-center">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Learn
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                Crypto education and tutorials
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              aria-label="Refresh"
              className="shrink-0"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Banner */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Welcome to Crypto Academy</h3>
                    <p className="text-white font-medium">
                      {courseStats.enrolledCourses > 0
                        ? `Continue your learning journey`
                        : `Start your journey to becoming a crypto expert`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {courseStats.completedCourses}/{courseStats.totalCourses}
                  </div>
                  <div className="text-sm text-white font-medium">Courses Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Tabs */}
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="articles" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Articles
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Community
              </TabsTrigger>
            </TabsList>

            {/* Courses Tab */}
            <TabsContent value="courses" className="mt-6">
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Platform Courses Section */}
              {platformCourses.length > 0 && (
                <div className="mb-12">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Platform Courses</h2>
                    <p className="text-muted-foreground">Curated courses by Eloity experts</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterCourses(platformCourses).map(course => (
                      <Card
                        key={course.id}
                        className="cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden hover:scale-[1.02]"
                        onClick={() => handleCourseClick(course.id)}
                      >
                        {course.thumbnail_url && (
                          <div className="h-40 overflow-hidden bg-gray-200 dark:bg-gray-700">
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <Badge className={getLevelColor(course.level)}>
                                {course.level}
                              </Badge>
                              {course.is_paid && (
                                <Badge variant="secondary">${course.price}</Badge>
                              )}
                            </div>

                            <div>
                              <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {course.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {course.description}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {course.duration}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {course.total_students} students
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                {course.rating}
                              </div>
                              <div className="flex items-center gap-1">
                                {course.has_certificate && (
                                  <Badge variant="outline" className="text-xs">
                                    Certificate
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <Button
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              onClick={e => {
                                e.stopPropagation();
                                handleCourseClick(course.id);
                              }}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              View Course
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Creator Courses Section */}
              {creatorCourses.length > 0 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Community Courses</h2>
                    <p className="text-muted-foreground">Courses created by our community experts</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterCourses(creatorCourses).map(course => (
                      <Card
                        key={course.id}
                        className="cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden hover:scale-[1.02]"
                        onClick={() => handleCourseClick(course.id)}
                      >
                        {course.thumbnail_url && (
                          <div className="h-40 overflow-hidden bg-gray-200 dark:bg-gray-700">
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={getLevelColor(course.level)}>
                                  {course.level}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Community
                                </Badge>
                              </div>
                              {course.is_paid && (
                                <Badge variant="secondary">${course.price}</Badge>
                              )}
                            </div>

                            <div>
                              <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {course.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                by {course.instructor_name}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {course.description}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {course.duration}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {course.total_students} students
                              </div>
                            </div>

                            <Button
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              onClick={e => {
                                e.stopPropagation();
                                handleCourseClick(course.id);
                              }}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              View Course
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {filterCourses(allCourses).length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No courses found matching your filters</p>
                </div>
              )}
            </TabsContent>

            {/* Articles Tab */}
            <TabsContent value="articles" className="mt-6">
              {articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map(article => (
                    <Card
                      key={article.id}
                      className="cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden hover:scale-[1.02]"
                      onClick={() => handleArticleClick(article.id)}
                    >
                      {article.featured_image && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={article.featured_image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                              {article.difficulty}
                            </Badge>
                          </div>
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {article.reading_time}m read
                            </div>
                            <span>👁️ {article.views_count} views</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No articles available yet</p>
                </div>
              )}
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="mt-6">
              <LearningProgressDashboard />
            </TabsContent>

            {/* Community Tab */}
            <TabsContent value="community" className="mt-6">
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Join Our Learning Community</h3>
                <p className="text-muted-foreground mb-6">
                  Connect with fellow crypto enthusiasts, share insights, and learn together
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <Card className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-blue-500 flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">Discussion Forums</h4>
                    <p className="text-sm text-muted-foreground">Ask questions and share knowledge</p>
                  </Card>
                  <Card className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-green-500 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">Challenges</h4>
                    <p className="text-sm text-muted-foreground">Complete trading challenges</p>
                  </Card>
                  <Card className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-purple-500 flex items-center justify-center">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">Leaderboard</h4>
                    <p className="text-sm text-muted-foreground">Track your learning progress</p>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default CryptoLearn;

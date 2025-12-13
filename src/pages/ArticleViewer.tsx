import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Clock,
  Heart,
  Bookmark,
  Share2,
  Eye,
  ThumbsUp,
  ListChecks,
  Trophy,
  RotateCcw,
  CheckCircle2,
  Coins,
  Gift,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author_id: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  reading_time: number;
  featured_image: string;
  is_published: boolean;
  published_at: string;
  views_count: number;
  likes_count: number;
  bookmarks_count: number;
  quiz_questions: any;
  quiz_passing_score: number;
  reward_reading: number;
  reward_quiz_completion: number;
  reward_perfect_score: number;
  tags: string[];
}

interface UserProgress {
  id: string;
  user_id: string;
  article_id: string;
  read: boolean;
  quiz_score: number | null;
  bookmarked: boolean;
  liked: boolean;
  reading_reward_claimed: boolean;
  quiz_reward_claimed: boolean;
  perfect_score_reward_claimed: boolean;
}

interface QuizState {
  currentQuestion: number;
  answers: { [key: number]: number };
  showResults: boolean;
  score: number;
}

const ArticleViewer = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    answers: {},
    showResults: false,
    score: 0,
  });

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access articles.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (articleId) {
      loadArticle();
    }
  }, [articleId, user, navigate, toast]);

  const loadArticle = async () => {
    try {
      setLoading(true);

      // Load article
      const { data: articleData, error: articleError } = await supabase
        .from('educational_articles')
        .select('*')
        .eq('id', articleId!)
        .single();

      if (articleError) throw articleError;
      if (!articleData) {
        toast({
          title: "Article Not Found",
          description: "The requested article could not be found.",
          variant: "destructive",
        });
        navigate("/app/crypto-learn");
        return;
      }

      setArticle(articleData);

      // Load user progress
      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from('article_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('article_id', articleId!)
          .single();

        if (progressError && progressError.code !== 'PGRST116') throw progressError;

        if (!progressData) {
          // Create initial progress record
          await supabase
            .from('article_progress')
            .insert({
              user_id: user.id,
              article_id: articleId!,
            });
        } else {
          setUserProgress(progressData);
        }

        // Mark as read and claim reward
        await markArticleRead();
      }
    } catch (error) {
      console.error("Error loading article:", error);
      toast({
        title: "Error",
        description: "Failed to load article.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markArticleRead = async () => {
    if (!user || !article) return;

    try {
      // Update progress
      await supabase
        .from('article_progress')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('article_id', article.id);

      // Claim reading reward
      const hasClaimedReading = await checkRewardClaimed('reading');
      if (!hasClaimedReading) {
        await supabase
          .from('article_reward_claims')
          .insert({
            user_id: user.id,
            article_id: article.id,
            reward_type: 'reading',
            amount: article.reward_reading,
          });
      }
    } catch (error) {
      console.error('Error marking article as read:', error);
    }
  };

  const checkRewardClaimed = async (rewardType: string): Promise<boolean> => {
    if (!user || !article) return true;

    try {
      const { data, error } = await supabase
        .from('article_reward_claims')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', article.id)
        .eq('reward_type', rewardType)
        .single();

      return !!data;
    } catch {
      return false;
    }
  };

  const handleToggleLike = async () => {
    if (!user || !article) return;

    try {
      const newLiked = !userProgress?.liked;
      await supabase
        .from('article_progress')
        .update({ liked: newLiked })
        .eq('user_id', user.id)
        .eq('article_id', article.id);

      setUserProgress(prev => prev ? { ...prev, liked: newLiked } : null);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleToggleBookmark = async () => {
    if (!user || !article) return;

    try {
      const newBookmarked = !userProgress?.bookmarked;
      await supabase
        .from('article_progress')
        .update({ bookmarked: newBookmarked })
        .eq('user_id', user.id)
        .eq('article_id', article.id);

      setUserProgress(prev => prev ? { ...prev, bookmarked: newBookmarked } : null);
      toast({
        title: newBookmarked ? 'Bookmarked!' : 'Removed from bookmarks',
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleAnswerQuestion = (questionIndex: number, answer: number) => {
    setQuizState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionIndex]: answer },
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!article || !article.quiz_questions || !user) return;

    // Calculate score
    const questions = article.quiz_questions;
    let correctAnswers = 0;

    for (let i = 0; i < questions.length; i++) {
      if (quizState.answers[i] === questions[i].correctAnswer) {
        correctAnswers++;
      }
    }

    const score = Math.round((correctAnswers / questions.length) * 100);

    try {
      // Update progress with quiz score
      await supabase
        .from('article_progress')
        .update({ quiz_score: score })
        .eq('user_id', user.id)
        .eq('article_id', article.id);

      // Claim quiz completion reward
      const hasClaimedQuiz = await checkRewardClaimed('quiz_completion');
      if (!hasClaimedQuiz) {
        await supabase
          .from('article_reward_claims')
          .insert({
            user_id: user.id,
            article_id: article.id,
            reward_type: 'quiz_completion',
            amount: article.reward_quiz_completion,
          });
      }

      // Claim perfect score reward if applicable
      if (score === 100) {
        const hasClaimedPerfect = await checkRewardClaimed('perfect_score');
        if (!hasClaimedPerfect) {
          await supabase
            .from('article_reward_claims')
            .insert({
              user_id: user.id,
              article_id: article.id,
              reward_type: 'perfect_score',
              amount: article.reward_perfect_score,
            });
        }
      }

      setQuizState(prev => ({
        ...prev,
        score,
        showResults: true,
      }));

      toast({
        title: `Quiz Complete! Score: ${score}%`,
        description: score >= article.quiz_passing_score ? 'You passed!' : 'Keep learning!',
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit quiz.',
        variant: 'destructive',
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-platform flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-platform flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Article Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested article could not be found.</p>
          <Button onClick={() => navigate("/app/crypto-learn")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Learning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{article.title} - Crypto Education | Eloity</title>
        <meta name="description" content={article.excerpt} />
      </Helmet>

      <div className="min-h-screen bg-platform">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/app/crypto-learn")}
            className="flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Learning
          </Button>

          {/* Article Header */}
          <article className="space-y-6">
            {/* Featured Image */}
            {article.featured_image && (
              <div className="rounded-lg overflow-hidden h-96">
                <img
                  src={article.featured_image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title & Meta */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {article.reading_time} min read
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {article.views_count} views
                    </div>
                    <Badge className={getDifficultyColor(article.difficulty)}>
                      {article.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant={userProgress?.liked ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggleLike}
                >
                  <Heart
                    className={`h-4 w-4 mr-2 ${userProgress?.liked ? 'fill-current' : ''}`}
                  />
                  Like
                </Button>
                <Button
                  variant={userProgress?.bookmarked ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggleBookmark}
                >
                  <Bookmark
                    className={`h-4 w-4 mr-2 ${userProgress?.bookmarked ? 'fill-current' : ''}`}
                  />
                  Bookmark
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <Separator />

            {/* Content */}
            <div className="prose dark:prose-invert max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: article.content
                    .split('\n')
                    .map(line => (line ? `<p>${line}</p>` : ''))
                    .join(''),
                }}
              />
            </div>

            {/* Rewards Section */}
            {(article.reward_reading || article.reward_quiz_completion) && (
              <>
                <Separator />
                <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Gift className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                          Earn Rewards
                        </h3>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Complete the quiz to earn points
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {article.reward_reading > 0 && (
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-blue-600" />
                          <span>Reading: {article.reward_reading} pts</span>
                        </div>
                      )}
                      {article.reward_quiz_completion > 0 && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Quiz: {article.reward_quiz_completion} pts</span>
                        </div>
                      )}
                      {article.reward_perfect_score > 0 && (
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-purple-600" />
                          <span>Perfect: {article.reward_perfect_score} pts</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Quiz Section */}
            {article.quiz_questions && article.quiz_questions.length > 0 && (
              <>
                <Separator />
                {!showQuiz ? (
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <ListChecks className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">Test Your Knowledge</h3>
                          <p className="text-sm text-muted-foreground">
                            Take the quiz to reinforce your learning
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowQuiz(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <ListChecks className="h-4 w-4 mr-2" />
                          Start Quiz
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      {!quizState.showResults ? (
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold">
                                Question {quizState.currentQuestion + 1} of{' '}
                                {article.quiz_questions.length}
                              </h3>
                              <span className="text-sm text-muted-foreground">
                                {Math.round(
                                  ((quizState.currentQuestion + 1) /
                                    article.quiz_questions.length) *
                                    100
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                ((quizState.currentQuestion + 1) /
                                  article.quiz_questions.length) *
                                100
                              }
                              className="h-2"
                            />
                          </div>

                          <div>
                            <h4 className="font-semibold mb-4">
                              {article.quiz_questions[quizState.currentQuestion].question}
                            </h4>

                            <RadioGroup
                              value={String(
                                quizState.answers[quizState.currentQuestion] ?? -1
                              )}
                              onValueChange={value =>
                                handleAnswerQuestion(quizState.currentQuestion, parseInt(value))
                              }
                            >
                              <div className="space-y-3">
                                {article.quiz_questions[quizState.currentQuestion].options.map(
                                  (option: string, idx: number) => (
                                    <div key={idx} className="flex items-center space-x-2">
                                      <RadioGroupItem value={String(idx)} id={`option-${idx}`} />
                                      <Label htmlFor={`option-${idx}`} className="cursor-pointer">
                                        {option}
                                      </Label>
                                    </div>
                                  )
                                )}
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="flex justify-between">
                            <Button
                              variant="outline"
                              onClick={() =>
                                setQuizState(prev => ({
                                  ...prev,
                                  currentQuestion: Math.max(0, prev.currentQuestion - 1),
                                }))
                              }
                              disabled={quizState.currentQuestion === 0}
                            >
                              Previous
                            </Button>

                            {quizState.currentQuestion <
                            article.quiz_questions.length - 1 ? (
                              <Button
                                onClick={() =>
                                  setQuizState(prev => ({
                                    ...prev,
                                    currentQuestion: prev.currentQuestion + 1,
                                  }))
                                }
                              >
                                Next
                              </Button>
                            ) : (
                              <Button
                                onClick={handleSubmitQuiz}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Submit Quiz
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="text-center">
                            <div className="text-5xl font-bold mb-2">
                              {quizState.score}%
                            </div>
                            <p className="text-lg font-semibold mb-2">
                              {quizState.score >= article.quiz_passing_score
                                ? '🎉 Passed!'
                                : 'Keep Learning'}
                            </p>
                            <p className="text-muted-foreground">
                              Passing score: {article.quiz_passing_score}%
                            </p>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            {article.quiz_questions.map((q: any, idx: number) => {
                              const userAnswer = quizState.answers[idx];
                              const isCorrect = userAnswer === q.correctAnswer;

                              return (
                                <div
                                  key={idx}
                                  className={`p-4 rounded-lg border ${
                                    isCorrect
                                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200'
                                      : 'bg-red-50 dark:bg-red-900/20 border-red-200'
                                  }`}
                                >
                                  <p className="font-semibold text-sm mb-2">{q.question}</p>
                                  <p className="text-sm">
                                    Your answer:{' '}
                                    <span
                                      className={
                                        isCorrect
                                          ? 'text-green-600 font-semibold'
                                          : 'text-red-600 font-semibold'
                                      }
                                    >
                                      {q.options[userAnswer]}
                                    </span>
                                  </p>
                                  {!isCorrect && (
                                    <p className="text-sm mt-2">
                                      Correct answer:{' '}
                                      <span className="text-green-600 font-semibold">
                                        {q.options[q.correctAnswer]}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <Button
                            onClick={() => {
                              setShowQuiz(false);
                              setQuizState({
                                currentQuestion: 0,
                                answers: {},
                                showResults: false,
                                score: 0,
                              });
                            }}
                            className="w-full"
                          >
                            Back to Article
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </article>
        </div>
      </div>
    </>
  );
};

export default ArticleViewer;

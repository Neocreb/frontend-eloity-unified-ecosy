import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, ThumbsDown, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QAItem {
  id: string;
  question: string;
  answer?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  answeredBy?: string;
  answeredByName?: string;
  answeredByAvatar?: string;
  createdAt: string;
  answeredAt?: string;
  helpful: number;
  userHelpfulVote?: boolean;
  isSellerAnswer?: boolean;
}

interface ProductQASectionProps {
  productId: string;
  onSubmitQuestion?: (question: string) => Promise<void>;
  onAnswerQuestion?: (questionId: string, answer: string) => Promise<void>;
  onHelpfulVote?: (questionId: string, helpful: boolean) => Promise<void>;
}

const ProductQASection: React.FC<ProductQASectionProps> = ({
  productId,
  onSubmitQuestion,
  onAnswerQuestion,
  onHelpfulVote
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'unanswered'>('recent');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState<string | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockQuestions: QAItem[] = [
      {
        id: '1',
        question: 'What is the warranty period for this product?',
        answer: 'This product comes with a 2-year manufacturer\'s warranty covering defects in materials and workmanship.',
        userId: 'user1',
        userName: 'Sarah M.',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        answeredBy: 'seller1',
        answeredByName: 'Store Owner',
        answeredByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Store',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        answeredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        helpful: 12,
        isSellerAnswer: true
      },
      {
        id: '2',
        question: 'Is this item compatible with XYZ brand?',
        answer: 'Yes, it is fully compatible with all XYZ brand models released after 2020.',
        userId: 'user2',
        userName: 'John D.',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        answeredBy: 'seller1',
        answeredByName: 'Store Owner',
        answeredByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Store',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        answeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        helpful: 8,
        isSellerAnswer: true
      },
      {
        id: '3',
        question: 'Does this come in other colors?',
        userId: 'user3',
        userName: 'Mike R.',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        helpful: 3
      }
    ];
    setQuestions(mockQuestions);
  }, [productId]);

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to ask a question",
        variant: "destructive"
      });
      return;
    }

    setSubmittingQuestion(true);
    try {
      if (onSubmitQuestion) {
        await onSubmitQuestion(newQuestion);
      }

      const newQA: QAItem = {
        id: Date.now().toString(),
        question: newQuestion,
        userId: user.id,
        userName: user.user_metadata?.name || 'Anonymous',
        userAvatar: user.user_metadata?.avatar_url,
        createdAt: new Date().toISOString(),
        helpful: 0
      };

      setQuestions(prev => [newQA, ...prev]);
      setNewQuestion('');

      toast({
        title: "Success",
        description: "Your question has been posted. The seller will reply soon.",
        duration: 3000
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!answerText.trim()) {
      toast({
        title: "Error",
        description: "Please enter an answer",
        variant: "destructive"
      });
      return;
    }

    setSubmittingAnswer(questionId);
    try {
      if (onAnswerQuestion) {
        await onAnswerQuestion(questionId, answerText);
      }

      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId
            ? {
                ...q,
                answer: answerText,
                answeredBy: user?.id,
                answeredByName: user?.user_metadata?.name || 'Seller',
                answeredByAvatar: user?.user_metadata?.avatar_url,
                answeredAt: new Date().toISOString(),
                isSellerAnswer: true
              }
            : q
        )
      );
      setAnswerText('');
      setExpandedQuestion(null);

      toast({
        title: "Success",
        description: "Your answer has been posted",
        duration: 3000
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingAnswer(null);
    }
  };

  const handleHelpfulVote = async (questionId: string, helpful: boolean) => {
    try {
      if (onHelpfulVote) {
        await onHelpfulVote(questionId, helpful);
      }

      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId
            ? {
                ...q,
                helpful: helpful ? q.helpful + 1 : Math.max(0, q.helpful - 1),
                userHelpfulVote: helpful
              }
            : q
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record your vote",
        variant: "destructive"
      });
    }
  };

  const getSortedQuestions = () => {
    let sorted = [...questions];
    if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'helpful') {
      sorted.sort((a, b) => b.helpful - a.helpful);
    } else if (sortBy === 'unanswered') {
      sorted = sorted.filter(q => !q.answer);
    }
    return sorted;
  };

  const answeredCount = questions.filter(q => q.answer).length;
  const unansweredCount = questions.length - answeredCount;
  const sortedQuestions = getSortedQuestions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle size={20} />
          Questions & Answers
          <Badge variant="secondary" className="ml-auto">
            {questions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ask a Question Section */}
        {user && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>{user.user_metadata?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{user.user_metadata?.name || 'You'}</p>
              </div>
            </div>
            <Textarea
              placeholder="Ask a question about this product..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="resize-none bg-white"
              rows={3}
            />
            <Button
              onClick={handleSubmitQuestion}
              disabled={submittingQuestion || !newQuestion.trim()}
              className="w-full sm:w-auto gap-2"
            >
              <Send size={16} />
              Ask Question
            </Button>
          </div>
        )}

        {!user && (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-3">
              Please sign in to ask a question
            </p>
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </div>
        )}

        {/* Sort and Filter */}
        {questions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Statistics</p>
              <div className="flex gap-4 text-xs text-gray-600">
                <span><strong>{answeredCount}</strong> Answered</span>
                <span><strong>{unansweredCount}</strong> Unanswered</span>
              </div>
            </div>
            <Tabs defaultValue="recent" onValueChange={(value) => setSortBy(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recent">Most Recent</TabsTrigger>
                <TabsTrigger value="helpful">Most Helpful</TabsTrigger>
                <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-4 pt-4">
          {sortedQuestions.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">
                {sortBy === 'unanswered' ? 'All questions have been answered!' : 'No questions yet. Be the first to ask!'}
              </p>
            </div>
          ) : (
            sortedQuestions.map((qa) => (
              <div key={qa.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                {/* Question */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src={qa.userAvatar} />
                      <AvatarFallback>{qa.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{qa.userName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(qa.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-800 mt-2">{qa.question}</p>
                    </div>
                  </div>

                  {/* Answer */}
                  {qa.answer && (
                    <div className="ml-11 bg-gray-50 p-3 rounded border-l-2 border-green-500">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={qa.answeredByAvatar} />
                          <AvatarFallback>{qa.answeredByName?.[0] || 'S'}</AvatarFallback>
                        </Avatar>
                        <div className="text-xs">
                          <p className="font-medium text-gray-900">{qa.answeredByName || 'Seller'}</p>
                          {qa.isSellerAnswer && (
                            <Badge variant="outline" className="text-xs mt-1">Seller</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-800">{qa.answer}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {qa.answeredAt && new Date(qa.answeredAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Helpful Voting and Reply */}
                  <div className="ml-11 flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Was this helpful?</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 gap-1 text-xs"
                        onClick={() => handleHelpfulVote(qa.id, true)}
                      >
                        <ThumbsUp size={14} />
                        <span>{qa.helpful}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 gap-1 text-xs"
                        onClick={() => handleHelpfulVote(qa.id, false)}
                      >
                        <ThumbsDown size={14} />
                      </Button>
                    </div>
                    {!qa.answer && user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setExpandedQuestion(expandedQuestion === qa.id ? null : qa.id)}
                      >
                        Reply
                      </Button>
                    )}
                  </div>

                  {/* Reply Input */}
                  {expandedQuestion === qa.id && !qa.answer && (
                    <div className="ml-11 space-y-2 pt-2 border-t">
                      <Textarea
                        placeholder="Type your answer..."
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        className="resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setExpandedQuestion(null);
                            setAnswerText('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitAnswer(qa.id)}
                          disabled={submittingAnswer === qa.id || !answerText.trim()}
                        >
                          Submit Answer
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {questions.length > 10 && (
          <div className="text-center pt-4">
            <Button variant="outline" className="w-full sm:w-auto">
              Load More Questions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductQASection;

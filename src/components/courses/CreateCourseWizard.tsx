import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CreateCourseWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CourseData {
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  duration: string;
  is_paid: boolean;
  price: number;
  objectives: string[];
  requirements: string[];
  tags: string[];
  thumbnail_url: string;
  reward_enrollment: number;
  reward_completion: number;
  reward_certificate: number;
}

const CreateCourseWizard: React.FC<CreateCourseWizardProps> = ({ open, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    level: 'Beginner',
    category: 'Cryptocurrency',
    duration: '',
    is_paid: false,
    price: 0,
    objectives: [],
    requirements: [],
    tags: [],
    thumbnail_url: '',
    reward_enrollment: 0,
    reward_completion: 2,
    reward_certificate: 5,
  });

  const [objectiveInput, setObjectiveInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Course title and description' },
    { number: 2, title: 'Details', description: 'Level, category, and duration' },
    { number: 3, title: 'Pricing', description: 'Set price and earning structure' },
    { number: 4, title: 'Objectives', description: 'Learning objectives and requirements' },
    { number: 5, title: 'Review', description: 'Review and publish' },
  ];

  const handleAddObjective = () => {
    if (objectiveInput.trim()) {
      setCourseData({
        ...courseData,
        objectives: [...courseData.objectives, objectiveInput.trim()],
      });
      setObjectiveInput('');
    }
  };

  const handleRemoveObjective = (index: number) => {
    setCourseData({
      ...courseData,
      objectives: courseData.objectives.filter((_, i) => i !== index),
    });
  };

  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      setCourseData({
        ...courseData,
        requirements: [...courseData.requirements, requirementInput.trim()],
      });
      setRequirementInput('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setCourseData({
      ...courseData,
      requirements: courseData.requirements.filter((_, i) => i !== index),
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setCourseData({
        ...courseData,
        tags: [...courseData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setCourseData({
      ...courseData,
      tags: courseData.tags.filter((_, i) => i !== index),
    });
  };

  const handleCreateCourse = async () => {
    if (!courseData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Course title is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          instructor_id: user?.id,
          course_type: 'creator',
          title: courseData.title,
          description: courseData.description,
          level: courseData.level,
          category: courseData.category,
          duration: courseData.duration,
          is_paid: courseData.is_paid,
          price: courseData.price,
          objectives: courseData.objectives,
          requirements: courseData.requirements,
          tags: courseData.tags,
          thumbnail_url: courseData.thumbnail_url,
          reward_enrollment: courseData.reward_enrollment,
          reward_completion: courseData.reward_completion,
          reward_certificate: courseData.reward_certificate,
          is_published: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Course created! You can now add lessons and publish it.',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to create course',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNextStep = () => {
    switch (step) {
      case 1:
        return courseData.title.trim() && courseData.description.trim();
      case 2:
        return courseData.level && courseData.category && courseData.duration;
      case 3:
        return true;
      case 4:
        return courseData.objectives.length > 0;
      default:
        return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Your Course</DialogTitle>
          <DialogDescription>
            Create and publish your own course for the Eloity community
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Step {step} of {steps.length}</span>
              <span className="text-xs text-muted-foreground">{steps[step - 1].title}</span>
            </div>
            <Progress value={(step / steps.length) * 100} className="h-2" />
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Course Title*</label>
                <Input
                  placeholder="e.g., DeFi Trading Strategies for Beginners"
                  value={courseData.title}
                  onChange={e => setCourseData({ ...courseData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description*</label>
                <Textarea
                  placeholder="Describe what students will learn in this course..."
                  value={courseData.description}
                  onChange={e => setCourseData({ ...courseData, description: e.target.value })}
                  rows={5}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Thumbnail Image URL</label>
                <Input
                  placeholder="https://..."
                  value={courseData.thumbnail_url}
                  onChange={e => setCourseData({ ...courseData, thumbnail_url: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Level*</label>
                  <Select
                    value={courseData.level}
                    onValueChange={v => setCourseData({ ...courseData, level: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category*</label>
                  <Select
                    value={courseData.category}
                    onValueChange={v => setCourseData({ ...courseData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cryptocurrency">Cryptocurrency</SelectItem>
                      <SelectItem value="DeFi">DeFi</SelectItem>
                      <SelectItem value="Blockchain">Blockchain</SelectItem>
                      <SelectItem value="Trading">Trading</SelectItem>
                      <SelectItem value="Web3">Web3</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Duration*</label>
                <Input
                  placeholder="e.g., 4 hours"
                  value={courseData.duration}
                  onChange={e => setCourseData({ ...courseData, duration: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseData.is_paid}
                    onChange={e => setCourseData({ ...courseData, is_paid: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Make this a paid course</span>
                </label>
              </div>

              {courseData.is_paid && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Price (USD)</label>
                  <Input
                    type="number"
                    placeholder="29.99"
                    value={courseData.price}
                    onChange={e => setCourseData({ ...courseData, price: parseFloat(e.target.value) })}
                  />
                </div>
              )}

              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base">Student Rewards</CardTitle>
                  <CardDescription>Points students earn by taking your course</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Enrollment Reward (points)</label>
                    <Input
                      type="number"
                      value={courseData.reward_enrollment}
                      onChange={e => setCourseData({ ...courseData, reward_enrollment: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Completion Reward (points)</label>
                    <Input
                      type="number"
                      value={courseData.reward_completion}
                      onChange={e => setCourseData({ ...courseData, reward_completion: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Certificate Reward (points)</label>
                    <Input
                      type="number"
                      value={courseData.reward_certificate}
                      onChange={e => setCourseData({ ...courseData, reward_certificate: parseFloat(e.target.value) })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Objectives & Requirements */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Learning Objectives*</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an objective..."
                      value={objectiveInput}
                      onChange={e => setObjectiveInput(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddObjective();
                        }
                      }}
                    />
                    <Button onClick={handleAddObjective} type="button">
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {courseData.objectives.map((obj, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        <span className="text-sm">{obj}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveObjective(idx)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Requirements</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a requirement..."
                      value={requirementInput}
                      onChange={e => setRequirementInput(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRequirement();
                        }
                      }}
                    />
                    <Button onClick={handleAddRequirement} type="button">
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {courseData.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        <span className="text-sm">{req}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveRequirement(idx)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button onClick={handleAddTag} type="button">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {courseData.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                        <button
                          className="ml-1"
                          onClick={() => handleRemoveTag(idx)}
                        >
                          ✕
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{courseData.title}</CardTitle>
                  <CardDescription>{courseData.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">LEVEL</span>
                      <p className="font-semibold">{courseData.level}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">CATEGORY</span>
                      <p className="font-semibold">{courseData.category}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">DURATION</span>
                      <p className="font-semibold">{courseData.duration}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">PRICE</span>
                      <p className="font-semibold">
                        {courseData.is_paid ? `$${courseData.price}` : 'Free'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-muted-foreground">OBJECTIVES ({courseData.objectives.length})</span>
                    <ul className="mt-2 space-y-1 text-sm">
                      {courseData.objectives.map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {courseData.tags.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">TAGS</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {courseData.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground">
                Your course will be created as a draft. You can add lessons, modify details, and publish it when ready.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between gap-3 pt-6">
            <Button
              variant="outline"
              onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>

            {step < steps.length ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNextStep()}
                className="bg-blue-600"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreateCourse}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {loading ? 'Creating...' : 'Create Course'}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCourseWizard;

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Star,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ReviewService, ReviewCreateInput } from '@/services/reviewService';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Validation schema
const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  content: z.string().min(10, 'Review must be at least 10 characters').max(2000),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface CreateReviewFormProps {
  productId: string;
  orderId?: string;
  productName: string;
  productImage?: string;
  onSuccess?: () => void;
  isVerifiedPurchase?: boolean;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export default function CreateReviewForm({
  productId,
  orderId,
  productName,
  productImage,
  onSuccess,
  isVerifiedPurchase = false,
}: CreateReviewFormProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: '',
      content: '',
    },
  });

  const rating = form.watch('rating');

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Check if adding new images would exceed the limit
    if (uploadedImages.length + files.length > MAX_IMAGES) {
      toast({
        title: 'Too Many Images',
        description: `You can upload a maximum of ${MAX_IMAGES} images`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingImages(true);

      // In a real application, you would upload to storage (S3, Supabase Storage, etc.)
      // For now, we'll create blob URLs for preview
      const newImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file size
        if (file.size > MAX_IMAGE_SIZE) {
          toast({
            title: 'File Too Large',
            description: 'Images must be smaller than 5MB',
            variant: 'destructive',
          });
          continue;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid File Type',
            description: 'Please upload image files only',
            variant: 'destructive',
          });
          continue;
        }

        // Create blob URL for preview
        const blobUrl = URL.createObjectURL(file);
        newImages.push(blobUrl);
      }

      setUploadedImages((prev) => [...prev, ...newImages]);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => {
      const newImages = [...prev];
      // Clean up blob URL
      if (newImages[index].startsWith('blob:')) {
        URL.revokeObjectURL(newImages[index]);
      }
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const onSubmit = async (data: ReviewFormData) => {
    try {
      setSubmitError(null);

      // Create review input
      const reviewInput: ReviewCreateInput = {
        productId,
        userId: '', // This will be set by the service based on authenticated user
        orderId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        images: uploadedImages,
        verifiedPurchase: isVerifiedPurchase,
      };

      // Submit review
      const review = await ReviewService.createReview(reviewInput);

      if (!review) {
        setSubmitError('Failed to submit review. Please try again.');
        return;
      }

      toast({
        title: 'Review Submitted',
        description: 'Thank you for your review!',
      });

      // Reset form
      form.reset();
      setUploadedImages([]);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit review';
      setSubmitError(message);
      console.error('Error submitting review:', error);
    }
  };

  const characterCount = form.watch('content').length;
  const characterLimit = 2000;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>Share your experience with this product</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Product Info */}
        <div className="mb-6 p-4 bg-muted rounded-lg flex gap-4">
          {productImage && (
            <img
              src={productImage}
              alt={productName}
              className="h-16 w-16 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <p className="font-medium">{productName}</p>
            {isVerifiedPurchase && (
              <Badge className="mt-2 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified Purchase
              </Badge>
            )}
          </div>
        </div>

        {submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">How would you rate this product?</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={cn(
                              'h-8 w-8',
                              star <= (hoverRating || rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>
                    {rating > 0 && (
                      <span className="font-medium">
                        {rating === 1 && 'Poor - Not satisfied'}
                        {rating === 2 && 'Fair - Some issues'}
                        {rating === 3 && 'Good - Meets expectations'}
                        {rating === 4 && 'Very Good - Very satisfied'}
                        {rating === 5 && 'Excellent - Highly satisfied'}
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Summarize your experience in a few words"
                      {...field}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/100 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Review Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your experience with this product. What do you like? What could be improved?"
                      {...field}
                      rows={6}
                      maxLength={characterLimit}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription>
                    {characterCount}/{characterLimit} characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div>
              <FormLabel>Add Photos (Optional)</FormLabel>
              <FormDescription className="mb-3">
                Upload up to {MAX_IMAGES} product photos. Maximum 5MB per image.
              </FormDescription>

              {/* Upload Area */}
              <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImages || uploadedImages.length >= MAX_IMAGES}
                  className="hidden"
                />
              </label>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}/{uploadedImages.length}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {uploadedImages.length >= MAX_IMAGES && (
                <p className="text-sm text-muted-foreground mt-3">
                  Maximum number of images reached
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={form.formState.isSubmitting || uploadingImages}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Submit Review
                  </>
                )}
              </Button>
            </div>

            {/* Terms */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                By submitting a review, you agree to our Review Guidelines. Please be respectful and honest.
              </AlertDescription>
            </Alert>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

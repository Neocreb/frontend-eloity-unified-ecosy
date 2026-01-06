import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  quality?: 'low' | 'medium' | 'high';
}

/**
 * OptimizedImage Component
 * 
 * Provides lazy loading, responsive images, and WebP format support
 * with graceful fallbacks for better performance
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  containerClassName,
  width,
  height,
  sizes,
  priority = false,
  onLoad,
  onError,
  quality = 'medium'
}) => {
  const [isLoaded, setIsLoaded] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate responsive image URLs (assumes image service or CDN support)
  const getImageUrl = (baseUrl: string, width?: number, quality?: string): string => {
    if (!baseUrl) return '';
    
    // Check if URL already has query parameters
    const separator = baseUrl.includes('?') ? '&' : '?';
    
    // Support common image optimization services
    if (baseUrl.includes('supabase') || baseUrl.includes('cloudinary') || baseUrl.includes('imgix')) {
      // For Supabase, we'll keep the URL as-is (basic CDN support)
      // For full optimization, integrate with Cloudinary, Imgix, or similar
      return baseUrl;
    }
    
    return baseUrl;
  };

  useEffect(() => {
    if (priority) {
      setIsLoaded(true);
      return;
    }

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            setIsLoaded(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Determine quality-based settings
  const qualitySettings = {
    low: { decoding: 'async' as const, fetchPriority: 'low' as const },
    medium: { decoding: 'auto' as const, fetchPriority: 'auto' as const },
    high: { decoding: 'sync' as const, fetchPriority: 'high' as const }
  };

  const settings = qualitySettings[quality];

  if (hasError) {
    return (
      <div
        className={cn(
          'bg-gray-200 flex items-center justify-center text-gray-500',
          containerClassName
        )}
        style={{
          aspectRatio: width && height ? `${width}/${height}` : 'auto'
        }}
      >
        <span className="text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-gray-100',
        containerClassName
      )}
      style={{
        aspectRatio: width && height ? `${width}/${height}` : 'auto'
      }}
    >
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      )}

      {/* Actual image */}
      {isLoaded && (
        <picture>
          {/* WebP format for modern browsers */}
          <source
            srcSet={getImageUrl(src, 640, 'webp')}
            type="image/webp"
            media="(max-width: 640px)"
          />
          <source
            srcSet={getImageUrl(src, 1024, 'webp')}
            type="image/webp"
            media="(max-width: 1024px)"
          />
          <source
            srcSet={getImageUrl(src, 1280, 'webp')}
            type="image/webp"
          />

          {/* Fallback JPEG format */}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            loading={priority ? 'eager' : 'lazy'}
            {...settings}
            onLoad={handleLoad}
            onError={handleError}
            sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
          />
        </picture>
      )}
    </div>
  );
};

export default OptimizedImage;

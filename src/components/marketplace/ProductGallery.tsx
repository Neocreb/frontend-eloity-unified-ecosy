import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import OptimizedImage from './OptimizedImage';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  onImageSelect?: (index: number) => void;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
  onImageSelect
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [thumbnailScroll, setThumbnailScroll] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLImageElement>(null);

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 0.5;
  const THUMBNAIL_SIZE = 80;
  const THUMBNAILS_VISIBLE = 5;

  // Default to first image if images array is empty
  const safeImages = images && images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&auto=format&fit=crop'
  ];

  const currentImage = safeImages[selectedImageIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        previousImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setZoomLevel(1);
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, zoomLevel]);

  const previousImage = () => {
    const newIndex = selectedImageIndex === 0 ? safeImages.length - 1 : selectedImageIndex - 1;
    setSelectedImageIndex(newIndex);
    onImageSelect?.(newIndex);
  };

  const nextImage = () => {
    const newIndex = selectedImageIndex === safeImages.length - 1 ? 0 : selectedImageIndex + 1;
    setSelectedImageIndex(newIndex);
    onImageSelect?.(newIndex);
  };

  const selectImage = (index: number) => {
    setSelectedImageIndex(index);
    setZoomLevel(1);
    onImageSelect?.(index);
    
    // Scroll thumbnails to show selected image
    const newScroll = Math.max(0, (index - 2) * (THUMBNAIL_SIZE + 8));
    setThumbnailScroll(newScroll);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isLightboxOpen) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  // Handle touch swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      previousImage();
    }
  };

  return (
    <div className="w-full">
      {/* Main Image Display */}
      <div
        ref={imageRef}
        className="relative bg-gray-100 rounded-lg overflow-hidden mb-4 aspect-square cursor-zoom-in group"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div
            className="w-full h-full transition-transform duration-300"
            style={{
              transform: `scale(${zoomLevel})`,
              cursor: zoomLevel > 1 ? 'grab' : 'zoom-in'
            }}
          >
            <OptimizedImage
              src={currentImage}
              alt={`${productName} - Image ${selectedImageIndex + 1}`}
              quality="high"
              priority={true}
              containerClassName="w-full h-full rounded-lg"
            />
          </div>
        </div>

        {/* Image Counter */}
        <div className="absolute top-3 right-3 bg-black/50 text-white px-3 py-1 rounded text-sm">
          {selectedImageIndex + 1} / {safeImages.length}
        </div>

        {/* Navigation Arrows */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={previousImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
              title="Previous (← arrow key)"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
              title="Next (→ arrow key)"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Zoom Controls and Lightbox Button */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/80 hover:bg-white text-gray-800"
            onClick={() => {
              setZoomLevel(1);
            }}
            title="Reset zoom"
          >
            <span className="text-sm">{Math.round(zoomLevel * 100)}%</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/80 hover:bg-white text-gray-800"
            onClick={zoomOut}
            disabled={zoomLevel <= MIN_ZOOM}
            title="Zoom out (- key)"
          >
            <ZoomOut size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/80 hover:bg-white text-gray-800"
            onClick={zoomIn}
            disabled={zoomLevel >= MAX_ZOOM}
            title="Zoom in (+ key)"
          >
            <ZoomIn size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/80 hover:bg-white text-gray-800"
            onClick={() => setIsLightboxOpen(true)}
            title="Fullscreen"
          >
            <Maximize2 size={16} />
          </Button>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {safeImages.length > 1 && (
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex gap-2 transition-transform duration-300"
              style={{
                transform: `translateX(-${thumbnailScroll}px)`
              }}
            >
              {safeImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => selectImage(index)}
                  className={cn(
                    'flex-shrink-0 rounded overflow-hidden border-2 transition-all duration-200 hover:border-primary',
                    selectedImageIndex === index
                      ? 'border-primary ring-2 ring-primary/50'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                  style={{
                    width: `${THUMBNAIL_SIZE}px`,
                    height: `${THUMBNAIL_SIZE}px`
                  }}
                  title={`View image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Thumbnail Navigation Arrows */}
          {safeImages.length > THUMBNAILS_VISIBLE && (
            <>
              <button
                onClick={() =>
                  setThumbnailScroll(prev =>
                    Math.max(0, prev - (THUMBNAIL_SIZE + 8) * 2)
                  )
                }
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 bg-gray-200 hover:bg-gray-300 text-gray-800 p-1 rounded-full"
                aria-label="Scroll thumbnails left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  setThumbnailScroll(prev =>
                    prev + (THUMBNAIL_SIZE + 8) * 2
                  )
                }
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 bg-gray-200 hover:bg-gray-300 text-gray-800 p-1 rounded-full"
                aria-label="Scroll thumbnails right"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
          onWheel={handleWheel}
        >
          <button
            onClick={() => {
              setIsLightboxOpen(false);
              setZoomLevel(1);
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close lightbox"
          >
            <X size={32} />
          </button>

          {safeImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  previousImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          <div
            className="relative flex items-center justify-center max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage}
              alt={`${productName} - Fullscreen`}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${zoomLevel})`,
                cursor: zoomLevel > 1 ? 'grab' : 'default'
              }}
            />
          </div>

          {/* Lightbox Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/70 p-3 rounded">
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white"
              onClick={zoomOut}
              disabled={zoomLevel <= MIN_ZOOM}
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </Button>
            <div className="text-white px-3 py-1 text-sm">
              {Math.round(zoomLevel * 100)}%
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white"
              onClick={zoomIn}
              disabled={zoomLevel >= MAX_ZOOM}
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white"
              onClick={() => setZoomLevel(1)}
              title="Reset zoom"
            >
              <span className="text-sm">Reset</span>
            </Button>
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 text-white bg-black/70 px-3 py-1 rounded text-sm">
            {selectedImageIndex + 1} / {safeImages.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGallery;

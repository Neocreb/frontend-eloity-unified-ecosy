import React, { Suspense, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  timeout?: number;
}

/**
 * LazyBoundary Component
 * 
 * Wraps lazy-loaded route components with Suspense and provides
 * a fallback loading UI while the component chunks are loading.
 * 
 * @example
 * <LazyBoundary>
 *   <YourLazyComponent />
 * </LazyBoundary>
 */
const LazyBoundary: React.FC<LazyBoundaryProps> = ({ 
  children, 
  fallback,
  timeout
}) => {
  const defaultFallback = (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
        <p className="text-gray-600 font-medium">Loading...</p>
        <p className="text-sm text-gray-400 mt-2">Please wait while we fetch the content</p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

/**
 * Lightweight LazyBoundary for inline loading (e.g., within pages)
 */
export const InlinelazyBoundary: React.FC<LazyBoundaryProps> = ({ 
  children, 
  fallback 
}) => {
  const defaultFallback = (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
        <p className="text-gray-600 text-sm">Loading content...</p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

/**
 * Minimal LazyBoundary for quick transitions
 */
export const MinimalLazyBoundary: React.FC<LazyBoundaryProps> = ({ 
  children, 
  fallback 
}) => {
  const defaultFallback = (
    <div className="w-full h-full animate-pulse bg-gray-200 rounded" />
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export default LazyBoundary;

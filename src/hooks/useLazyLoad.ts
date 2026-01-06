import { useEffect, useRef, useState, RefObject } from 'react';

interface UseLazyLoadOptions {
  threshold?: number | number[];
  rootMargin?: string;
  onLoad?: () => void;
}

/**
 * useLazyLoad Hook
 * 
 * Provides lazy loading functionality using Intersection Observer API.
 * Returns a ref to attach to elements and a loaded state.
 * 
 * @example
 * const { ref, isLoaded } = useLazyLoad();
 * return <img ref={ref} src={url} />;
 */
export const useLazyLoad = (
  options: UseLazyLoadOptions = {}
): { ref: RefObject<HTMLElement>; isLoaded: boolean } => {
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoaded(true);
            options.onLoad?.();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: options.threshold ?? 0.1,
        rootMargin: options.rootMargin ?? '50px'
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options]);

  return { ref, isLoaded };
};

/**
 * Accessibility Utilities
 * Provides utilities for keyboard navigation, focus management, high contrast mode support, and screen reader optimization
 */

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user prefers high contrast mode
 */
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
};

/**
 * Check if user prefers dark mode
 */
export const prefersDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Get high contrast CSS classes for components
 */
export const getHighContrastClasses = (baseClass: string, highContrastClass: string): string => {
  return prefersHighContrast() ? highContrastClass : baseClass;
};

/**
 * Keyboard navigation helper - check for specific keys
 */
export const isKeyboardEvent = (e: React.KeyboardEvent, key: string | string[]): boolean => {
  const keys = Array.isArray(key) ? key : [key];
  return keys.some(k => e.key === k || e.code === k);
};

/**
 * Handle keyboard navigation in lists/grids
 */
export const handleListKeyboard = (
  e: React.KeyboardEvent,
  index: number,
  itemCount: number,
  onSelect: (index: number) => void,
  columns?: number
): void => {
  let nextIndex = index;
  const colCount = columns || 1;

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      nextIndex = Math.max(0, index - colCount);
      break;
    case 'ArrowDown':
      e.preventDefault();
      nextIndex = Math.min(itemCount - 1, index + colCount);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      nextIndex = Math.max(0, index - 1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      nextIndex = Math.min(itemCount - 1, index + 1);
      break;
    case 'Home':
      e.preventDefault();
      nextIndex = 0;
      break;
    case 'End':
      e.preventDefault();
      nextIndex = itemCount - 1;
      break;
    default:
      return;
  }

  onSelect(nextIndex);
};

/**
 * Announce text to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  if (typeof document === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Focus management utility
 */
export const focusElement = (element: HTMLElement | null): void => {
  if (element) {
    setTimeout(() => element.focus(), 0);
  }
};

/**
 * Set focus to first interactive element
 */
export const focusFirstInteractive = (container: HTMLElement | null): void => {
  if (!container) return;

  const interactive = container.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as HTMLElement;

  if (interactive) {
    focusElement(interactive);
  }
};

/**
 * Trap focus within a container (useful for modals)
 */
export const trapFocus = (e: React.KeyboardEvent, container: HTMLElement | null): void => {
  if (!container || e.key !== 'Tab') return;

  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  const activeElement = document.activeElement as HTMLElement;

  if (e.shiftKey) {
    if (activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
  } else {
    if (activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
};

/**
 * Generate ARIA labels from data
 */
export const generateAriaLabel = (parts: (string | number | undefined)[]): string => {
  return parts.filter(p => p !== undefined && p !== null && p !== '').join(' • ');
};

/**
 * Format number for screen readers with commas
 */
export const formatNumberForScreenReader = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Format currency for screen readers
 */
export const formatCurrencyForScreenReader = (amount: number, currency: string): string => {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

/**
 * Create accessible error messages
 */
export const createAccessibleErrorMessage = (fieldName: string, error: string): string => {
  return `Error in ${fieldName}: ${error}. Please correct this before proceeding.`;
};

/**
 * Get button/link aria-label from content
 */
export const getInteractiveLabel = (content: string, action: string, context?: string): string => {
  const parts = [content, action];
  if (context) parts.push(`(${context})`);
  return parts.join(' - ');
};

/**
 * Format time for accessibility
 */
export const formatTimeForAccessibility = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes % 60} minute${(minutes % 60) !== 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds % 60} second${(seconds % 60) !== 1 ? 's' : ''}`;
  }
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
};

/**
 * Get contrast-appropriate color classes
 */
export const getContrastSafeColors = (): {
  success: string;
  error: string;
  warning: string;
  info: string;
} => {
  if (prefersHighContrast()) {
    return {
      success: 'text-green-900 dark:text-green-100 bg-green-100 dark:bg-green-900',
      error: 'text-red-900 dark:text-red-100 bg-red-100 dark:bg-red-900',
      warning: 'text-yellow-900 dark:text-yellow-100 bg-yellow-100 dark:bg-yellow-900',
      info: 'text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900',
    };
  }
  return {
    success: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    error: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    info: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  };
};

export default {
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkMode,
  getHighContrastClasses,
  isKeyboardEvent,
  handleListKeyboard,
  announceToScreenReader,
  focusElement,
  focusFirstInteractive,
  trapFocus,
  generateAriaLabel,
  formatNumberForScreenReader,
  formatCurrencyForScreenReader,
  createAccessibleErrorMessage,
  getInteractiveLabel,
  formatTimeForAccessibility,
  getContrastSafeColors,
};

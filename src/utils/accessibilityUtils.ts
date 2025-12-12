/**
 * Accessibility Utilities for WCAG compliance
 * Helps with keyboard navigation, ARIA labels, and screen reader support
 */

/**
 * Check if key pressed is Enter or Space
 */
export const isActivationKey = (event: React.KeyboardEvent): boolean => {
  return event.key === 'Enter' || event.key === ' ';
};

/**
 * Check if key pressed is Escape
 */
export const isEscapeKey = (event: React.KeyboardEvent): boolean => {
  return event.key === 'Escape';
};

/**
 * Check if key is arrow key
 */
export const isArrowKey = (event: React.KeyboardEvent): boolean => {
  return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
};

/**
 * Get arrow direction
 */
export const getArrowDirection = (
  event: React.KeyboardEvent
): 'up' | 'down' | 'left' | 'right' | null => {
  const keyMap = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
  } as const;
  return keyMap[event.key as keyof typeof keyMap] || null;
};

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only'; // Make visually hidden but available to screen readers
  announcement.textContent = message;
  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Move focus to next element in tab order
   */
  moveFocusToNext(element: HTMLElement): void {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const focusArray = Array.from(focusableElements) as HTMLElement[];
    const currentIndex = focusArray.indexOf(element);
    const nextElement = focusArray[currentIndex + 1];
    if (nextElement) {
      nextElement.focus();
    }
  },

  /**
   * Move focus to previous element in tab order
   */
  moveFocusToPrevious(element: HTMLElement): void {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const focusArray = Array.from(focusableElements) as HTMLElement[];
    const currentIndex = focusArray.indexOf(element);
    const prevElement = focusArray[currentIndex - 1];
    if (prevElement) {
      prevElement.focus();
    }
  },

  /**
   * Focus element with visible indicator
   */
  focusElement(element: HTMLElement): void {
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  /**
   * Check if element is focusable
   */
  isFocusable(element: HTMLElement): boolean {
    return element.matches(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  },
};

/**
 * ARIA utilities for common patterns
 */
export const ariaUtils = {
  /**
   * Set up button attributes
   */
  setButtonAttributes(element: HTMLElement, options?: { label?: string; pressed?: boolean }): void {
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    if (options?.label) {
      element.setAttribute('aria-label', options.label);
    }
    if (options?.pressed !== undefined) {
      element.setAttribute('aria-pressed', String(options.pressed));
    }
  },

  /**
   * Set up toggle button
   */
  setToggleAttributes(
    element: HTMLElement,
    isActive: boolean,
    label?: string
  ): void {
    element.setAttribute('role', 'switch');
    element.setAttribute('aria-checked', String(isActive));
    element.setAttribute('tabindex', '0');
    if (label) {
      element.setAttribute('aria-label', label);
    }
  },

  /**
   * Set up modal dialog
   */
  setModalAttributes(element: HTMLElement, label?: string): void {
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-modal', 'true');
    if (label) {
      element.setAttribute('aria-labelledby', label);
    }
  },

  /**
   * Set up combobox
   */
  setComboboxAttributes(
    element: HTMLElement,
    isOpen: boolean,
    listId: string
  ): void {
    element.setAttribute('role', 'combobox');
    element.setAttribute('aria-expanded', String(isOpen));
    element.setAttribute('aria-controls', listId);
    element.setAttribute('aria-haspopup', 'listbox');
  },

  /**
   * Set up progress indicator
   */
  setProgressAttributes(
    element: HTMLElement,
    current: number,
    max: number,
    label?: string
  ): void {
    element.setAttribute('role', 'progressbar');
    element.setAttribute('aria-valuenow', String(current));
    element.setAttribute('aria-valuemax', String(max));
    element.setAttribute('aria-valuemin', '0');
    if (label) {
      element.setAttribute('aria-label', label);
    }
  },

  /**
   * Mark element as loading
   */
  setLoadingAttributes(element: HTMLElement, isLoading: boolean): void {
    if (isLoading) {
      element.setAttribute('aria-busy', 'true');
      element.setAttribute('aria-label', 'Loading');
    } else {
      element.removeAttribute('aria-busy');
    }
  },

  /**
   * Set up live region for updates
   */
  setLiveRegionAttributes(
    element: HTMLElement,
    priority: 'polite' | 'assertive' = 'polite',
    atomic = false
  ): void {
    element.setAttribute('aria-live', priority);
    element.setAttribute('aria-atomic', String(atomic));
  },
};

/**
 * Skip link utilities
 */
export const skipLinkUtils = {
  /**
   * Create skip link to main content
   */
  createMainContentSkipLink(): HTMLAnchorElement {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-50 focus:bg-black focus:text-white focus:p-2';
    skipLink.textContent = 'Skip to main content';
    return skipLink;
  },

  /**
   * Create skip link to navigation
   */
  createNavigationSkipLink(): HTMLAnchorElement {
    const skipLink = document.createElement('a');
    skipLink.href = '#navigation';
    skipLink.className = 'sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-50 focus:bg-black focus:text-white focus:p-2';
    skipLink.textContent = 'Skip to navigation';
    return skipLink;
  },
};

/**
 * Color contrast utilities
 */
export const contrastUtils = {
  /**
   * Calculate relative luminance (WCAG formula)
   */
  getLuminance(rgb: string): number {
    const matches = rgb.match(/\d+/g);
    if (!matches || matches.length < 3) return 0;

    const [r, g, b] = matches.map(v => {
      const val = parseInt(v) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * Calculate contrast ratio (WCAG formula)
   */
  getContrastRatio(foreground: string, background: string): number {
    const l1 = this.getLuminance(foreground);
    const l2 = this.getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
   */
  isWCAGAACompliant(foreground: string, background: string, largeText = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return largeText ? ratio >= 3 : ratio >= 4.5;
  },

  /**
   * Check WCAG AAA compliance (7:1 for normal text, 4.5:1 for large text)
   */
  isWCAGAAACompliant(foreground: string, background: string, largeText = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return largeText ? ratio >= 4.5 : ratio >= 7;
  },
};

/**
 * Keyboard shortcut utilities
 */
export const shortcutUtils = {
  /**
   * Register keyboard shortcut
   */
  registerShortcut(
    keys: string[],
    callback: () => void,
    options?: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean }
  ): () => void {
    const handler = (event: KeyboardEvent) => {
      const matchCtrl = (options?.ctrlKey ?? false) === event.ctrlKey;
      const matchShift = (options?.shiftKey ?? false) === event.shiftKey;
      const matchAlt = (options?.altKey ?? false) === event.altKey;
      const matchKey = keys.includes(event.key.toLowerCase());

      if (matchCtrl && matchShift && matchAlt && matchKey) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handler);

    // Return unregister function
    return () => {
      document.removeEventListener('keydown', handler);
    };
  },
};

export default {
  isActivationKey,
  isEscapeKey,
  isArrowKey,
  getArrowDirection,
  announceToScreenReader,
  focusUtils,
  ariaUtils,
  skipLinkUtils,
  contrastUtils,
  shortcutUtils,
};

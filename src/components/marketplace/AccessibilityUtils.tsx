import React from "react";

/**
 * Accessibility utilities for marketplace components
 * Provides ARIA labels, keyboard navigation, and semantic HTML utilities
 */

/**
 * Enhanced input with proper ARIA labels and error handling
 */
export interface AccessibleInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  errorMessage?: string;
  required?: boolean;
  helperText?: string;
}

export const createAriaLabel = (
  label: string,
  required?: boolean,
  errorMessage?: string
): string => {
  let fullLabel = label;
  if (required) fullLabel += ", required";
  if (errorMessage) fullLabel += `, error: ${errorMessage}`;
  return fullLabel;
};

/**
 * Keyboard navigation handler utilities
 */
export const keyboardHandlers = {
  /**
   * Handle Enter key for button-like elements
   */
  handleEnterKey: (
    e: React.KeyboardEvent,
    callback: () => void
  ): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      callback();
    }
  },

  /**
   * Handle Space key for button-like elements
   */
  handleSpaceKey: (
    e: React.KeyboardEvent,
    callback: () => void
  ): void => {
    if (e.key === " ") {
      e.preventDefault();
      callback();
    }
  },

  /**
   * Handle Escape key for closing modals/popovers
   */
  handleEscapeKey: (
    e: React.KeyboardEvent,
    callback: () => void
  ): void => {
    if (e.key === "Escape") {
      e.preventDefault();
      callback();
    }
  },

  /**
   * Handle Arrow keys for navigation
   */
  handleArrowKeys: (
    e: React.KeyboardEvent,
    onLeft?: () => void,
    onRight?: () => void,
    onUp?: () => void,
    onDown?: () => void
  ): void => {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        onLeft?.();
        break;
      case "ArrowRight":
        e.preventDefault();
        onRight?.();
        break;
      case "ArrowUp":
        e.preventDefault();
        onUp?.();
        break;
      case "ArrowDown":
        e.preventDefault();
        onDown?.();
        break;
    }
  },
};

/**
 * ARIA live region utilities for announcements
 */
export const liveRegionAriaLabel = {
  /**
   * For cart updates (item added, removed, quantity changed)
   */
  cartUpdate: (action: "added" | "removed" | "updated", productName: string, quantity?: number): string => {
    switch (action) {
      case "added":
        return `${productName} added to cart${quantity ? ` with quantity ${quantity}` : ""}`;
      case "removed":
        return `${productName} removed from cart`;
      case "updated":
        return `${productName} quantity updated to ${quantity}`;
      default:
        return "";
    }
  },

  /**
   * For form validation errors
   */
  validationError: (fieldName: string, errorMessage: string): string => {
    return `Validation error in ${fieldName}: ${errorMessage}`;
  },

  /**
   * For price updates
   */
  priceUpdate: (oldPrice: number, newPrice: number): string => {
    return `Price updated from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}`;
  },

  /**
   * For stock status changes
   */
  stockUpdate: (productName: string, inStock: boolean): string => {
    return `${productName} is now ${inStock ? "in stock" : "out of stock"}`;
  },

  /**
   * For order status updates
   */
  orderStatusUpdate: (orderId: string, status: string): string => {
    return `Order ${orderId} status updated to ${status}`;
  },
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Move focus to next focusable element
   */
  focusNext: (element: HTMLElement): void => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const focusableArray = Array.from(focusableElements) as HTMLElement[];
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = focusableArray.indexOf(currentElement);

    if (currentIndex < focusableArray.length - 1) {
      focusableArray[currentIndex + 1]?.focus();
    } else {
      focusableArray[0]?.focus();
    }
  },

  /**
   * Move focus to previous focusable element
   */
  focusPrevious: (element: HTMLElement): void => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const focusableArray = Array.from(focusableElements) as HTMLElement[];
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = focusableArray.indexOf(currentElement);

    if (currentIndex > 0) {
      focusableArray[currentIndex - 1]?.focus();
    } else {
      focusableArray[focusableArray.length - 1]?.focus();
    }
  },

  /**
   * Set focus to specific element
   */
  setFocus: (element: HTMLElement | null): void => {
    if (element) {
      setTimeout(() => {
        element.focus();
        // Announce focus change for screen readers
        const label = element.getAttribute("aria-label") || element.textContent;
        if (label) {
          const announcement = document.createElement("div");
          announcement.setAttribute("role", "status");
          announcement.setAttribute("aria-live", "polite");
          announcement.className = "sr-only";
          announcement.textContent = `Focused on ${label}`;
          document.body.appendChild(announcement);
          setTimeout(() => announcement.remove(), 1000);
        }
      }, 0);
    }
  },
};

/**
 * Screen reader only text component
 */
export const ScreenReaderOnly: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

/**
 * Accessible product card button group
 */
export const AccessibleProductActions: React.FC<{
  productId: string;
  productName: string;
  onAddToCart?: () => void;
  onAddToWishlist?: () => void;
  onQuickView?: () => void;
}> = ({
  productId,
  productName,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
}) => {
  return (
    <div
      role="group"
      aria-label={`Actions for ${productName}`}
      className="flex gap-2"
    >
      {onAddToCart && (
        <button
          aria-label={`Add ${productName} to cart`}
          onClick={onAddToCart}
          className="flex-1 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add to Cart
        </button>
      )}
      {onAddToWishlist && (
        <button
          aria-label={`Add ${productName} to wishlist`}
          onClick={onAddToWishlist}
          className="flex-1 px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save
        </button>
      )}
      {onQuickView && (
        <button
          aria-label={`Quick view ${productName}`}
          onClick={onQuickView}
          className="flex-1 px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          View
        </button>
      )}
    </div>
  );
};

/**
 * Accessible star rating component
 */
export const AccessibleStarRating: React.FC<{
  rating: number;
  maxRating?: number;
  reviewCount?: number;
}> = ({ rating, maxRating = 5, reviewCount }) => {
  const percentage = ((rating / maxRating) * 100).toFixed(1);

  return (
    <div
      role="img"
      aria-label={`${rating} out of ${maxRating} stars${reviewCount ? `, based on ${reviewCount} reviews` : ""}`}
      className="flex items-center gap-2"
    >
      <div className="flex gap-1">
        {Array.from({ length: maxRating }).map((_, i) => (
          <span
            key={i}
            className={`text-lg ${
              i < Math.round(rating)
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
      </div>
      {reviewCount && (
        <span className="text-sm text-gray-600">
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
};

/**
 * Accessible price display component
 */
export const AccessiblePrice: React.FC<{
  price: number;
  originalPrice?: number;
  currency?: string;
}> = ({ price, originalPrice, currency = "$" }) => {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className="space-y-1">
      <div
        aria-label={`Price: ${currency}${price.toFixed(2)}${originalPrice ? ` originally ${currency}${originalPrice.toFixed(2)}` : ""}`}
        className="flex items-center gap-2"
      >
        <span className="text-xl font-bold">
          {currency}
          {price.toFixed(2)}
        </span>
        {originalPrice && (
          <>
            <span className="line-through text-gray-500">
              {currency}
              {originalPrice.toFixed(2)}
            </span>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">
              {discount}% off
            </span>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Accessible product quantity selector
 */
export const AccessibleQuantitySelector: React.FC<{
  value: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  label?: string;
}> = ({ value, onChange, min = 1, max = 999, label = "Quantity" }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (value < max) onChange(value + 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (value > min) onChange(value - 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="quantity" className="text-sm font-medium">
        {label}:
      </label>
      <div className="flex items-center border rounded">
        <button
          aria-label={`Decrease ${label}`}
          onClick={() => value > min && onChange(value - 1)}
          disabled={value <= min}
          className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        >
          −
        </button>
        <input
          id="quantity"
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
          onKeyDown={handleKeyDown}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          className="w-12 text-center border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
          min={min}
          max={max}
        />
        <button
          aria-label={`Increase ${label}`}
          onClick={() => value < max && onChange(value + 1)}
          disabled={value >= max}
          className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        >
          +
        </button>
      </div>
    </div>
  );
};

/**
 * Accessible progress indicator
 */
export const AccessibleProgressIndicator: React.FC<{
  current: number;
  total: number;
  label?: string;
}> = ({ current, total, label }) => {
  const percentage = (current / total) * 100;

  return (
    <div aria-label={label || `Progress: ${current} of ${total}`}>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
      {label && (
        <p className="text-sm text-gray-600 mt-2">
          {label} {current} of {total}
        </p>
      )}
    </div>
  );
};

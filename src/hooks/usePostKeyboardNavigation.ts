import { useEffect, useCallback, useRef } from "react";

interface UsePostKeyboardNavigationOptions {
  enabled?: boolean;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
}

/**
 * Hook for handling keyboard navigation in post lists
 * Supports:
 * - Arrow Up/Down: Navigate between posts
 * - Arrow Left/Right: Navigate between tabs/sections
 * - Enter: Open post detail modal
 * - Escape: Close modal or clear selection
 */
export const usePostKeyboardNavigation = ({
  enabled = true,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onEnter,
  onEscape,
}: UsePostKeyboardNavigationOptions) => {
  const handleRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't handle if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          onArrowUp?.();
          break;

        case "ArrowDown":
          event.preventDefault();
          onArrowDown?.();
          break;

        case "ArrowLeft":
          event.preventDefault();
          onArrowLeft?.();
          break;

        case "ArrowRight":
          event.preventDefault();
          onArrowRight?.();
          break;

        case "Enter":
          // Only handle Enter if no modifier keys are pressed
          if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            onEnter?.();
          }
          break;

        case "Escape":
          event.preventDefault();
          onEscape?.();
          break;

        default:
          break;
      }
    },
    [enabled, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  const setFocusRef = useCallback((element: HTMLElement | null) => {
    handleRef.current = element;
    if (element) {
      element.focus();
    }
  }, []);

  return { setFocusRef };
};

/**
 * Hook for managing focus within a list of posts
 * Allows keyboard navigation between posts using arrow keys
 */
export const usePostListKeyboardNavigation = (
  postIds: string[],
  onPostSelect: (postId: string) => void
) => {
  const currentIndexRef = useRef<number>(-1);

  const handleNavigate = useCallback(
    (direction: "up" | "down") => {
      if (postIds.length === 0) return;

      const newIndex =
        direction === "down"
          ? Math.min(currentIndexRef.current + 1, postIds.length - 1)
          : Math.max(currentIndexRef.current - 1, 0);

      currentIndexRef.current = newIndex;
      onPostSelect(postIds[newIndex]);

      // Scroll into view
      const element = document.getElementById(`post-${postIds[newIndex]}`);
      element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
    [postIds, onPostSelect]
  );

  const handleSelect = useCallback(() => {
    if (currentIndexRef.current >= 0 && currentIndexRef.current < postIds.length) {
      onPostSelect(postIds[currentIndexRef.current]);
    }
  }, [postIds, onPostSelect]);

  const handleReset = useCallback(() => {
    currentIndexRef.current = -1;
  }, []);

  return {
    navigate: handleNavigate,
    select: handleSelect,
    reset: handleReset,
    currentIndex: currentIndexRef.current,
  };
};

export default usePostKeyboardNavigation;

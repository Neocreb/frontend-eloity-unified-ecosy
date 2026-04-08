import { useEffect, useCallback, useRef } from "react";

interface KeyboardActions {
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onOpenDetail?: () => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  onClose?: () => void;
}

/**
 * Hook for keyboard navigation and shortcuts in post components
 * Supports: L (like), C (comment), S (share), B (save), Enter (open detail), ArrowUp/Down (navigate), Escape (close)
 */
export const usePostKeyboardNavigation = (
  actions: KeyboardActions,
  enabled: boolean = true
) => {
  const focusedRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      if (isTyping) return;

      // Case-insensitive letter shortcuts
      const key = event.key.toLowerCase();

      switch (key) {
        case "l":
          // Like
          if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            actions.onLike?.();
          }
          break;

        case "c":
          // Comment
          if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            actions.onComment?.();
          }
          break;

        case "s":
          // Share
          if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            actions.onShare?.();
          }
          break;

        case "b":
          // Bookmark/Save
          if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            actions.onSave?.();
          }
          break;

        case "enter":
          // Open detail view
          if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            actions.onOpenDetail?.();
          }
          break;

        case "arrowup":
          // Navigate to previous post
          event.preventDefault();
          actions.onNavigatePrevious?.();
          break;

        case "arrowdown":
          // Navigate to next post
          event.preventDefault();
          actions.onNavigateNext?.();
          break;

        case "escape":
          // Close modal/detail view
          event.preventDefault();
          actions.onClose?.();
          break;

        default:
          break;
      }
    },
    [actions, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    focusedRef,
    shortcuts: {
      like: "L",
      comment: "C",
      share: "S",
      save: "B",
      openDetail: "Enter",
      previousPost: "↑",
      nextPost: "↓",
      closeModal: "Esc",
    },
  };
};

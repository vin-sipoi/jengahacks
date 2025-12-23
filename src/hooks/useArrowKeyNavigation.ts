import { useEffect, useRef, type RefObject } from "react";

interface UseArrowKeyNavigationOptions {
  /**
   * Whether arrow key navigation is enabled
   */
  enabled?: boolean;
  /**
   * Orientation of navigation (horizontal or vertical)
   */
  orientation?: "horizontal" | "vertical" | "both";
  /**
   * Selector for focusable items within the container
   */
  itemSelector?: string;
  /**
   * Whether to loop navigation (wrap around)
   */
  loop?: boolean;
}

/**
 * Hook for arrow key navigation in lists, menus, and grids
 */
export const useArrowKeyNavigation = (
  options: UseArrowKeyNavigationOptions = {}
): RefObject<HTMLElement> => {
  const {
    enabled = true,
    orientation = "vertical",
    itemSelector = 'a, button, [tabindex]:not([tabindex="-1"])',
    loop = true,
  } = options;

  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(itemSelector)
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden";
      });

      if (focusableElements.length === 0) {
        return;
      }

      const currentIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement
      );

      let nextIndex = currentIndex;

      if (
        (orientation === "vertical" || orientation === "both") &&
        e.key === "ArrowDown"
      ) {
        e.preventDefault();
        nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : loop ? 0 : currentIndex;
      } else if (
        (orientation === "vertical" || orientation === "both") &&
        e.key === "ArrowUp"
      ) {
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : loop ? focusableElements.length - 1 : currentIndex;
      } else if (
        (orientation === "horizontal" || orientation === "both") &&
        e.key === "ArrowRight"
      ) {
        e.preventDefault();
        nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : loop ? 0 : currentIndex;
      } else if (
        (orientation === "horizontal" || orientation === "both") &&
        e.key === "ArrowLeft"
      ) {
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : loop ? focusableElements.length - 1 : currentIndex;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = focusableElements.length - 1;
      }

      if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
        focusableElements[nextIndex].focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, orientation, itemSelector, loop]);

  return containerRef;
};


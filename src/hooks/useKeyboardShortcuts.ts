import { useEffect } from "react";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
}

/**
 * Hook for managing keyboard shortcuts
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const matchesKey = event.key === shortcut.key || event.code === shortcut.key;
        const matchesCtrl = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const matchesMeta = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;
        const matchesShift = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const matchesAlt = shortcut.altKey === undefined || event.altKey === shortcut.altKey;

        if (matchesKey && matchesCtrl && matchesMeta && matchesShift && matchesAlt) {
          event.preventDefault();
          shortcut.handler(event);
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
};

/**
 * Common keyboard shortcuts for the application
 */
export const commonShortcuts = {
  focusSearch: {
    key: "k",
    ctrlKey: true,
    handler: () => {
      const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]');
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: "Focus search",
  },
  focusMainContent: {
    key: "m",
    ctrlKey: true,
    handler: () => {
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    description: "Focus main content",
  },
  scrollToTop: {
    key: "Home",
    ctrlKey: true,
    handler: () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    description: "Scroll to top",
  },
  scrollToBottom: {
    key: "End",
    ctrlKey: true,
    handler: () => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    },
    description: "Scroll to bottom",
  },
};


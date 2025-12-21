import { cn } from "@/lib/utils";

/**
 * SkipLink component provides a "Skip to main content" link
 * for keyboard users to bypass navigation
 */
const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
        "focus:z-[100] focus:px-4 focus:py-2",
        "focus:bg-primary focus:text-primary-foreground",
        "focus:rounded-md focus:font-medium",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-all duration-200"
      )}
      onClick={(e) => {
        e.preventDefault();
        const mainContent = document.getElementById("main-content");
        if (mainContent) {
          mainContent.focus();
          mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }}
    >
      Skip to main content
    </a>
  );
};

export default SkipLink;


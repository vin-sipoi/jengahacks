import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LiveRegionProps {
  message: string;
  priority?: "polite" | "assertive" | "off";
  className?: string;
  id?: string;
}

/**
 * LiveRegion component provides screen reader announcements
 * for dynamic content changes
 */
const LiveRegion = ({
  message,
  priority = "polite",
  className,
  id,
}: LiveRegionProps) => {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && regionRef.current) {
      // Clear previous message to ensure re-announcement
      regionRef.current.textContent = "";
      // Use setTimeout to ensure the clear happens before the new message
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [message]);

  return (
    <div
      ref={regionRef}
      id={id}
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {message}
    </div>
  );
};

export default LiveRegion;


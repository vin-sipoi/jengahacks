import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initGA, trackPageView, isGAEnabled } from "@/lib/analytics";

const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize GA on mount
    if (isGAEnabled()) {
      initGA();
    }
  }, []);

  useEffect(() => {
    // Track page views on route changes
    if (isGAEnabled()) {
      trackPageView(location.pathname + location.search);
    }
  }, [location]);

  // Don't render anything - this is a side-effect component
  return null;
};

export default GoogleAnalytics;



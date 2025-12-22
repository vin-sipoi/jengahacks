import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Sponsorship from "./pages/Sponsorship";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Admin from "./pages/Admin";
import ThankYou from "./pages/ThankYou";
import ManageRegistration from "./pages/ManageRegistration";
import NotFound from "./pages/NotFound";
import GoogleAnalytics from "./components/GoogleAnalytics";
import PageTransition from "./components/PageTransition";
import { useKeyboardShortcuts, commonShortcuts } from "./hooks/useKeyboardShortcuts";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  // Enable global keyboard shortcuts
  useKeyboardShortcuts([
    commonShortcuts.focusMainContent,
    commonShortcuts.scrollToTop,
    commonShortcuts.scrollToBottom,
  ]);

  return (
    <PageTransition key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Index />} />
        <Route path="/sponsorship" element={<Sponsorship />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/manage-registration" element={<ManageRegistration />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <GoogleAnalytics />
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

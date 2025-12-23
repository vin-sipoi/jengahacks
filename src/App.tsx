import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import GoogleAnalytics from "./components/GoogleAnalytics";
import PageTransition from "./components/PageTransition";
import { useKeyboardShortcuts, commonShortcuts } from "./hooks/useKeyboardShortcuts";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load routes for code splitting
const Index = lazy(() => import("./pages/Index"));
const Sponsorship = lazy(() => import("./pages/Sponsorship"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const ManageRegistration = lazy(() => import("./pages/ManageRegistration"));
const Health = lazy(() => import("./pages/Health"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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
      <Suspense fallback={<PageLoader />}>
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/sponsorship" element={<Sponsorship />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/manage-registration" element={<ManageRegistration />} />
          <Route path="/health" element={<Health />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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

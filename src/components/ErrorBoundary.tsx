import { Component, ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch React errors and report them to Sentry
 * Wraps the entire application to catch unhandled errors
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Reload the page to ensure clean state
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} onGoHome={this.handleGoHome} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
  onGoHome: () => void;
}

/**
 * Default error fallback UI
 */
const ErrorFallback = ({ error, onReset, onGoHome }: ErrorFallbackProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4" role="alert" aria-live="assertive">
      <div className="max-w-md w-full bg-card rounded-lg border border-border p-6 text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold mb-2">{t("error.title") || "Something went wrong"}</h1>
          <p className="text-muted-foreground mb-4">
            {t("error.message") || "We're sorry, but something unexpected happened. Our team has been notified."}
          </p>
        </div>

        {import.meta.env.DEV && error && (
          <div className="bg-muted p-4 rounded text-left text-sm font-mono overflow-auto max-h-48">
            <div className="text-destructive font-semibold mb-2">{error.name}</div>
            <div className="text-muted-foreground">{error.message}</div>
            {error.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground">Stack trace</summary>
                <pre className="mt-2 text-xs overflow-auto">{error.stack}</pre>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onReset} variant="hero" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("error.reload") || "Reload Page"}
          </Button>
          <Button onClick={onGoHome} variant="outline" className="flex items-center gap-2">
            <Home className="h-4 w-4" aria-hidden="true" />
            {t("error.goHome") || "Go Home"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Export Sentry's ErrorBoundary wrapper for convenience
export const SentryErrorBoundary = Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: ({ error }) => <ErrorFallback error={error} onReset={() => window.location.reload()} onGoHome={() => window.location.href = "/"} />,
  showDialog: false, // We handle UI ourselves
});

export default ErrorBoundary;


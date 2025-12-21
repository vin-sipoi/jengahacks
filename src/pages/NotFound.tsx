import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    // Only log in development mode to prevent information leakage in production
    // This prevents exposing internal routing structure or sensitive URL parameters
    if (import.meta.env.DEV) {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted" role="main" aria-labelledby="not-found-heading">
      <div className="text-center">
        <h1 id="not-found-heading" className="mb-4 text-4xl font-bold">{t("notFound.title")}</h1>
        <p className="mb-4 text-xl text-muted-foreground" role="alert">{t("notFound.message")}</p>
        <Link to="/" className="text-primary underline hover:text-primary/90" aria-label="Return to homepage">
          {t("notFound.returnHome")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { Lock, Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const AdminAuth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkExistingAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Check if user has admin role
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin");

          if (roles && roles.length > 0) {
            navigate("/admin");
            return;
          }
        }
      } catch (error) {
        logger.error("Error checking auth", error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Check admin role after sign in
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin");

        if (roles && roles.length > 0) {
          navigate("/admin");
        } else {
          toast.error(t("adminAuth.errors.accessDenied"));
          await supabase.auth.signOut();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const errorMessage = result.error.errors[0].message;
        // Map validation errors to translation keys
        if (errorMessage.includes("email")) {
          toast.error(t("adminAuth.errors.invalidEmail"));
        } else if (errorMessage.includes("Password")) {
          toast.error(t("adminAuth.errors.passwordMinLength"));
        } else {
          toast.error(errorMessage);
        }
        setIsLoading(false);
        return;
      }

      const trimmedEmail = email.trim();
      logger.debug("Attempting login", { email: trimmedEmail, passwordLength: password.length });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });

      if (error) {
        logger.error("Login error", error, { 
          email: trimmedEmail,
          errorCode: error.status,
          errorMessage: error.message 
        });
        // Provide more user-friendly error messages
        if (error.message.includes("Invalid login credentials")) {
          toast.error(t("adminAuth.errors.invalidCredentials") || "Invalid email or password. Please check your credentials and try again.");
          console.error("🔍 Detailed troubleshooting:");
          console.error("Email used:", trimmedEmail);
          console.error("Password length:", password.length);
          console.error("Error status:", error.status);
          console.error("");
          console.error("💡 Check these in Supabase Dashboard:");
          console.error("1. Authentication → Users → Find your user");
          console.error("2. Verify email matches exactly (case-sensitive)");
          console.error("3. Check 'Email Confirmed' status - should be green/confirmed");
          console.error("4. Try resetting the password if unsure");
          console.error("");
          console.error("📋 Run this SQL to check user status:");
          console.error(`   SELECT email, email_confirmed_at, encrypted_password IS NOT NULL as has_password`);
          console.error(`   FROM auth.users WHERE LOWER(email) = LOWER('${trimmedEmail}');`);
          console.error("");
          console.error("🔧 If email is not confirmed, run this SQL to confirm it:");
          console.error(`   UPDATE auth.users SET email_confirmed_at = NOW() WHERE LOWER(email) = LOWER('${trimmedEmail}');`);
        } else if (error.message.includes("Email not confirmed")) {
          toast.error(t("adminAuth.errors.emailNotConfirmed") || "Please confirm your email address before logging in.");
        } else if (error.message.includes("User not found")) {
          toast.error(t("adminAuth.errors.userNotFound") || "No account found with this email address. Please create an admin user first.");
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Check if user has admin role
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin");

        if (rolesError) {
          logger.error("Error checking admin role", rolesError);
          toast.error(t("adminAuth.errors.verifyPrivileges"));
          await supabase.auth.signOut();
          return;
        }

        if (!roles || roles.length === 0) {
          toast.error(t("adminAuth.errors.accessDenied"));
          await supabase.auth.signOut();
          return;
        }

        toast.success(t("adminAuth.success.welcome"));
        navigate("/admin");
      }
    } catch (error) {
      logger.error("Login error", error instanceof Error ? error : new Error(String(error)));
      toast.error(t("adminAuth.errors.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">{t("adminAuth.checkingAuth")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">{t("adminAuth.title")}</CardTitle>
          </div>
          <CardDescription>
            {t("adminAuth.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("adminAuth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("adminAuth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("adminAuth.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("adminAuth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-muted z-10 cursor-pointer"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("adminAuth.signingIn") : t("adminAuth.signIn")}
            </Button>
          </form>
          <div className="mt-4">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("adminAuth.backToHome")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;

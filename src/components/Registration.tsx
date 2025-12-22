import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Linkedin, CheckCircle, AlertCircle, XCircle, MessageCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import LiveRegion from "@/components/LiveRegion";
import { logIncompleteRegistration } from "@/lib/incompleteRegistration";
import { checkRateLimit, formatRetryAfter, recordSubmission } from "@/lib/rateLimit";
import { useRegistrationForm } from "@/hooks/useRegistrationForm";
import { useFileUpload } from "@/hooks/useFileUpload";
import { registrationService } from "@/services/registrationService";
import { FileUploadField } from "@/components/FileUploadField";
import { CaptchaField } from "@/components/CaptchaField";
import ReCAPTCHA from "react-google-recaptcha";
import { normalizeWhatsAppNumber } from "@/lib/security";
import { DEBOUNCE_DELAY_MS } from "@/lib/constants";

const Registration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const emailDebounceTimerRef = useRef<number | null>(null);
  const whatsappDebounceTimerRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);

  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

  const {
    formData,
    setFormData,
    errors,
    setErrors,
    touched,
    setTouched,
    hasLinkedIn,
    hasResume,
    setHasResume,
    handleInputChange,
    handleBlur,
    validateAllFields,
    resetForm,
  } = useRegistrationForm();

  const { fileInputRef, validateFile, uploadFile, resetFileInput } = useFileUpload();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  // Cleanup effect to log incomplete registration on unmount
  useEffect(() => {
    return () => {
      // Cleanup: log incomplete registration if user leaves without completing
      if (emailDebounceTimerRef.current) {
        window.clearTimeout(emailDebounceTimerRef.current);
      }
      if (whatsappDebounceTimerRef.current) {
        window.clearTimeout(whatsappDebounceTimerRef.current);
      }

      // Log if email or WhatsApp number was entered but registration not completed
      const hasEmail = formData.email.trim() && formData.email.trim().includes("@");
      const hasWhatsApp = formData.whatsapp.trim().length > 0;

      if (!hasCompletedRef.current && (hasEmail || hasWhatsApp)) {
        logIncompleteRegistration({
          email: hasEmail ? formData.email.trim() : undefined,
          whatsappNumber: hasWhatsApp ? formData.whatsapp.trim() : undefined,
          fullName: formData.fullName.trim() || undefined,
          formData: {
            hasWhatsApp: !!formData.whatsapp.trim(),
            hasLinkedIn: !!formData.linkedIn.trim(),
            hasResume: !!formData.resume,
          },
        }).catch(() => {
          // Silently fail - non-critical logging
        });
      }
    };
  }, [formData.email, formData.fullName, formData.whatsapp, formData.linkedIn, formData.resume]);

  // Debounced logging for incomplete registrations
  useEffect(() => {
    if (emailDebounceTimerRef.current) {
      window.clearTimeout(emailDebounceTimerRef.current);
    }

    if (formData.email.trim() && formData.email.trim().includes("@")) {
      emailDebounceTimerRef.current = window.setTimeout(() => {
        logIncompleteRegistration({
          email: formData.email.trim(),
          fullName: formData.fullName.trim() || undefined,
          formData: {
            hasWhatsApp: !!formData.whatsapp.trim(),
            hasLinkedIn: !!formData.linkedIn.trim(),
            hasResume: !!formData.resume,
          },
        }).catch(() => {
          // Silently fail
        });
      }, DEBOUNCE_DELAY_MS);
    }

    return () => {
      if (emailDebounceTimerRef.current) {
        window.clearTimeout(emailDebounceTimerRef.current);
      }
    };
  }, [formData.email, formData.fullName, formData.whatsapp, formData.linkedIn, formData.resume]);

  useEffect(() => {
    if (whatsappDebounceTimerRef.current) {
      window.clearTimeout(whatsappDebounceTimerRef.current);
    }

    if (formData.whatsapp.trim()) {
      whatsappDebounceTimerRef.current = window.setTimeout(() => {
        logIncompleteRegistration({
          whatsappNumber: formData.whatsapp.trim(),
          fullName: formData.fullName.trim() || undefined,
          formData: {
            hasWhatsApp: true,
            hasLinkedIn: !!formData.linkedIn.trim(),
            hasResume: !!formData.resume,
          },
        }).catch(() => {
          // Silently fail
        });
      }, DEBOUNCE_DELAY_MS);
    }

    return () => {
      if (whatsappDebounceTimerRef.current) {
        window.clearTimeout(whatsappDebounceTimerRef.current);
      }
    };
  }, [formData.whatsapp, formData.fullName, formData.linkedIn, formData.resume]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setErrors((prev) => ({ ...prev, resume: validationError }));
        setHasResume(false);
        return;
      }

      setFormData((prev) => ({ ...prev, resume: file }));
      setHasResume(true);
      setErrors((prev) => ({ ...prev, resume: undefined }));
    } else {
      setHasResume(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched for validation
    setTouched({ fullName: true, email: true, whatsapp: true, linkedIn: true });

    // Validate all fields
    const newErrors = validateAllFields(captchaToken, RECAPTCHA_SITE_KEY);
    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some((error) => error !== undefined)) {
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors).find(
        (key) => newErrors[key as keyof typeof newErrors]
      );
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element && typeof element.scrollIntoView === "function") {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        element?.focus();
      }
      // Also show toast for critical errors
      if (newErrors.fullName || newErrors.email) {
        toast.error("Please fix the errors in the form");
      }
      return;
    }

    // Check client-side rate limit
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      const retryMessage = rateLimitCheck.retryAfter
        ? t("registration.errors.rateLimit", { time: formatRetryAfter(rateLimitCheck.retryAfter) })
        : t("registration.errors.rateLimit", { time: t("common.retry") });
      toast.error(retryMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload resume if provided
      let resumePath: string | null = null;
      if (formData.resume) {
        const uploadResult = await uploadFile(formData.resume);
        if (!uploadResult.success) {
          toast.error(uploadResult.error || t("registration.errors.failed"));
          setIsSubmitting(false);
          return;
        }
        resumePath = uploadResult.resumePath;
      }

      // Submit registration
      const result = await registrationService.submit(formData, resumePath);

      if (!result.success) {
        toast.error(result.error || t("registration.errors.failed"));
        setIsSubmitting(false);
        return;
      }

      // Record successful submission for rate limiting
      recordSubmission();

      // Mark as completed
      hasCompletedRef.current = true;

      // Show success message
      const successMessage = result.isWaitlist
        ? t("registration.waitlistSuccess")
        : t("registration.success");
      toast.success(successMessage);
      setLiveMessage(successMessage);

      // Reset form
      resetForm();
      resetFileInput();
      recaptchaRef.current?.reset();
      setCaptchaToken(null);

      // Navigate to thank you page
      const params = new URLSearchParams();
      const email = formData.email.trim().toLowerCase();
      const fullName = formData.fullName.trim();
      if (email) params.set("email", email);
      if (fullName) params.set("name", fullName);
      if (result.isWaitlist) params.set("waitlist", "true");
      if (result.waitlistPosition !== undefined)
        params.set("position", result.waitlistPosition.toString());
      if (result.accessToken) params.set("token", result.accessToken);
      if (result.registrationId) params.set("id", result.registrationId);
      const queryString = params.toString();
      const emailParam = queryString ? `?${queryString}` : "";

      navigate(`/thank-you${emailParam}`);
    } catch (error) {
      toast.error(t("registration.errors.failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="register" className="pt-12 sm:pt-16 pb-16 sm:pb-24 relative">
      <div className="absolute inset-0 circuit-pattern opacity-10" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4">
              <span className="text-gradient">{t("registration.title")}</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg px-4">
              {t("registration.subtitle")}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 sm:space-y-6 bg-card p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-border"
            onKeyDown={(e) => {
              // Allow Ctrl/Cmd + Enter to submit form
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
          >
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className={cn(errors.fullName && "text-destructive")}>
                {t("registration.fullName")} *
              </Label>
              <div className="relative">
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={cn(
                    "bg-muted border-border focus:border-primary pr-10 transition-all duration-300",
                    errors.fullName &&
                      "border-destructive focus:border-destructive animate-error-flash",
                    touched.fullName && !errors.fullName && formData.fullName && "border-primary"
                  )}
                  required
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                />
                {touched.fullName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.fullName ? (
                      <XCircle
                        className="w-5 h-5 text-destructive animate-bounce-in"
                        aria-hidden="true"
                      />
                    ) : formData.fullName ? (
                      <CheckCircle
                        className="w-5 h-5 text-primary animate-success-pulse"
                        aria-hidden="true"
                        id="fullName-success"
                      />
                    ) : null}
                  </div>
                )}
              </div>
              {errors.fullName && (
                <p
                  id="fullName-error"
                  className="text-sm text-destructive flex items-center gap-1.5"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className={cn(errors.email && "text-destructive")}>
                {t("registration.email")} *
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={cn(
                    "bg-muted border-border focus:border-primary pr-10 transition-all duration-300",
                    errors.email && "border-destructive focus:border-destructive animate-error-flash",
                    touched.email && !errors.email && formData.email && "border-primary"
                  )}
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {touched.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.email ? (
                      <XCircle
                        className="w-5 h-5 text-destructive animate-bounce-in"
                        aria-hidden="true"
                      />
                    ) : formData.email ? (
                      <CheckCircle
                        className="w-5 h-5 text-primary animate-success-pulse"
                        aria-hidden="true"
                        id="email-success"
                      />
                    ) : null}
                  </div>
                )}
              </div>
              {errors.email && (
                <p
                  id="email-error"
                  className="text-sm text-destructive flex items-center gap-1.5"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className={cn(errors.whatsapp && "text-destructive")}>
                <MessageCircle className="w-4 h-4 inline mr-1.5" aria-hidden="true" />
                {t("registration.whatsapp")}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 inline ml-1.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("registration.whatsappTooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                autoComplete="tel"
                placeholder="+254 700 000000"
                value={formData.whatsapp}
                onChange={(e) => {
                  const normalized = normalizeWhatsAppNumber(e.target.value);
                  handleInputChange({
                    ...e,
                    target: { ...e.target, value: normalized },
                  });
                }}
                onBlur={handleBlur}
                className={cn(
                  "bg-muted border-border focus:border-primary transition-all duration-300",
                  errors.whatsapp &&
                    "border-destructive focus:border-destructive animate-error-flash",
                  touched.whatsapp && !errors.whatsapp && formData.whatsapp && "border-primary"
                )}
                aria-invalid={!!errors.whatsapp}
                aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
              />
              {errors.whatsapp && (
                <p
                  id="whatsapp-error"
                  className="text-sm text-destructive flex items-center gap-1.5"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.whatsapp}</span>
                </p>
              )}
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedIn" className={cn(errors.linkedIn && "text-destructive")}>
                <Linkedin className="w-4 h-4 inline mr-1.5" aria-hidden="true" />
                {t("registration.linkedIn")}
                {hasLinkedIn && !errors.linkedIn && (
                  <CheckCircle
                    className="w-4 h-4 inline ml-1.5 text-primary animate-success-pulse"
                    aria-label={t("aria.linkedInProvided")}
                    aria-hidden="false"
                  />
                )}
              </Label>
              <div className="relative">
                <Input
                  id="linkedIn"
                  name="linkedIn"
                  type="text"
                  autoComplete="url"
                  placeholder="linkedin.com/in/yourprofile"
                  value={formData.linkedIn}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={cn(
                    "bg-muted border-border focus:border-primary pr-10 transition-all duration-300",
                    errors.linkedIn &&
                      "border-destructive focus:border-destructive animate-error-flash",
                    touched.linkedIn && !errors.linkedIn && formData.linkedIn && "border-primary"
                  )}
                  aria-invalid={!!errors.linkedIn}
                  aria-describedby={errors.linkedIn ? "linkedIn-error" : undefined}
                />
                {touched.linkedIn && formData.linkedIn && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.linkedIn ? (
                      <XCircle className="w-5 h-5 text-destructive" aria-hidden="true" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-primary" aria-hidden="true" />
                    )}
                  </div>
                )}
              </div>
              {errors.linkedIn && (
                <p
                  id="linkedIn-error"
                  className="text-sm text-destructive flex items-center gap-1.5"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.linkedIn}</span>
                </p>
              )}
            </div>

            {/* Resume Upload */}
            <FileUploadField
              fileInputRef={fileInputRef}
              file={formData.resume}
              error={errors.resume}
              hasResume={hasResume}
              onChange={handleFileChange}
            />

            {/* CAPTCHA */}
            <CaptchaField
              recaptchaRef={recaptchaRef}
              siteKey={RECAPTCHA_SITE_KEY}
              token={captchaToken}
              error={errors.captcha}
              onTokenChange={(token) => {
                setCaptchaToken(token);
                setErrors((prev) => ({ ...prev, captcha: undefined }));
              }}
              onError={(error) => {
                setCaptchaToken(null);
                setErrors((prev) => ({ ...prev, captcha: t("registration.errors.captchaFailed") }));
              }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-6 text-base sm:text-lg font-semibold"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? t("registration.submitting") : t("registration.submit")}
            </Button>

            {/* Info Text */}
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              {t("registration.info")}
            </p>
          </form>
        </div>
      </div>

      <LiveRegion message={liveMessage} />
    </section>
  );
};

export default Registration;

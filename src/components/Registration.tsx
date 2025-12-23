import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
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

import { RegistrationField } from "@/components/RegistrationField";
import { useInView } from "react-intersection-observer";
import { trackRegistrationView, trackRegistrationStart } from "@/lib/analytics";

const Registration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const hasCompletedRef = useRef(false);

  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";
  const [hasStartedTracking, setHasStartedTracking] = useState(false);

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  useEffect(() => {
    if (inView) {
      trackRegistrationView();
    }
  }, [inView]);

  const handleFormFocus = () => {
    if (!hasStartedTracking) {
      trackRegistrationStart();
      setHasStartedTracking(true);
    }
  };

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

  // Consolidated debounced logging for incomplete registrations
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hasEmail = formData.email.trim().includes("@");
      const hasWhatsApp = !!formData.whatsapp.trim();

      if (!hasCompletedRef.current && (hasEmail || hasWhatsApp)) {
        logIncompleteRegistration({
          email: hasEmail ? formData.email.trim() : undefined,
          whatsappNumber: hasWhatsApp ? formData.whatsapp.trim() : undefined,
          fullName: formData.fullName.trim() || undefined,
          formData: {
            hasWhatsApp,
            hasLinkedIn: !!formData.linkedIn.trim(),
            hasResume: !!formData.resume,
          },
        }).catch((err) => {
          logger.error("Failed to log incomplete registration", err);
        });
      }
    }, DEBOUNCE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [formData.email, formData.fullName, formData.whatsapp, formData.linkedIn, formData.resume]);

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
          // Non-blocking: Show error but continue registration
          toast.error(uploadResult.error || t("registration.errors.failed"));
          logger.warn("Resume upload failed, but proceeding with registration", { 
            error: uploadResult.error,
            email: formData.email 
          });
        } else {
          resumePath = uploadResult.resumePath;
        }
      }

      // Submit registration
      const submissionData = {
        ...formData,
        whatsapp: normalizeWhatsAppNumber(formData.whatsapp)
      };
      const result = await registrationService.submit(submissionData, resumePath);

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
    <section id="register" ref={ref} className="pt-12 sm:pt-16 pb-16 sm:pb-24 relative">
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
            onFocus={handleFormFocus}
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
            <RegistrationField
              id="fullName"
              name="fullName"
              label={t("registration.fullName")}
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              error={errors.fullName}
              touched={touched.fullName}
              required
              autoComplete="name"
            />

            {/* Email */}
            <RegistrationField
              id="email"
              name="email"
              label={t("registration.email")}
              type="email"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              error={errors.email}
              touched={touched.email}
              required
              autoComplete="email"
            />

            {/* WhatsApp */}
            <RegistrationField
              id="whatsapp"
              name="whatsapp"
              label={t("registration.whatsapp")}
              type="tel"
              placeholder="+254 700 000000"
              value={formData.whatsapp}
              onChange={handleInputChange}
              onBlur={handleBlur}
              error={errors.whatsapp}
              touched={touched.whatsapp}
              icon={<MessageCircle className="w-4 h-4 inline" />}
              autoComplete="tel"
            />

            {/* LinkedIn */}
            <RegistrationField
              id="linkedIn"
              name="linkedIn"
              label={t("registration.linkedin")}
              placeholder="linkedin.com/in/yourprofile"
              value={formData.linkedIn}
              onChange={handleInputChange}
              onBlur={handleBlur}
              error={errors.linkedIn}
              touched={touched.linkedIn}
              icon={<Linkedin className="w-4 h-4 inline" />}
              autoComplete="url"
            />

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
              {t("registration.whyCollect")}
            </p>
          </form>
        </div>
      </div>

      <LiveRegion message={liveMessage} />
    </section>
  );
};

export default Registration;

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Linkedin, CheckCircle, AlertCircle, XCircle, MessageCircle, Info } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { supabase } from "@/integrations/supabase/client";
import {
  sanitizeFileName,
  isValidPdfExtension,
  isValidPdfMimeType,
  validateAndSanitizeUrl,
  sanitizeInput,
  isValidEmail,
  isValidFullName,
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
} from "@/lib/security";
import { checkRateLimit, formatRetryAfter, recordSubmission } from "@/lib/rateLimit";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { trackRegistration } from "@/lib/analytics";
import LiveRegion from "@/components/LiveRegion";
import { logIncompleteRegistration, markIncompleteRegistrationCompleted } from "@/lib/incompleteRegistration";

const Registration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    linkedIn: "",
    resume: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLinkedIn, setHasLinkedIn] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    whatsapp?: string;
    linkedIn?: string;
    resume?: string;
    captcha?: string;
  }>({});
  const [touched, setTouched] = useState<{
    fullName?: boolean;
    email?: boolean;
    whatsapp?: boolean;
    linkedIn?: boolean;
  }>({});
  const [liveMessage, setLiveMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const emailDebounceTimerRef = useRef<number | null>(null);
  const whatsappDebounceTimerRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);
  
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

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
      const hasEmail = formData.email.trim() && isValidEmail(formData.email.trim());
      const hasWhatsApp = formData.whatsapp.trim() && isValidWhatsAppNumber(formData.whatsapp.trim());
      
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

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "fullName":
        if (!value.trim()) {
          return t("registration.errors.fullNameRequired");
        }
        if (!isValidFullName(value.trim())) {
          return t("registration.errors.fullNameInvalid");
        }
        return undefined;
      case "email":
        if (!value.trim()) {
          return t("registration.errors.emailRequired");
        }
        if (!isValidEmail(value.trim())) {
          return t("registration.errors.emailInvalid");
        }
        return undefined;
      case "whatsapp":
        if (value.trim() && !isValidWhatsAppNumber(value.trim())) {
          return t("registration.errors.whatsappInvalid");
        }
        return undefined;
      case "linkedIn":
        if (value.trim() && !validateAndSanitizeUrl(value.trim())) {
          return t("registration.errors.linkedinInvalid");
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    
    // Real-time validation for touched fields
    if (touched[name as keyof typeof touched]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
    
    if (name === "linkedIn" && value.trim()) {
      setHasLinkedIn(true);
    } else if (name === "linkedIn") {
      setHasLinkedIn(false);
    }

    // Track email entry for incomplete registration logging
    if (name === "email" && value.trim() && isValidEmail(value.trim())) {
      // Clear existing timer
      if (emailDebounceTimerRef.current) {
        window.clearTimeout(emailDebounceTimerRef.current);
      }

      // Debounce logging (wait 2 seconds after user stops typing)
      emailDebounceTimerRef.current = window.setTimeout(() => {
        if (!hasCompletedRef.current) {
          logIncompleteRegistration({
            email: value.trim(),
            whatsappNumber: formData.whatsapp.trim() || undefined,
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
      }, 2000);
    }

    // Track WhatsApp number entry for incomplete registration logging
    if (name === "whatsapp" && value.trim() && isValidWhatsAppNumber(value.trim())) {
      // Clear existing timer
      if (whatsappDebounceTimerRef.current) {
        window.clearTimeout(whatsappDebounceTimerRef.current);
      }

      // Debounce logging (wait 2 seconds after user stops typing)
      whatsappDebounceTimerRef.current = window.setTimeout(() => {
        if (!hasCompletedRef.current) {
          logIncompleteRegistration({
            email: formData.email.trim() || undefined,
            whatsappNumber: value.trim(),
            fullName: formData.fullName.trim() || undefined,
            formData: {
              hasWhatsApp: true,
              hasLinkedIn: !!formData.linkedIn.trim(),
              hasResume: !!formData.resume,
            },
          }).catch(() => {
            // Silently fail - non-critical logging
          });
        }
      }, 2000);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrors((prev) => ({ ...prev, resume: undefined }));
    
    if (file) {
      // Validate file size first (most common issue)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, resume: t("registration.errors.resumeSize") }));
        e.target.value = ''; // Reset input
        setFormData((prev) => ({ ...prev, resume: null }));
        setHasResume(false);
        return;
      }

      // Validate file extension (more secure check)
      if (!isValidPdfExtension(file.name)) {
        setErrors((prev) => ({ ...prev, resume: t("registration.errors.resumeType") }));
        e.target.value = ''; // Reset input
        setFormData((prev) => ({ ...prev, resume: null }));
        setHasResume(false);
        return;
      }

      // Validate MIME type (additional security layer)
      if (!isValidPdfMimeType(file.type)) {
        setErrors((prev) => ({ ...prev, resume: t("registration.errors.resumeType") }));
        e.target.value = ''; // Reset input
        setFormData((prev) => ({ ...prev, resume: null }));
        setHasResume(false);
        return;
      }

      // File is valid
      setFormData((prev) => ({ ...prev, resume: file }));
      setHasResume(true);
      setErrors((prev) => ({ ...prev, resume: undefined }));
    } else {
      setHasResume(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Capture and sanitize form data before async operations
    const fullName = sanitizeInput(formData.fullName.trim(), 100);
    const email = formData.email.trim().toLowerCase();
    const whatsapp = formData.whatsapp.trim();
    const linkedIn = formData.linkedIn.trim();
    const resume = formData.resume;
    
    // Mark all fields as touched for validation
    setTouched({ fullName: true, email: true, whatsapp: true, linkedIn: true });
    
    // Validate all fields
    const fullNameError = validateField("fullName", fullName);
    const emailError = validateField("email", email);
    const whatsappError = whatsapp ? validateField("whatsapp", whatsapp) : undefined;
    const linkedInError = linkedIn ? validateField("linkedIn", linkedIn) : undefined;
    
    const newErrors: typeof errors = {
      fullName: fullNameError,
      email: emailError,
      whatsapp: whatsappError,
      linkedIn: linkedInError,
    };
    
    // Check if LinkedIn or Resume is provided
    if (!hasLinkedIn && !hasResume) {
      newErrors.linkedIn = t("registration.errors.resumeRequired");
    }
    
    // Verify CAPTCHA
    if (RECAPTCHA_SITE_KEY && !captchaToken) {
      newErrors.captcha = t("registration.errors.captchaRequired");
    }
    
    setErrors(newErrors);
    
    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== undefined)) {
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors).find(key => newErrors[key as keyof typeof newErrors]);
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element && typeof element.scrollIntoView === 'function') {
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
      let resumePath: string | null = null;
      let resumeUploadFailed = false;

      // Upload resume if provided
      if (resume) {
        try {
          // Sanitize original filename
          const sanitizedOriginalName = sanitizeFileName(resume.name);
          const fileExt = sanitizedOriginalName.split('.').pop() || 'pdf';
          
          // Generate secure filename with timestamp and random string
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          // Double-check file is still valid before upload
          if (!isValidPdfExtension(fileName) || !isValidPdfMimeType(resume.type)) {
            throw new Error('Invalid file type');
          }
        
        const { error: uploadError } = await supabase.storage
          .from('resumes')
            .upload(fileName, resume);

        if (uploadError) {
            // Log error details only in development, not in production
            if (import.meta.env.DEV) {
          console.error('Upload error:', uploadError);
            }
            resumeUploadFailed = true;
            toast.error(t("registration.errors.failed"));
          } else {
            resumePath = fileName;
          }
        } catch (uploadErr) {
          // Log error details only in development
          if (import.meta.env.DEV) {
            console.error('Resume upload exception:', uploadErr);
          }
          resumeUploadFailed = true;
          toast.error('Resume upload failed, but registration will continue');
        }
      }

      // Validate and sanitize LinkedIn URL
      const linkedInUrl = linkedIn ? validateAndSanitizeUrl(linkedIn) : null;
        if (linkedIn && !linkedInUrl) {
        toast.error(t("registration.errors.linkedinInvalid"));
        setIsSubmitting(false);
        return;
      }

      // Normalize WhatsApp number if provided
      const whatsappNumber = whatsapp ? normalizeWhatsAppNumber(whatsapp) : null;

      // Check if registration should go to waitlist
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: shouldWaitlist, error: waitlistCheckError } = await (supabase.rpc as any)('should_add_to_waitlist');

      if (waitlistCheckError) {
        // Log error but continue with registration attempt
        if (import.meta.env.DEV) {
          console.error('Waitlist check error:', waitlistCheckError);
        }
      }

      const isWaitlist = shouldWaitlist === true;

      // Generate access token for registration management
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: accessToken } = await (supabase.rpc as any)('generate_access_token');

      // Insert registration into database (always attempt, even if resume upload failed)
      const registrationData = {
        full_name: fullName,
        email: email,
        whatsapp_number: whatsappNumber,
        linkedin_url: linkedInUrl,
        resume_path: resumePath,
        is_waitlist: isWaitlist,
        access_token: accessToken || null,
        status: 'active',
      };

      // Try to use Edge Function for IP capture if available, otherwise use direct insert
      const USE_EDGE_FUNCTION = import.meta.env.VITE_USE_REGISTRATION_EDGE_FUNCTION === 'true';
      
      let insertError: { message?: string; code?: string } | null = null;
      let registrationId: string | null = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let functionData: any = null;
      
      if (USE_EDGE_FUNCTION) {
        // Use Edge Function to capture IP address
        const response = await supabase.functions.invoke(
          'register-with-ip',
          {
            body: registrationData,
          }
        );

        functionData = response.data;
        if (response.error) {
          insertError = response.error;
        } else if (functionData?.error) {
          // Handle Edge Function error response
          if (functionData.code === 'RATE_LIMIT_EXCEEDED') {
            throw new Error(functionData.error || t("registration.errors.rateLimit", { time: "" }));
          }
          if (functionData.code === 'DUPLICATE_EMAIL') {
            throw new Error(functionData.error || t("registration.errors.duplicateEmail"));
          }
          throw new Error(functionData.error || t("registration.errors.failed"));
        } else if (functionData?.data?.id) {
          registrationId = functionData.data.id;
        }
      } else {
        // Direct database insert (IP will be NULL, but email-based rate limiting still applies)
        const { data: insertedData, error: dbError } = await supabase
          .from('registrations')
          .insert(registrationData)
          .select('id')
          .single();

        insertError = dbError;
        if (insertedData?.id) {
          registrationId = insertedData.id;
        }
      }

      if (insertError) {
        // Log error details only in development
        if (import.meta.env.DEV) {
        console.error('Insert error:', insertError);
        }
        
        // Check for rate limit violation (custom error code or message)
        if (insertError.message?.includes('rate limit') || insertError.message?.includes('too many')) {
          throw new Error(t("registration.errors.rateLimit", { time: "" }));
        }
        
        if (insertError.code === '23505') {
          throw new Error(t("registration.errors.duplicateEmail"));
        }
        
        // Check if RLS policy blocked due to rate limit
        // Note: RLS policy violations typically return generic errors
        // The rate limit check happens at the database level via the policy
        if (insertError.message?.includes('policy') || insertError.message?.includes('permission')) {
          // Likely rate limited by RLS policy (email or IP)
          throw new Error(t("registration.errors.rateLimit", { time: "" }));
        }
        
        throw new Error(t("registration.errors.failed"));
      }

      // Success - record submission and navigate to thank you page
      recordSubmission();
      trackRegistration(true);
      
      // Mark incomplete registration as completed if it exists
      hasCompletedRef.current = true;
      if (email || whatsappNumber) {
        markIncompleteRegistrationCompleted(email, whatsappNumber).catch(() => {
          // Silently fail - non-critical
        });
      }
      
      // Get waitlist position if on waitlist
      let waitlistPosition: number | null = null;
      if (isWaitlist) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: position } = await (supabase.rpc as any)('get_waitlist_position', { p_email: email } as any);
        waitlistPosition = position || null;
      }
      
      const successMessage = isWaitlist 
        ? t("registration.waitlistSuccess")
        : t("registration.success");
      toast.success(successMessage);
      setLiveMessage(successMessage);
      
      // Reset form state
      setFormData({ fullName: "", email: "", whatsapp: "", linkedIn: "", resume: null });
      setHasLinkedIn(false);
      setHasResume(false);
      setCaptchaToken(null);
      setErrors({});
      setTouched({});
      
      // Reset file input and CAPTCHA
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      recaptchaRef.current?.reset();

      // Navigate to thank you page with email, waitlist, token, registration ID, and full name parameters
      const params = new URLSearchParams();
      if (email) params.set('email', email);
      if (fullName) params.set('name', fullName);
      if (isWaitlist) params.set('waitlist', 'true');
      if (waitlistPosition !== null) params.set('position', waitlistPosition.toString());
      if (accessToken) params.set('token', accessToken);
      if (registrationId) params.set('id', registrationId);
      const queryString = params.toString();
      const emailParam = queryString ? `?${queryString}` : '';
      setTimeout(() => {
        navigate(`/thank-you${emailParam}`);
      }, 1000); // Small delay to show success toast
    } catch (error) {
      // Log error details only in development
      if (import.meta.env.DEV) {
      console.error('Registration error:', error);
      }
      const errorMessage = error instanceof Error ? error.message : t("registration.errors.failed");
      trackRegistration(false, errorMessage);
      toast.error(errorMessage);
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
                    errors.fullName && "border-destructive focus:border-destructive animate-error-flash",
                    touched.fullName && !errors.fullName && formData.fullName && "border-primary"
                  )}
                required
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                />
                {touched.fullName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.fullName ? (
                      <XCircle className="w-5 h-5 text-destructive animate-bounce-in" aria-hidden="true" />
                    ) : formData.fullName ? (
                      <CheckCircle 
                        className="w-5 h-5 text-primary animate-success-pulse" 
                        aria-hidden="true"
                        id="fullName-success"
                        aria-label={t("aria.fullNameValid")}
                      />
                    ) : null}
                  </div>
                )}
              </div>
              {errors.fullName && (
                <p id="fullName-error" className="text-sm text-destructive flex items-center gap-1.5 animate-slide-in-right" role="alert" aria-live="polite">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 animate-bounce-in" aria-hidden="true" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className={cn(errors.email && "text-destructive")}>
                {t("registration.email")} <span className="sr-only">required</span>
                <span aria-hidden="true">*</span>
              </Label>
              <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="john@example.com"
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
                  aria-describedby={errors.email ? "email-error" : touched.email && !errors.email && formData.email ? "email-success" : undefined}
                  aria-required="true"
                />
                {touched.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.email ? (
                      <XCircle className="w-5 h-5 text-destructive animate-bounce-in" aria-hidden="true" />
                    ) : formData.email ? (
                      <CheckCircle 
                        className="w-5 h-5 text-primary animate-success-pulse" 
                        aria-hidden="true"
                        id="email-success"
                        aria-label={t("aria.emailValid")}
                      />
                    ) : null}
                  </div>
                )}
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive flex items-center gap-1.5 animate-slide-in-right" role="alert" aria-live="polite">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 animate-bounce-in" aria-hidden="true" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className={cn("flex items-center gap-2", errors.whatsapp && "text-destructive")}>
                <MessageCircle className="w-4 h-4" />
                {t("registration.whatsapp")}
              </Label>
              <div className="relative">
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+254 712345678 or 0712345678"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={cn(
                    "bg-muted border-border focus:border-primary pr-10 transition-all duration-300",
                    errors.whatsapp && "border-destructive focus:border-destructive animate-error-flash",
                    touched.whatsapp && !errors.whatsapp && formData.whatsapp && "border-primary"
                  )}
                  aria-invalid={!!errors.whatsapp}
                  aria-describedby={errors.whatsapp ? "whatsapp-error" : touched.whatsapp && !errors.whatsapp && formData.whatsapp ? "whatsapp-success" : undefined}
                />
                {touched.whatsapp && formData.whatsapp && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.whatsapp ? (
                      <XCircle className="w-5 h-5 text-destructive animate-bounce-in" aria-hidden="true" />
                    ) : (
                      <CheckCircle 
                        className="w-5 h-5 text-primary animate-success-pulse" 
                        aria-hidden="true"
                        id="whatsapp-success"
                        aria-label={t("aria.whatsappValid")}
                      />
                    )}
                  </div>
                )}
              </div>
              {errors.whatsapp && (
                <p id="whatsapp-error" className="text-sm text-destructive flex items-center gap-1.5 animate-slide-in-right" role="alert" aria-live="polite">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 animate-bounce-in" aria-hidden="true" />
                  <span>{errors.whatsapp}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("registration.optionalWhatsApp")}
              </p>
            </div>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center items-center gap-2">
                <span className="bg-card px-4 text-sm text-muted-foreground flex items-center gap-2">
                  {t("registration.provideAtLeastOne")} *
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-label={t("registration.whyCollect")}
                      >
                        <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">
                        {t("registration.whyCollect")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </span>
              </div>
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedIn" className={cn("flex items-center gap-2", errors.linkedIn && "text-destructive")}>
                <Linkedin className="w-4 h-4" aria-hidden="true" />
                {t("registration.linkedin")}
                {hasLinkedIn && !errors.linkedIn && (
                  <CheckCircle 
                    className="w-4 h-4 text-primary animate-success-pulse" 
                    aria-label={t("aria.linkedinValid")}
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
                    errors.linkedIn && "border-destructive focus:border-destructive animate-error-flash",
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
                <p id="linkedIn-error" className="text-sm text-destructive flex items-center gap-1.5" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.linkedIn}</span>
                </p>
              )}
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <Label htmlFor="resume" className={cn("flex items-center gap-2", errors.resume && "text-destructive")}>
                <Upload className="w-4 h-4" aria-hidden="true" />
                {t("registration.resume")}
                {hasResume && !errors.resume && (
                  <CheckCircle 
                    className="w-4 h-4 text-primary animate-success-pulse" 
                    aria-label={t("aria.resumeSelected")}
                    aria-hidden="false"
                  />
                )}
              </Label>
              <div className="relative">
                <Input
                  ref={fileInputRef}
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className={cn(
                    "bg-muted border-border focus:border-primary file:bg-primary file:text-primary-foreground file:border-0 file:rounded file:px-4 file:py-1 file:mr-4 file:font-medium file:cursor-pointer transition-all duration-300",
                    errors.resume && "border-destructive focus:border-destructive animate-error-flash",
                    hasResume && !errors.resume && "border-primary"
                  )}
                  aria-invalid={!!errors.resume}
                  aria-describedby={errors.resume ? "resume-error" : formData.resume && !errors.resume ? "resume-success" : undefined}
                />
              </div>
              {formData.resume && !errors.resume && (
                <p 
                  id="resume-success"
                  className="text-sm text-muted-foreground flex items-center gap-1.5 animate-slide-in-right"
                  aria-live="polite"
                >
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 animate-success-pulse" aria-hidden="true" />
                  <span>Selected: {sanitizeFileName(formData.resume.name)}</span>
                </p>
              )}
              {errors.resume && (
                <p id="resume-error" className="text-sm text-destructive flex items-center gap-1.5 animate-slide-in-right" role="alert" aria-live="polite">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 animate-bounce-in" aria-hidden="true" />
                  <span>{errors.resume}</span>
                </p>
              )}
            </div>

            {/* CAPTCHA */}
            {RECAPTCHA_SITE_KEY && (
              <div className="space-y-2">
                <div className="flex justify-center overflow-x-auto pb-2">
                  <div className="scale-90 sm:scale-100">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={RECAPTCHA_SITE_KEY}
                      onChange={(token) => {
                        if (token) {
                          setCaptchaToken(token);
                          setErrors((prev) => ({ ...prev, captcha: undefined }));
                        }
                      }}
                      onExpired={() => {
                        setCaptchaToken(null);
                        setErrors((prev) => ({ ...prev, captcha: t("registration.errors.captchaFailed") }));
                      }}
                      onError={(error) => {
                        setCaptchaToken(null);
                        console.error("reCAPTCHA error:", error);
                        // Check for specific error types
                        if (error?.toString().includes("Invalid key type")) {
                          setErrors((prev) => ({ ...prev, captcha: t("registration.errors.captchaFailed") }));
                        } else {
                          setErrors((prev) => ({ ...prev, captcha: t("registration.errors.captchaFailed") }));
                        }
                      }}
                      theme="dark"
                      size="normal"
                    />
                  </div>
                </div>
                {errors.captcha && (
                  <p 
                    id="captcha-error"
                    className="text-sm text-destructive flex items-center justify-center gap-1.5 animate-slide-in-right" 
                    role="alert" 
                    aria-live="polite"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 animate-bounce-in" aria-hidden="true" />
                    <span>{errors.captcha}</span>
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full relative overflow-hidden"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                </span>
              )}
              <span className={cn("transition-opacity duration-300", isSubmitting && "opacity-0")}>
                {isSubmitting ? t("registration.submitting") : t("registration.submit")}
              </span>
            </Button>

            <p className="text-xs sm:text-sm text-muted-foreground text-center px-2" role="note">
              {t("registration.terms")}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Registration;

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Linkedin, CheckCircle, AlertCircle, XCircle, MessageCircle } from "lucide-react";
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

const Registration = () => {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "fullName":
        if (!value.trim()) {
          return "Full name is required";
        }
        if (!isValidFullName(value.trim())) {
          return "Please enter a valid full name (2-100 characters, letters and spaces only)";
        }
        return undefined;
      case "email":
        if (!value.trim()) {
          return "Email address is required";
        }
        if (!isValidEmail(value.trim())) {
          return "Please enter a valid email address";
        }
        return undefined;
      case "whatsapp":
        if (value.trim() && !isValidWhatsAppNumber(value.trim())) {
          return "Please enter a valid WhatsApp number (e.g., +254712345678 or 0712345678)";
        }
        return undefined;
      case "linkedIn":
        if (value.trim() && !validateAndSanitizeUrl(value.trim())) {
          return "Please enter a valid LinkedIn URL (e.g., linkedin.com/in/yourprofile)";
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
        setErrors((prev) => ({ ...prev, resume: "File size must be less than 5MB" }));
        e.target.value = ''; // Reset input
        setFormData((prev) => ({ ...prev, resume: null }));
        setHasResume(false);
        return;
      }

      // Validate file extension (more secure check)
      if (!isValidPdfExtension(file.name)) {
        setErrors((prev) => ({ ...prev, resume: "Please upload a PDF file (.pdf extension required)" }));
        e.target.value = ''; // Reset input
        setFormData((prev) => ({ ...prev, resume: null }));
        setHasResume(false);
        return;
      }

      // Validate MIME type (additional security layer)
      if (!isValidPdfMimeType(file.type)) {
        setErrors((prev) => ({ ...prev, resume: "Invalid file type. Please upload a PDF file." }));
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
      newErrors.linkedIn = "Please provide either your LinkedIn profile or upload your resume";
    }
    
    // Verify CAPTCHA
    if (RECAPTCHA_SITE_KEY && !captchaToken) {
      newErrors.captcha = "Please complete the CAPTCHA verification";
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
        ? `Rate limit exceeded. Please try again in ${formatRetryAfter(rateLimitCheck.retryAfter)}.`
        : "Rate limit exceeded. Please try again later.";
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
            toast.error('Resume upload failed, but registration will continue');
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
        toast.error("Please enter a valid LinkedIn URL");
        setIsSubmitting(false);
        return;
      }

      // Normalize WhatsApp number if provided
      const whatsappNumber = whatsapp ? normalizeWhatsAppNumber(whatsapp) : null;

      // Insert registration into database (always attempt, even if resume upload failed)
      const registrationData = {
        full_name: fullName,
        email: email,
        whatsapp_number: whatsappNumber,
        linkedin_url: linkedInUrl,
          resume_path: resumePath,
      };

      // Try to use Edge Function for IP capture if available, otherwise use direct insert
      const USE_EDGE_FUNCTION = import.meta.env.VITE_USE_REGISTRATION_EDGE_FUNCTION === 'true';
      
      let insertError: { message?: string; code?: string } | null = null;
      
      if (USE_EDGE_FUNCTION) {
        // Use Edge Function to capture IP address
        const { data: functionData, error: functionError } = await supabase.functions.invoke(
          'register-with-ip',
          {
            body: registrationData,
          }
        );

        if (functionError) {
          insertError = functionError;
        } else if (functionData?.error) {
          // Handle Edge Function error response
          if (functionData.code === 'RATE_LIMIT_EXCEEDED') {
            throw new Error(functionData.error || 'Rate limit exceeded. Maximum 3 registrations per email or 5 per IP per hour.');
          }
          if (functionData.code === 'DUPLICATE_EMAIL') {
            throw new Error(functionData.error || 'This email is already registered');
          }
          throw new Error(functionData.error || 'Failed to submit registration');
        }
      } else {
        // Direct database insert (IP will be NULL, but email-based rate limiting still applies)
        const { error: dbError } = await supabase
          .from('registrations')
          .insert(registrationData);

        insertError = dbError;
      }

      if (insertError) {
        // Log error details only in development
        if (import.meta.env.DEV) {
        console.error('Insert error:', insertError);
        }
        
        // Check for rate limit violation (custom error code or message)
        if (insertError.message?.includes('rate limit') || insertError.message?.includes('too many')) {
          throw new Error('Rate limit exceeded. Maximum 3 registrations per email or 5 per IP per hour. Please try again later.');
        }
        
        if (insertError.code === '23505') {
          throw new Error('This email is already registered');
        }
        
        // Check if RLS policy blocked due to rate limit
        // Note: RLS policy violations typically return generic errors
        // The rate limit check happens at the database level via the policy
        if (insertError.message?.includes('policy') || insertError.message?.includes('permission')) {
          // Likely rate limited by RLS policy (email or IP)
          throw new Error('Rate limit exceeded. Maximum 3 registrations per email or 5 per IP per hour. Please try again later.');
        }
        
        throw new Error('Failed to submit registration');
      }

      // Success - record submission and reset form
      recordSubmission();
      toast.success("Registration successful! We'll be in touch soon.");
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
    } catch (error) {
      // Log error details only in development
      if (import.meta.env.DEV) {
      console.error('Registration error:', error);
      }
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
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
              <span className="text-gradient">Register</span> Now
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg px-4">
              Secure your spot at JengaHacks 2026. Limited to 200 participants.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 bg-card p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-border">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className={cn(errors.fullName && "text-destructive")}>
                Full Name *
              </Label>
              <div className="relative">
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={cn(
                    "bg-muted border-border focus:border-primary pr-10",
                    errors.fullName && "border-destructive focus:border-destructive",
                    touched.fullName && !errors.fullName && formData.fullName && "border-primary"
                  )}
                required
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                />
                {touched.fullName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.fullName ? (
                      <XCircle className="w-5 h-5 text-destructive" aria-hidden="true" />
                    ) : formData.fullName ? (
                      <CheckCircle className="w-5 h-5 text-primary" aria-hidden="true" />
                    ) : null}
                  </div>
                )}
              </div>
              {errors.fullName && (
                <p id="fullName-error" className="text-sm text-destructive flex items-center gap-1.5" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className={cn(errors.email && "text-destructive")}>
                Email Address *
              </Label>
              <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={cn(
                    "bg-muted border-border focus:border-primary pr-10",
                    errors.email && "border-destructive focus:border-destructive",
                    touched.email && !errors.email && formData.email && "border-primary"
                  )}
                required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {touched.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.email ? (
                      <XCircle className="w-5 h-5 text-destructive" aria-hidden="true" />
                    ) : formData.email ? (
                      <CheckCircle className="w-5 h-5 text-primary" aria-hidden="true" />
                    ) : null}
                  </div>
                )}
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive flex items-center gap-1.5" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className={cn("flex items-center gap-2", errors.whatsapp && "text-destructive")}>
                <MessageCircle className="w-4 h-4" />
                WhatsApp Number
              </Label>
              <div className="relative">
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  placeholder="+254712345678 or 0712345678"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={cn(
                    "bg-muted border-border focus:border-primary pr-10",
                    errors.whatsapp && "border-destructive focus:border-destructive",
                    touched.whatsapp && !errors.whatsapp && formData.whatsapp && "border-primary"
                  )}
                  aria-invalid={!!errors.whatsapp}
                  aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
                />
                {touched.whatsapp && formData.whatsapp && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.whatsapp ? (
                      <XCircle className="w-5 h-5 text-destructive" aria-hidden="true" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-primary" aria-hidden="true" />
                    )}
                  </div>
                )}
              </div>
              {errors.whatsapp && (
                <p id="whatsapp-error" className="text-sm text-destructive flex items-center gap-1.5" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.whatsapp}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Optional - We'll use this to contact you about the event
              </p>
            </div>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-sm text-muted-foreground">
                  Provide at least one *
                </span>
              </div>
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedIn" className={cn("flex items-center gap-2", errors.linkedIn && "text-destructive")}>
                <Linkedin className="w-4 h-4" />
                LinkedIn Profile
                {hasLinkedIn && !errors.linkedIn && <CheckCircle className="w-4 h-4 text-primary" />}
              </Label>
              <div className="relative">
              <Input
                id="linkedIn"
                name="linkedIn"
                type="text"
                placeholder="linkedin.com/in/yourprofile"
                value={formData.linkedIn}
                onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={cn(
                    "bg-muted border-border focus:border-primary pr-10",
                    errors.linkedIn && "border-destructive focus:border-destructive",
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
                <Upload className="w-4 h-4" />
                Resume (PDF)
                {hasResume && !errors.resume && <CheckCircle className="w-4 h-4 text-primary" />}
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
                    "bg-muted border-border focus:border-primary file:bg-primary file:text-primary-foreground file:border-0 file:rounded file:px-4 file:py-1 file:mr-4 file:font-medium file:cursor-pointer",
                    errors.resume && "border-destructive focus:border-destructive",
                    hasResume && !errors.resume && "border-primary"
                  )}
                  aria-invalid={!!errors.resume}
                  aria-describedby={errors.resume ? "resume-error" : undefined}
                />
              </div>
              {formData.resume && !errors.resume && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Selected: {sanitizeFileName(formData.resume.name)}</span>
                </p>
              )}
              {errors.resume && (
                <p id="resume-error" className="text-sm text-destructive flex items-center gap-1.5" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                        setErrors((prev) => ({ ...prev, captcha: "CAPTCHA expired. Please verify again." }));
                      }}
                      onError={(error) => {
                        setCaptchaToken(null);
                        console.error("reCAPTCHA error:", error);
                        // Check for specific error types
                        if (error?.toString().includes("Invalid key type")) {
                          setErrors((prev) => ({ ...prev, captcha: "CAPTCHA configuration error. Please contact support." }));
                        } else {
                          setErrors((prev) => ({ ...prev, captcha: "CAPTCHA verification failed. Please refresh the page and try again." }));
                        }
                      }}
                      theme="dark"
                      size="normal"
                    />
                  </div>
                </div>
                {errors.captcha && (
                  <p className="text-sm text-destructive flex items-center justify-center gap-1.5" role="alert">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Complete Registration"}
            </Button>

            <p className="text-xs sm:text-sm text-muted-foreground text-center px-2">
              By registering, you agree to our terms and conditions. 
              We'll never share your information without consent.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Registration;

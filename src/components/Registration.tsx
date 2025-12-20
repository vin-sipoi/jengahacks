import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Linkedin, CheckCircle } from "lucide-react";
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
} from "@/lib/security";
import { checkRateLimit, formatRetryAfter, recordSubmission } from "@/lib/rateLimit";

const Registration = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    linkedIn: "",
    resume: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLinkedIn, setHasLinkedIn] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "linkedIn" && value.trim()) {
      setHasLinkedIn(true);
    } else if (name === "linkedIn") {
      setHasLinkedIn(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size first (most common issue)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        e.target.value = ''; // Reset input
        return;
      }

      // Validate file extension (more secure check)
      if (!isValidPdfExtension(file.name)) {
        toast.error("Please upload a PDF file (.pdf extension required)");
        e.target.value = ''; // Reset input
        return;
      }

      // Validate MIME type (additional security layer)
      if (!isValidPdfMimeType(file.type)) {
        toast.error("Invalid file type. Please upload a PDF file.");
        e.target.value = ''; // Reset input
        return;
      }

      // Additional validation: check file signature if possible
      // Note: Full file signature validation would require reading file bytes
      // For now, we rely on extension and MIME type validation

      setFormData((prev) => ({ ...prev, resume: file }));
      setHasResume(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Capture and sanitize form data before async operations
    const fullName = sanitizeInput(formData.fullName.trim(), 100);
    const email = formData.email.trim().toLowerCase();
    const linkedIn = formData.linkedIn.trim();
    const resume = formData.resume;
    
    // Validation
    if (!fullName || !isValidFullName(fullName)) {
      toast.error("Please enter a valid full name (2-100 characters, letters and spaces only)");
      return;
    }
    if (!email || !isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!hasLinkedIn && !hasResume) {
      toast.error("Please provide either your LinkedIn profile or upload your resume");
      return;
    }

    // Verify CAPTCHA
    if (!RECAPTCHA_SITE_KEY) {
      // If CAPTCHA is not configured, log warning but allow submission in development
      if (import.meta.env.DEV) {
        console.warn("reCAPTCHA site key not configured. Skipping CAPTCHA verification.");
      }
    } else if (!captchaToken) {
      toast.error("Please complete the CAPTCHA verification");
      recaptchaRef.current?.reset();
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

      // Insert registration into database (always attempt, even if resume upload failed)
      const registrationData = {
        full_name: fullName,
        email: email,
        linkedin_url: linkedInUrl,
        resume_path: resumePath,
      };

      // Removed console.log to prevent information disclosure

      const { error: insertError } = await supabase
        .from('registrations')
        .insert(registrationData);

      if (insertError) {
        // Log error details only in development
        if (import.meta.env.DEV) {
          console.error('Insert error:', insertError);
        }
        
        // Check for rate limit violation (custom error code or message)
        if (insertError.message?.includes('rate limit') || insertError.message?.includes('too many')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        if (insertError.code === '23505') {
          throw new Error('This email is already registered');
        }
        
        // Check if RLS policy blocked due to rate limit
        // Note: RLS policy violations typically return generic errors
        // The rate limit check happens at the database level via the policy
        if (insertError.message?.includes('policy') || insertError.message?.includes('permission')) {
          // Likely rate limited by RLS policy
          throw new Error('Rate limit exceeded. Maximum 3 registrations per hour allowed. Please try again later.');
        }
        
        throw new Error('Failed to submit registration');
      }

      // Success - record submission and reset form
      recordSubmission();
      toast.success("Registration successful! We'll be in touch soon.");
      setFormData({ fullName: "", email: "", linkedIn: "", resume: null });
      setHasLinkedIn(false);
      setHasResume(false);
      setCaptchaToken(null);
      
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
    <section id="register" className="pt-12 pb-24 relative">
      <div className="absolute inset-0 circuit-pattern opacity-10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gradient">Register</span> Now
            </h2>
            <p className="text-muted-foreground text-lg">
              Secure your spot at JengaHacks 2026. Limited to 200 participants.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl border border-border">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleInputChange}
                className="bg-muted border-border focus:border-primary"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-muted border-border focus:border-primary"
                required
              />
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
              <Label htmlFor="linkedIn" className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn Profile
                {hasLinkedIn && <CheckCircle className="w-4 h-4 text-primary" />}
              </Label>
              <Input
                id="linkedIn"
                name="linkedIn"
                type="text"
                placeholder="linkedin.com/in/yourprofile"
                value={formData.linkedIn}
                onChange={handleInputChange}
                className="bg-muted border-border focus:border-primary"
              />
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <Label htmlFor="resume" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Resume (PDF)
                {hasResume && <CheckCircle className="w-4 h-4 text-primary" />}
              </Label>
              <div className="relative">
                <Input
                  ref={fileInputRef}
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="bg-muted border-border focus:border-primary file:bg-primary file:text-primary-foreground file:border-0 file:rounded file:px-4 file:py-1 file:mr-4 file:font-medium file:cursor-pointer"
                />
              </div>
              {formData.resume && (
                <p className="text-sm text-muted-foreground">
                  Selected: {sanitizeFileName(formData.resume.name)}
                </p>
              )}
            </div>

            {/* CAPTCHA */}
            {RECAPTCHA_SITE_KEY && (
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                  onError={() => {
                    setCaptchaToken(null);
                    toast.error("CAPTCHA verification failed. Please try again.");
                  }}
                  theme="dark"
                />
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

            <p className="text-xs text-muted-foreground text-center">
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

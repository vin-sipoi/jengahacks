import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Linkedin, Save, X, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  sanitizeFileName,
  validateAndSanitizeUrl,
  normalizeWhatsAppNumber,
} from "@/lib/security";
import { validateFile, validateField } from "@/lib/validation";
import { useTranslation } from "@/hooks/useTranslation";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import RegistrationQRCode from "@/components/RegistrationQRCode";
import { logger } from "@/lib/logger";
import { DEBOUNCE_DELAY_MS } from "@/lib/constants";
import { callRpc } from "@/lib/supabaseRpc";

interface RegistrationData {
  id: string;
  full_name: string;
  email: string;
  whatsapp_number: string | null;
  linkedin_url: string | null;
  resume_path: string | null;
  is_waitlist: boolean;
  status: string;
  created_at: string;
}

const ManageRegistration = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    whatsapp: "",
    linkedIn: "",
    resume: null as File | null,
  });
  
  const [errors, setErrors] = useState<{
    fullName?: string;
    whatsapp?: string;
    linkedIn?: string;
    resume?: string;
  }>({});

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load registration data
  useEffect(() => {
    const loadRegistration = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await callRpc('get_registration_by_token', { p_token: token });

        if (error) {
          logger.error('Error loading registration', error, { token });
          toast.error(t("manageRegistration.errors.loadFailed"));
          setIsLoading(false);
          return;
        }

        if (!data || !Array.isArray(data) || data.length === 0) {
          toast.error(t("manageRegistration.errors.notFound"));
          setIsLoading(false);
          return;
        }

        const reg = data[0];
        setRegistration(reg);
        setFormData({
          fullName: reg.full_name,
          whatsapp: reg.whatsapp_number || "",
          linkedIn: reg.linkedin_url || "",
          resume: null,
        });
      } catch (error) {
        logger.error('Error loading registration', error instanceof Error ? error : new Error(String(error)), { token });
        toast.error(t("manageRegistration.errors.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    loadRegistration();
  }, [token, t]);

  const validateFieldRef = (name: string, value: string): string | undefined => {
    return validateField(name, value, t);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      // If we have translations for these specific errors, use them
      const errorMsg = validationError.includes("PDF") 
        ? t("registration.errors.resumeType") 
        : t("registration.errors.resumeSize");
      
      setErrors((prev) => ({ ...prev, resume: errorMsg }));
      setFormData((prev) => ({ ...prev, resume: null }));
      return;
    }
  };

  const handleUpdate = async () => {
    if (!token || !registration) return;

    // Validate form
    const newErrors: typeof errors = {};
    newErrors.fullName = validateFieldRef("fullName", formData.fullName);
    newErrors.whatsapp = validateFieldRef("whatsapp", formData.whatsapp);
    newErrors.linkedIn = validateFieldRef("linkedIn", formData.linkedIn);

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error !== undefined)) {
      toast.error(t("manageRegistration.errors.validationFailed"));
      return;
    }

    setIsUpdating(true);

    try {
      let resumePath: string | null = registration.resume_path;

      // Upload new resume if provided
      if (formData.resume) {
        try {
          const sanitizedOriginalName = sanitizeFileName(formData.resume.name);
          const fileExt = sanitizedOriginalName.split('.').pop() || 'pdf';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          if (validateFile(formData.resume)) {
            throw new Error('Invalid file type');
          }

          // Delete old resume if exists
          if (registration.resume_path) {
            await supabase.storage
              .from('resumes')
              .remove([registration.resume_path]);
          }

          const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(fileName, formData.resume);

          if (uploadError) {
            throw uploadError;
          }

          resumePath = fileName;
        } catch (uploadErr) {
          logger.error('Resume upload error', uploadErr instanceof Error ? uploadErr : new Error(String(uploadErr)), { token });
          toast.error(t("manageRegistration.errors.resumeUploadFailed"));
          setIsUpdating(false);
          return;
        }
      }

      // Normalize WhatsApp number
      const whatsappNumber = formData.whatsapp ? normalizeWhatsAppNumber(formData.whatsapp) : null;

      // Validate and sanitize LinkedIn URL
      const linkedInUrl = formData.linkedIn ? validateAndSanitizeUrl(formData.linkedIn) : null;
      if (formData.linkedIn && !linkedInUrl) {
        toast.error(t("registration.errors.linkedinInvalid"));
        setIsUpdating(false);
        return;
      }

      // Update registration
      const { error: updateError } = await callRpc('update_registration_by_token', {
        p_token: token,
        p_full_name: formData.fullName.trim(),
        p_whatsapp_number: whatsappNumber,
        p_linkedin_url: linkedInUrl,
        p_resume_path: resumePath,
      });

      if (updateError) {
        logger.error('Update error', updateError instanceof Error ? updateError : new Error(String(updateError)), { token });
        toast.error(t("manageRegistration.errors.updateFailed"));
        setIsUpdating(false);
        return;
      }

      toast.success(t("manageRegistration.success.updated"));
      
      // Reload registration data
      const { data } = await callRpc('get_registration_by_token', { p_token: token });
      if (data && Array.isArray(data) && data.length > 0) {
        const reg = data[0];
        setRegistration(reg);
        setFormData((prev) => ({ ...prev, resume: null }));
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      logger.error('Update error', error instanceof Error ? error : new Error(String(error)), { token });
      toast.error(t("manageRegistration.errors.updateFailed"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!token || !registration) return;

    const confirmed = window.confirm(t("manageRegistration.cancel.confirm"));
    if (!confirmed) return;

    setIsCancelling(true);

    try {
      const { error: cancelError } = await callRpc('cancel_registration_by_token', { p_token: token });

      if (cancelError) {
        logger.error('Cancel error', cancelError instanceof Error ? cancelError : new Error(String(cancelError)), { token });
        toast.error(t("manageRegistration.errors.cancelFailed"));
        setIsCancelling(false);
        return;
      }

      toast.success(t("manageRegistration.success.cancelled"));
      setTimeout(() => {
        navigate("/");
      }, DEBOUNCE_DELAY_MS);
    } catch (error) {
      logger.error('Cancel error', error instanceof Error ? error : new Error(String(error)), { token });
      toast.error(t("manageRegistration.errors.cancelFailed"));
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <SEO title={t("manageRegistration.title")} />
        <Navbar />
        <div className="min-h-screen bg-background pt-20 pb-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!token || !registration) {
    return (
      <>
        <SEO title={t("manageRegistration.title")} />
        <Navbar />
        <div className="min-h-screen bg-background pt-20 pb-16">
          <div className="container mx-auto px-4 sm:px-6">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  {t("manageRegistration.errors.notFound")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {t("manageRegistration.errors.invalidToken")}
                </p>
                <Button asChild>
                  <Link to="/">{t("common.backToHome")}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEO title={t("manageRegistration.title")} />
      <Navbar />
      <div className="min-h-screen bg-background pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up" delay={0}>
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                  <Link to="/" className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    {t("common.backToHome")}
                  </Link>
                </Button>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  {t("manageRegistration.title")}
                </h1>
                <p className="text-muted-foreground">
                  {t("manageRegistration.subtitle")}
                </p>
                {registration.is_waitlist && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      {t("manageRegistration.waitlistNotice")}
                    </p>
                  </div>
                )}
              </div>

              {/* QR Code */}
              {registration && (
                <div className="mb-6">
                  <RegistrationQRCode
                    registrationId={registration.id}
                    email={registration.email}
                    fullName={registration.full_name}
                    token={token}
                  />
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>{t("manageRegistration.formTitle")}</CardTitle>
                  <CardDescription>{t("manageRegistration.formDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      {t("registration.fullName")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={errors.fullName ? "border-destructive" : ""}
                      aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? "fullName-error" : undefined}
                    />
                    {errors.fullName && (
                      <p id="fullName-error" className="text-sm text-destructive" role="alert">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("registration.email")}</Label>
                    <Input
                      id="email"
                      value={registration.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("manageRegistration.emailReadOnly")}
                    </p>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">
                      {t("registration.whatsapp")} <span className="text-muted-foreground">({t("registration.optional")})</span>
                    </Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      placeholder="+254712345678"
                      className={errors.whatsapp ? "border-destructive" : ""}
                      aria-invalid={!!errors.whatsapp}
                      aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
                    />
                    {errors.whatsapp && (
                      <p id="whatsapp-error" className="text-sm text-destructive" role="alert">
                        {errors.whatsapp}
                      </p>
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-2">
                    <Label htmlFor="linkedIn">
                      {t("registration.linkedin")} <span className="text-muted-foreground">({t("registration.optional")})</span>
                    </Label>
                    <Input
                      id="linkedIn"
                      name="linkedIn"
                      value={formData.linkedIn}
                      onChange={handleInputChange}
                      placeholder="linkedin.com/in/yourprofile"
                      className={errors.linkedIn ? "border-destructive" : ""}
                      aria-invalid={!!errors.linkedIn}
                      aria-describedby={errors.linkedIn ? "linkedIn-error" : undefined}
                    />
                    {errors.linkedIn && (
                      <p id="linkedIn-error" className="text-sm text-destructive" role="alert">
                        {errors.linkedIn}
                      </p>
                    )}
                  </div>

                  {/* Resume */}
                  <div className="space-y-2">
                    <Label htmlFor="resume">
                      {t("registration.resume")} <span className="text-muted-foreground">({t("registration.optional")})</span>
                    </Label>
                    {registration.resume_path && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("manageRegistration.currentResume")}: {registration.resume_path}
                      </p>
                    )}
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className={errors.resume ? "border-destructive" : ""}
                      aria-invalid={!!errors.resume}
                      aria-describedby={errors.resume ? "resume-error" : undefined}
                    />
                    {errors.resume && (
                      <p id="resume-error" className="text-sm text-destructive" role="alert">
                        {errors.resume}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("manageRegistration.updating")}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t("manageRegistration.update")}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="flex-1"
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("manageRegistration.cancelling")}
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          {t("manageRegistration.cancel")}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ManageRegistration;


/**
 * Custom hook for registration form state and validation
 */

import { useState, useCallback } from "react";
import {
  sanitizeInput,
  isValidEmail,
  isValidFullName,
  isValidWhatsAppNumber,
  validateAndSanitizeUrl,
} from "@/lib/security";
import { useTranslation } from "@/hooks/useTranslation";

export interface RegistrationFormData {
  fullName: string;
  email: string;
  whatsapp: string;
  linkedIn: string;
  resume: File | null;
}

export interface FormErrors {
  fullName?: string;
  email?: string;
  whatsapp?: string;
  linkedIn?: string;
  resume?: string;
  captcha?: string;
}

export interface TouchedFields {
  fullName?: boolean;
  email?: boolean;
  whatsapp?: boolean;
  linkedIn?: boolean;
}

export const useRegistrationForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: "",
    email: "",
    whatsapp: "",
    linkedIn: "",
    resume: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [hasLinkedIn, setHasLinkedIn] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  const validateField = useCallback(
    (name: string, value: string): string | undefined => {
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
          if (value.trim()) {
            const sanitized = validateAndSanitizeUrl(value.trim());
            if (!sanitized) {
              return t("registration.errors.linkedInInvalid");
            }
          }
          return undefined;

        default:
          return undefined;
      }
    },
    [t]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const sanitizedValue = name === "fullName" ? sanitizeInput(value, 100) : value;

      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));

      // Clear error when user starts typing
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }

      // Update hasLinkedIn state
      if (name === "linkedIn") {
        setHasLinkedIn(!!value.trim());
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      const error = validateField(name, value);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      } else {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [validateField]
  );

  const validateAllFields = useCallback(
    (captchaToken: string | null, recaptchaSiteKey: string): FormErrors => {
      const fullName = sanitizeInput(formData.fullName.trim(), 100);
      const email = formData.email.trim().toLowerCase();
      const whatsapp = formData.whatsapp.trim();
      const linkedIn = formData.linkedIn.trim();

      const newErrors: FormErrors = {
        fullName: validateField("fullName", fullName),
        email: validateField("email", email),
        whatsapp: whatsapp ? validateField("whatsapp", whatsapp) : undefined,
        linkedIn: linkedIn ? validateField("linkedIn", linkedIn) : undefined,
      };

      // Check if LinkedIn or Resume is provided
      if (!hasLinkedIn && !hasResume) {
        newErrors.linkedIn = t("registration.errors.resumeRequired");
      }

      // Verify CAPTCHA
      if (recaptchaSiteKey && !captchaToken) {
        newErrors.captcha = t("registration.errors.captchaRequired");
      }

      return newErrors;
    },
    [formData, hasLinkedIn, hasResume, validateField, t]
  );

  const resetForm = useCallback(() => {
    setFormData({ fullName: "", email: "", whatsapp: "", linkedIn: "", resume: null });
    setHasLinkedIn(false);
    setHasResume(false);
    setErrors({});
    setTouched({});
  }, []);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    touched,
    setTouched,
    hasLinkedIn,
    hasResume,
    setHasResume,
    validateField,
    handleInputChange,
    handleBlur,
    validateAllFields,
    resetForm,
  };
};



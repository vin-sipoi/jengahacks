/**
 * Custom hook for registration form state and validation
 */

import { useState, useCallback } from "react";
import {
  sanitizeInput,
  isValidEmail,
} from "@/lib/security";
import { validateField } from "@/lib/validation";
import { useTranslation } from "@/hooks/useTranslation";

import { RegistrationFormData } from "@/types/registration";

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

  const validateFieldRef = useCallback(
    (name: string, value: string): string | undefined => {
      return validateField(name, value, t);
    },
    [t]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const sanitizedValue = name === "fullName" ? sanitizeInput(value, 100, false) : value;

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

      const error = validateField(name, value, t);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      } else {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [validateField, t]
  );

  const validateAllFields = useCallback(
    (captchaToken: string | null, recaptchaSiteKey: string): FormErrors => {
      const fullName = sanitizeInput(formData.fullName.trim(), 100);
      const email = formData.email.trim().toLowerCase();
      const whatsapp = formData.whatsapp.trim();
      const linkedIn = formData.linkedIn.trim();

      const newErrors: FormErrors = {
        fullName: validateFieldRef("fullName", fullName),
        email: validateFieldRef("email", email),
        whatsapp: whatsapp ? validateFieldRef("whatsapp", whatsapp) : undefined,
        linkedIn: linkedIn ? validateFieldRef("linkedIn", linkedIn) : undefined,
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
    [formData, hasLinkedIn, hasResume, validateFieldRef, t]
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



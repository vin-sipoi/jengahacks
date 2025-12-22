/**
 * CAPTCHA field component for registration form
 */

import { useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useTranslation } from "@/hooks/useTranslation";

interface CaptchaFieldProps {
  recaptchaRef: React.RefObject<ReCAPTCHA>;
  siteKey: string;
  token: string | null;
  error?: string;
  onTokenChange: (token: string | null) => void;
  onError: (error: unknown) => void;
}

export const CaptchaField = ({
  recaptchaRef,
  siteKey,
  token,
  error,
  onTokenChange,
  onError,
}: CaptchaFieldProps) => {
  const { t } = useTranslation();

  if (!siteKey) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-center overflow-x-auto pb-2">
        <div className="scale-90 sm:scale-100">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={siteKey}
            onChange={(newToken) => {
              if (newToken) {
                onTokenChange(newToken);
              }
            }}
            onExpired={() => {
              onTokenChange(null);
            }}
            onError={(error) => {
              onTokenChange(null);
              onError(error);
            }}
          />
        </div>
      </div>
      {error && (
        <p
          id="captcha-error"
          className="text-sm text-destructive text-center flex items-center justify-center gap-1.5"
          role="alert"
        >
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};



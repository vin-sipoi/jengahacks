/**
 * File upload field component for registration form
 */

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeFileName } from "@/lib/security";
import { useTranslation } from "@/hooks/useTranslation";

interface FileUploadFieldProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  file: File | null;
  error?: string;
  hasResume: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileUploadField = ({
  fileInputRef,
  file,
  error,
  hasResume,
  onChange,
}: FileUploadFieldProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <Label htmlFor="resume" className={cn("flex items-center gap-2", error && "text-destructive")}>
        <Upload className="w-4 h-4" aria-hidden="true" />
        {t("registration.resume")}
        {hasResume && !error && (
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
          onChange={onChange}
          className={cn(
            "bg-muted border-border focus:border-primary file:bg-primary file:text-primary-foreground file:border-0 file:rounded file:px-4 file:py-1 file:mr-4 file:font-medium file:cursor-pointer transition-all duration-300",
            error && "border-destructive focus:border-destructive animate-error-flash",
            hasResume && !error && "border-primary"
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? "resume-error" : file && !error ? "resume-success" : undefined
          }
        />
      </div>
      {file && !error && (
        <p
          id="resume-success"
          className="text-sm text-muted-foreground flex items-center gap-1.5 animate-slide-in-right"
          aria-live="polite"
        >
          <CheckCircle
            className="w-4 h-4 text-primary flex-shrink-0 animate-success-pulse"
            aria-hidden="true"
          />
          <span>Selected: {sanitizeFileName(file.name)}</span>
        </p>
      )}
      {error && (
        <p
          id="resume-error"
          className="text-sm text-destructive flex items-center gap-1.5 animate-slide-in-right"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle
            className="w-4 h-4 flex-shrink-0 animate-bounce-in"
            aria-hidden="true"
          />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};



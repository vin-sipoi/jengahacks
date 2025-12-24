/**
 * Custom hook for file upload logic
 */

import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  sanitizeFileName,
  isValidPdfExtension,
  isValidPdfMimeType,
} from "@/lib/security";
import { logger } from "@/lib/logger";
import { validateFile } from "@/lib/validation";

export interface FileUploadResult {
  success: boolean;
  resumePath: string | null;
  error?: string;
}

export const useFileUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFileRef = useCallback((file: File): string | undefined => {
    return validateFile(file);
  }, []);

  const uploadFile = useCallback(
    async (file: File): Promise<FileUploadResult> => {
      try {
        // Validate file
        const validationError = validateFileRef(file);
        if (validationError) {
          return {
            success: false,
            resumePath: null,
            error: validationError,
          };
        }

        // Sanitize original filename
        const sanitizedOriginalName = sanitizeFileName(file.name);
        const fileExt = sanitizedOriginalName.split(".").pop() || "pdf";

        // Generate secure filename with timestamp and random string
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Double-check file is still valid before upload
        if (!isValidPdfExtension(fileName) || !isValidPdfMimeType(file.type)) {
          return {
            success: false,
            resumePath: null,
            error: "Invalid file type",
          };
        }

        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(fileName, file);

        if (uploadError) {
          logger.error(
            "Resume upload error",
            uploadError instanceof Error ? uploadError : new Error(String(uploadError)),
            { resumePath: fileName }
          );
          return {
            success: false,
            resumePath: null,
            error: "Failed to upload resume",
          };
        }

        return {
          success: true,
          resumePath: fileName,
        };
      } catch (error) {
        logger.error(
          "Resume upload exception",
          error instanceof Error ? error : new Error(String(error))
        );
        return {
          success: false,
          resumePath: null,
          error: "Failed to upload resume",
        };
      }
    },
    [validateFileRef]
  );

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return {
    fileInputRef,
    validateFile: validateFileRef,
    uploadFile,
    resetFileInput,
  };
};



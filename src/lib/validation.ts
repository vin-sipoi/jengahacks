import {
    isValidPdfExtension,
    isValidPdfMimeType,
    isValidFullName,
    isValidWhatsAppNumber,
    validateAndSanitizeUrl
} from "./security";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "./constants";

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validates a file (typically for resume uploads)
 */
export const validateFile = (file: File): string | undefined => {
    if (!isValidPdfExtension(file.name)) {
        return "Please upload a PDF file";
    }
    if (!isValidPdfMimeType(file.type)) {
        return "Invalid file type. Please upload a PDF file.";
    }
    if (file.size > MAX_FILE_SIZE) {
        return `File size must be less than ${MAX_FILE_SIZE_MB}MB`;
    }
    return undefined;
};

/**
 * Common field validation logic
 */
export const validateField = (name: string, value: string, t: (key: string) => string): string | undefined => {
    const trimmedValue = value.trim();

    switch (name) {
        case "fullName":
            if (!trimmedValue) {
                return t("registration.errors.fullNameRequired");
            }
            if (!isValidFullName(trimmedValue)) {
                return t("registration.errors.fullNameInvalid");
            }
            return undefined;

        case "email":
            if (!trimmedValue) {
                return t("registration.errors.emailRequired");
            }
            if (!trimmedValue.includes("@")) {
                return t("registration.errors.emailInvalid");
            }
            return undefined;

        case "whatsapp":
            if (trimmedValue && !isValidWhatsAppNumber(trimmedValue)) {
                return t("registration.errors.whatsappInvalid");
            }
            return undefined;

        case "linkedIn":
            if (trimmedValue && !validateAndSanitizeUrl(trimmedValue)) {
                return t("registration.errors.linkedinInvalid");
            }
            return undefined;

        default:
            return undefined;
    }
};

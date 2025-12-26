/**
 * Integration tests for the complete registration flow
 * These tests verify the end-to-end registration process including:
 * - Form rendering and user interaction
 * - Validation and error handling
 * - File upload
 * - CAPTCHA verification
 * - Edge Function integration
 * - Rate limiting
 * - Success and error scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import Registration from "./Registration";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkRateLimit, clearRateLimit } from "@/lib/rateLimit";
import { trackRegistration } from "@/lib/analytics";

// Mock Supabase with improved chaining support
vi.mock("@/integrations/supabase/client", () => {
  const mockSingle = vi.fn().mockResolvedValue({ data: { id: "mock-id" }, error: null, count: null, status: 200, statusText: "OK" });
  const mockSelect = vi.fn().mockImplementation(() => ({
    single: mockSingle,
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  }));
  const mockInsert = vi.fn().mockImplementation(() => ({
    select: mockSelect,
    single: mockSingle,
  }));
  const mockFrom = vi.fn().mockImplementation(() => ({
    insert: mockInsert,
    select: mockSelect,
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }));
  
  return {
    supabase: {
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: { path: "test.pdf" }, error: null, count: null, status: 200, statusText: "OK" }),
        })),
      },
      from: mockFrom,
      functions: {
        invoke: vi.fn(),
      },
      rpc: vi.fn(),
    },
  };
});

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock reCAPTCHA
vi.mock("react-google-recaptcha", () => ({
  default: ({ 
    onChange, 
    onExpired, 
    onError 
  }: { 
    onChange?: (token: string | null) => void;
    onExpired?: () => void;
    onError?: (error: unknown) => void;
  }) => (
    <div data-testid="recaptcha">
      <button
        onClick={() => onChange && onChange("mock-captcha-token")}
        data-testid="recaptcha-trigger"
      >
        Verify CAPTCHA
      </button>
    </div>
  ),
}));

// Mock translations
vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        "registration.title": "Register Now",
        "registration.subtitle": "Secure your spot at JengaHacks 2026.",
        "registration.fullName": "Full Name",
        "registration.email": "Email Address",
        "registration.whatsapp": "WhatsApp Number",
        "registration.linkedin": "LinkedIn Profile",
        "registration.resume": "Resume (PDF only, max 5MB)",
        "registration.provideAtLeastOne": "Provide at least one",
        "registration.whyCollect": "We use this information to connect you with hiring companies.",
        "registration.optionalWhatsApp": "Optional",
        "registration.submit": "Complete Registration",
        "registration.submitting": "Submitting...",
        "registration.success": "Registration successful!",
        "registration.errors.fullNameRequired": "Full name is required",
        "registration.errors.emailRequired": "Email address is required",
        "registration.errors.resumeRequired": "Please provide either your LinkedIn profile or upload your resume",
        "registration.errors.resumeSize": "File size must be less than 5MB",
        "registration.errors.resumeTooLarge": "File size must be less than 5MB",
        "registration.errors.resumeInvalidType": "Please upload a PDF file (.pdf extension required)",
        "registration.errors.resumeType": "Please upload a PDF file (.pdf extension required)",
        "registration.errors.captchaRequired": "Please complete the CAPTCHA",
        "registration.errors.whatsappRequired": "WhatsApp number is required",
        "registration.errors.rateLimit": "Too many registration attempts. Please try again after {time}.",
        "registration.errors.failed": "Registration failed. Please try again.",
        "common.selected": "Selected",
      };
      let translation = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          translation = translation.replace(`{${paramKey}}`, String(paramValue));
        });
      }
      return translation;
    },
  }),
}));

// Mock analytics
vi.mock("@/lib/analytics", () => ({
  trackRegistration: vi.fn(),
  trackRegistrationStart: vi.fn(),
  trackRegistrationView: vi.fn(),
}));

// Mock rate limiting
vi.mock("@/lib/rateLimit", async () => {
  const actual = await vi.importActual("@/lib/rateLimit");
  return {
    ...actual,
    checkRateLimit: vi.fn(() => ({ allowed: true })),
    clearRateLimit: vi.fn(),
    recordSubmission: vi.fn(),
  };
});

describe("Registration Integration Tests", () => {
  let uploadMock: ReturnType<typeof vi.fn>;
  let insertMock: ReturnType<typeof vi.fn>;
  let mockFunctionsInvoke: ReturnType<typeof vi.fn>;
  let checkRateLimitMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage to prevent rate limiting between tests
    localStorage.clear();
    clearRateLimit();
    vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "test-site-key");
    
    // Reset rate limit mock to always allow
    checkRateLimitMock = vi.mocked(checkRateLimit);
    checkRateLimitMock.mockReturnValue({ allowed: true });
    
    // Create fresh mocks for each test
    uploadMock = vi.fn().mockResolvedValue({ error: null });
    
    // Create a chained mock for supabase.from().insert().select().single()
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: "mock-id" }, error: null, count: null, status: 200, statusText: "OK" });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    insertMock = vi.fn().mockReturnValue({ select: mockSelect });
    
    mockFunctionsInvoke = vi.fn().mockResolvedValue({ data: null, error: null, count: null, status: 200, statusText: "OK" });

    // Set up mocked functions for supabase.storage.from to fully match StorageFileApi 
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: uploadMock,
      download: vi.fn(),
      createSignedUrl: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      move: vi.fn(),
      update: vi.fn(),
      getPublicUrl: vi.fn(),
      getPublicUrlData: vi.fn(),
      url: "mock-url",
      headers: {},
      fetch: vi.fn(),
      shouldThrowOnError: true,
      throwOnError: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Set up mocked functions for supabase.from to return required table methods
     
    vi.mocked(supabase.from).mockImplementation(() =>
      ({
        insert: insertMock,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    );


    // Patch for type error: explicitly cast to expected invoke signature
    vi.mocked(supabase.functions.invoke).mockImplementation(
      mockFunctionsInvoke as unknown as (
        functionName: string,
        options?: Parameters<typeof supabase.functions.invoke>[1]
      ) => ReturnType<typeof supabase.functions.invoke>
    );

    // Set up default rpc mock - returns { data, error } format
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null, count: null, status: 200, statusText: "OK" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete Registration Flow", () => {
    it("should complete full registration with LinkedIn profile", async () => {
      const user = userEvent.setup();
      
      render(<Registration />);

      // Fill in form fields
      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john.doe@example.com");
      const whatsappInput = screen.getByLabelText(/WhatsApp Number/i);
      await user.type(whatsappInput, "+254712345678");
      await user.type(linkedInInput, "linkedin.com/in/johndoe");

      // Complete CAPTCHA
      const captchaTrigger = screen.getByTestId("recaptcha-trigger");
      await user.click(captchaTrigger);

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });
      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockFunctionsInvoke).toHaveBeenCalled();
      }, { timeout: 5000 });

      // Verify Edge Function was called with correct data
      expect(mockFunctionsInvoke).toHaveBeenCalledWith(
        "register-with-ip",
        expect.objectContaining({
          body: expect.objectContaining({
            full_name: expect.stringMatching(/John\s*Doe/),
            email: "john.doe@example.com",
            linkedin_url: expect.stringContaining("linkedin.com/in/johndoe"),
          }),
        })
      );

      // Verify success toast
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });

      // Verify analytics tracking
      expect(trackRegistration).toHaveBeenCalledWith(true);
    });

    it("should complete full registration with resume upload", async () => {
      const user = userEvent.setup();
      
      render(<Registration />);

      // Create a mock PDF file
      const file = new File(["mock pdf content"], "resume.pdf", {
        type: "application/pdf",
      });
      Object.defineProperty(file, "size", { value: 1024 * 1024 }); // 1MB

      // Fill in form fields
      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const resumeInput = screen.getByLabelText(/Resume/i);
      await user.type(nameInput, "Jane Smith");
      await user.type(emailInput, "jane.smith@example.com");
      const whatsappInput = screen.getByLabelText(/WhatsApp Number/i);
      await user.type(whatsappInput, "+254722334455");
      
      // Upload resume
      await user.upload(resumeInput, file);

      // Complete CAPTCHA
      const captchaTrigger = screen.getByTestId("recaptcha-trigger");
      await user.click(captchaTrigger);

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });
      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      // Wait for file upload
      await waitFor(() => {
        expect(uploadMock).toHaveBeenCalled();
      }, { timeout: 5000 });

      // Verify file was uploaded
      expect(uploadMock).toHaveBeenCalledWith(
        expect.stringMatching(/\.pdf$/),
        file
      );

      // Wait for database insert (via Edge Function)
      await waitFor(() => {
        expect(mockFunctionsInvoke).toHaveBeenCalled();
      }, { timeout: 10000 });

      // Verify success
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });

      expect(trackRegistration).toHaveBeenCalledWith(true);
    });

    it("should complete registration with WhatsApp number", async () => {
      const user = userEvent.setup();
      
      render(<Registration />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const whatsappInput = screen.getByLabelText(/WhatsApp Number/i);
      const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);

      await user.type(nameInput, "Alice Johnson");
      await user.type(emailInput, "alice@example.com");
      await user.type(whatsappInput, "+254 712345678");
      await user.type(linkedInInput, "linkedin.com/in/alice");

      // Complete CAPTCHA
      const captchaTrigger = screen.getByTestId("recaptcha-trigger");
      await user.click(captchaTrigger);

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });
      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      // Wait for submission
      await waitFor(() => {
        expect(mockFunctionsInvoke).toHaveBeenCalled();
      }, { timeout: 10000 });

      // Verify WhatsApp number was included (normalized format)
      expect(mockFunctionsInvoke).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.objectContaining({
            whatsapp_number: expect.stringMatching(/254712345678|\+254712345678/),
          }),
        })
      );

      expect(toast.success).toHaveBeenCalled();
      expect(trackRegistration).toHaveBeenCalledWith(true);
    });
  });

  describe("Rate Limiting Integration", () => {
    it("should prevent submission when rate limit is exceeded", async () => {
      const user = userEvent.setup();
      
      // Mock rate limit check to return false
      vi.mocked(checkRateLimit).mockReturnValue({
        allowed: false,
        retryAfter: 3600,
      });

      render(<Registration />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);

      await user.type(nameInput, "David Lee");
      await user.type(emailInput, "david@example.com");
      const whatsappInput = screen.getByLabelText(/WhatsApp Number/i);
      await user.type(whatsappInput, "+254733445566");
      await user.type(linkedInInput, "linkedin.com/in/david");

      const captchaTrigger = screen.getByTestId("recaptcha-trigger");
      await user.click(captchaTrigger);

      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });
      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      // Wait for rate limit error
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      }, { timeout: 10000 });

      // Verify Edge Function was NOT called
      expect(mockFunctionsInvoke).not.toHaveBeenCalled();

      // Note: Rate limit errors don't currently call trackRegistration
      // This is expected behavior - rate limiting happens before submission
    });
  });

  describe("File Upload Integration", () => {
    it("should handle file upload errors gracefully", async () => {
      const user = userEvent.setup();
      
      // Mock upload to fail - this happens during form submission
      uploadMock.mockResolvedValueOnce({
        error: { message: "Upload failed" },
      });

      render(<Registration />);

      const file = new File(["content"], "resume.pdf", {
        type: "application/pdf",
      });
      Object.defineProperty(file, "size", { value: 1024 * 1024 });

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const resumeInput = screen.getByLabelText(/Resume/i);
      await user.type(nameInput, "Eve Adams");
      await user.type(emailInput, "eve@example.com");
      const whatsappInput = screen.getByLabelText(/WhatsApp Number/i);
      await user.type(whatsappInput, "+254744556677");
      await user.upload(resumeInput, file);

      const captchaTrigger = screen.getByTestId("recaptcha-trigger");
      await user.click(captchaTrigger);

      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });
      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      // Wait for form submission
      // Note: Upload errors don't prevent registration - registration continues even if upload fails
      await waitFor(() => {
        // Upload error toast should be shown
        expect(toast.error).toHaveBeenCalled();
        // Insert (invoke) should still be called (registration continues even if upload fails)
        expect(mockFunctionsInvoke).toHaveBeenCalled();
      }, { timeout: 10000 });

      // If insert succeeds, registration is successful (upload error is non-blocking)
      await waitFor(() => {
        // Registration should be tracked as successful since insert succeeded
        expect(trackRegistration).toHaveBeenCalledWith(true);
      }, { timeout: 5000 });
    });

    it("should reject files that are too large", async () => {
      const user = userEvent.setup();
      
      render(<Registration />);

      // Create a file larger than 5MB
      const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.pdf", {
        type: "application/pdf",
      });
      Object.defineProperty(largeFile, "size", { value: 6 * 1024 * 1024 });

      const resumeInput = screen.getByLabelText(/Resume/i);
      await user.upload(resumeInput, largeFile);

      // File validation happens synchronously on file change
      // Check for error message - look for error message in alert role (not in label)
      await waitFor(() => {
        // Error message should be displayed in an alert role
        const errorAlerts = screen.getAllByRole("alert");
        const errorText = errorAlerts.find(alert => 
          /5MB|file.*size|too large|resumeSize/i.test(alert.textContent || "")
        );
        expect(errorText).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it("should reject non-PDF files", async () => {
      const user = userEvent.setup();
      
      render(<Registration />);

      const invalidFile = new File(["content"], "document.txt", {
        type: "text/plain",
      });
      Object.defineProperty(invalidFile, "size", { value: 1024 });

      const resumeInput = screen.getByLabelText(/Resume/i);
      await user.upload(resumeInput, invalidFile);

      // File validation happens synchronously on file change
      // Check for error message - look for error message by text content
      await waitFor(() => {
        // Error message should be displayed - check for the translation key or actual text
        const errorText = screen.queryByText(/PDF|file.*extension|upload.*PDF|resumeType|resumeInvalidType/i);
        expect(errorText).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe("Validation Integration", () => {
    it("should validate all required fields before submission", async () => {
      const user = userEvent.setup();
      
      render(<Registration />);

      // Try to submit without filling fields
      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });
      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
        expect(screen.getByText(/WhatsApp number is required/i)).toBeInTheDocument();
      });

      // Verify no submission occurred
      expect(mockFunctionsInvoke).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it("should require either LinkedIn or resume", async () => {
      const user = userEvent.setup();
      
      render(<Registration />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);

      await user.type(nameInput, "Frank Miller");
      await user.type(emailInput, "frank@example.com");
      const whatsappInput = screen.getByLabelText(/WhatsApp Number/i);
      await user.type(whatsappInput, "+254755667788");

      // Complete CAPTCHA
      const captchaTrigger = screen.getByTestId("recaptcha-trigger");
      await user.click(captchaTrigger);

      // Try to submit without LinkedIn or resume
      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });
      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText(/Please provide either your LinkedIn profile or upload your resume/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      expect(mockFunctionsInvoke).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle database errors gracefully", async () => {
      const user = userEvent.setup();
      
      // Mock function invoke to fail
      mockFunctionsInvoke.mockResolvedValueOnce({
        data: { success: false, error: "Database error" },
        error: null // The function call itself succeeds, but returns application error
      });

      render(<Registration />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);

      await user.type(nameInput, "Grace Hopper");
      await user.type(emailInput, "grace@example.com");
      const whatsappInput = screen.getByLabelText(/WhatsApp Number/i);
      await user.type(whatsappInput, "+254766778899");
      await user.type(linkedInInput, "linkedin.com/in/grace");

      const captchaTrigger = screen.getByTestId("recaptcha-trigger");
      await user.click(captchaTrigger);

      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });
      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      // Wait for error handling
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(mockFunctionsInvoke).toHaveBeenCalled();
        // Since we mock the function response to be success: false, the service throws "Database error" or "Registration failed"
      }, { timeout: 10000 });

      // Verify error was tracked - database errors should call trackRegistration(false)
      await waitFor(() => {
        expect(trackRegistration).toHaveBeenCalledWith(
          false,
          expect.any(String)
        );
      }, { timeout: 5000 });
    });

    it("should handle CAPTCHA verification failures", async () => {
      const user = userEvent.setup();
      
      // Note: The current implementation only validates CAPTCHA client-side (checks for token existence)
      // Server-side CAPTCHA verification is not implemented in the current component
      // This test verifies that the form prevents submission when CAPTCHA is not completed
      
      render(<Registration />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);

      await user.type(nameInput, "Henry Ford");
      await user.type(emailInput, "henry@example.com");
      const whatsappInput = screen.getByLabelText(/WhatsApp Number/i);
      await user.type(whatsappInput, "+254777889900");
      await user.type(linkedInInput, "linkedin.com/in/henry");

      // Don't complete CAPTCHA - submit form without CAPTCHA token
      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });
      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      // Wait for validation error
      // Form should prevent submission when CAPTCHA is not completed
      await waitFor(() => {
        // Should show error for missing CAPTCHA - look for the specific error message
        const captchaError = screen.getByText(/Please complete the CAPTCHA|complete.*CAPTCHA/i);
        expect(captchaError).toBeInTheDocument();
        // Form should not submit
        expect(mockFunctionsInvoke).not.toHaveBeenCalled();
      }, { timeout: 5000 });
    });
  });

  describe("Form Reset After Success", () => {
    it("should reset form fields after successful submission", async () => {
      const user = userEvent.setup();
      
      render(<Registration />);

      const nameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i) as HTMLInputElement;

      await user.type(nameInput, "Iris Watson");
      await user.type(emailInput, "iris@example.com");
      const whatsappInput = screen.getByLabelText(/WhatsApp Number/i);
      await user.type(whatsappInput, "+254788990011");
      await user.type(linkedInInput, "linkedin.com/in/iris");

      const captchaTrigger = screen.getByTestId("recaptcha-trigger");
      await user.click(captchaTrigger);

      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });
      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      // Wait for success and form submission
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
        expect(mockFunctionsInvoke).toHaveBeenCalled();
      }, { timeout: 15000 });

      // Verify form was reset - form resets after successful submission
      // React state updates are async, so we need to wait for the DOM to reflect the state
      await waitFor(() => {
        // Re-query inputs after form reset to get fresh references
        const resetNameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement;
        const resetEmailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
        const resetLinkedInInput = screen.getByLabelText(/LinkedIn Profile/i) as HTMLInputElement;
        
        // Form state should be reset (inputs should be empty)
        // In React, controlled inputs reflect the state value
        expect(resetNameInput.value).toBe("");
        expect(resetEmailInput.value).toBe("");
        expect(resetLinkedInInput.value).toBe("");
      }, { timeout: 10000 });
    });
  });
});


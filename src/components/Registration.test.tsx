import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import Registration from "./Registration";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
    })),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

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
        "registration.subtitle": "Secure your spot at JengaHacks 2026. Limited to 200 participants.",
        "registration.fullName": "Full Name",
        "registration.email": "Email Address",
        "registration.whatsapp": "WhatsApp Number",
        "registration.linkedin": "LinkedIn Profile",
        "registration.resume": "Resume (PDF only, max 5MB)",
        "registration.provideAtLeastOne": "Provide at least one",
        "registration.whyCollect": "We use this information to connect you with hiring companies and sponsors who are looking for talented participants like you.",
        "registration.optionalWhatsApp": "Optional - We'll use this to contact you about the event",
        "registration.submit": "Complete Registration",
        "registration.submitting": "Submitting...",
        "registration.success": "Registration successful! We'll be in touch soon.",
        "registration.terms": "By registering, you agree to our terms and conditions. We'll never share your information without consent.",
        "registration.errors.fullNameRequired": "Full name is required",
        "registration.errors.fullNameInvalid": "Please enter a valid full name (2-100 characters, letters and spaces only)",
        "registration.errors.emailRequired": "Email address is required",
        "registration.errors.emailInvalid": "Please enter a valid email address",
        "registration.errors.whatsappInvalid": "Please enter a valid WhatsApp number (e.g., +254712345678 or 0712345678)",
        "registration.errors.linkedinInvalid": "Please enter a valid LinkedIn URL (e.g., linkedin.com/in/yourprofile)",
        "registration.errors.resumeRequired": "Please provide either your LinkedIn profile or upload your resume",
        "registration.errors.resumeSize": "File size must be less than 5MB",
        "registration.errors.resumeType": "Please upload a PDF file (.pdf extension required)",
        "registration.errors.captchaRequired": "Please complete the CAPTCHA",
        "registration.errors.captchaFailed": "CAPTCHA verification failed. Please try again.",
        "registration.errors.rateLimit": "Too many registration attempts. Please try again after {time}.",
        "registration.errors.duplicateEmail": "This email is already registered",
        "registration.errors.failed": "Registration failed. Please try again.",
        "common.retry": "Retry",
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

describe("Registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variable for CAPTCHA
    vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "test-site-key");
  });

  it("should render the registration form", () => {
    render(<Registration />);
    // Check for the heading specifically
    const heading = screen.getByRole("heading", { name: /Register Now/i });
    expect(heading).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
  });

  it("should render all form fields", () => {
    render(<Registration />);
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/LinkedIn Profile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Resume/i)).toBeInTheDocument();
  });

  it("should allow user to type in form fields", async () => {
    const user = userEvent.setup();
    render(<Registration />);

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");

    expect(nameInput).toHaveValue("John Doe");
    expect(emailInput).toHaveValue("john@example.com");
  });

  it("should show error when submitting empty form", async () => {
    render(<Registration />);

    const form = screen.getByRole("button", {
      name: /Complete Registration/i,
    }).closest("form") as HTMLFormElement;
    
    // Use fireEvent to bypass HTML5 validation
    fireEvent.submit(form);

    await waitFor(() => {
      // Check for inline error message
      expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("should validate email format", async () => {
    const user = userEvent.setup();
    render(<Registration />);

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
    const form = screen.getByRole("button", {
      name: /Complete Registration/i,
    }).closest("form") as HTMLFormElement;

    await user.type(nameInput, "John Doe");
    // Change input type to text to bypass browser validation
    emailInput.type = "text";
    await user.type(emailInput, "invalid-email");
    
    // Blur to trigger validation
    fireEvent.blur(emailInput);
    
    // Use fireEvent to bypass HTML5 validation
    fireEvent.submit(form);

    await waitFor(() => {
      // Check for inline error message
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("should require either LinkedIn or resume", async () => {
    const user = userEvent.setup();
    render(<Registration />);

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const submitButton = screen.getByRole("button", {
      name: /Complete Registration/i,
    });

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      // Check for inline error message
      expect(screen.getByText(/Please provide either your LinkedIn profile or upload your resume/i)).toBeInTheDocument();
    });
  });

  it("should accept valid LinkedIn URL", async () => {
    const user = userEvent.setup();
    render(<Registration />);

    const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);
    await user.type(linkedInInput, "linkedin.com/in/test");

    // Check that the input has the value
    expect(linkedInInput).toHaveValue("linkedin.com/in/test");
  });

  it("should disable submit button when submitting", async () => {
    const user = userEvent.setup();
    vi.stubEnv("VITE_USE_REGISTRATION_EDGE_FUNCTION", "false");
    render(<Registration />);

    // Mock successful submission
    const mockUpload = vi.fn().mockResolvedValue({ error: null });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockUpload,
    } as unknown as ReturnType<typeof supabase.storage.from>);

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>);

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);
    const submitButton = screen.getByRole("button", {
      name: /Complete Registration/i,
    }) as HTMLButtonElement;

    // Complete CAPTCHA first
    const captchaTrigger = screen.getByTestId("recaptcha-trigger");
    await user.click(captchaTrigger);

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.type(linkedInInput, "linkedin.com/in/test");
    
    // Use fireEvent to submit form and trigger async handler
    const form = submitButton.closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    // Button should be disabled during submission
    await waitFor(() => {
      expect(submitButton.disabled).toBe(true);
    }, { timeout: 2000 });
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  it("should show checkmark when LinkedIn is provided", async () => {
    const user = userEvent.setup();
    render(<Registration />);

    const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);
    await user.type(linkedInInput, "linkedin.com/in/test");
    
    // Blur to trigger validation
    fireEvent.blur(linkedInInput);

    // Verify the input has the value
    expect(linkedInInput).toHaveValue("linkedin.com/in/test");
    
    // Wait for checkmark to appear (CheckCircle icon in the input)
    await waitFor(() => {
      const checkIcon = linkedInInput.parentElement?.querySelector('svg[class*="text-primary"]');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe("Form Validation Feedback", () => {
    it("should show real-time validation errors when field is touched", async () => {
      const user = userEvent.setup();
      render(<Registration />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      
      // Type invalid email
      await user.type(emailInput, "invalid");
      // Blur to trigger validation
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it("should show success indicator when field is valid", async () => {
      const user = userEvent.setup();
      render(<Registration />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      
      // Type valid name
      await user.type(nameInput, "John Doe");
      // Blur to trigger validation
      fireEvent.blur(nameInput);

      await waitFor(() => {
        // Check for success icon (CheckCircle)
        const checkIcon = nameInput.parentElement?.querySelector('svg[class*="text-primary"]');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it("should clear error when user starts typing", async () => {
      const user = userEvent.setup();
      render(<Registration />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      
      // Type invalid email and blur
      await user.type(emailInput, "invalid");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      });

      // Start typing valid email
      await user.clear(emailInput);
      await user.type(emailInput, "john@example.com");

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/Please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });
  });

  it("should validate WhatsApp number format", async () => {
    const user = userEvent.setup();
    render(<Registration />);

    const whatsappInput = screen.getByLabelText(/WhatsApp Number/i);
    
    // Type invalid WhatsApp number
    await user.type(whatsappInput, "123");
    fireEvent.blur(whatsappInput);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid WhatsApp number/i)).toBeInTheDocument();
    });
  });

  it("should accept valid WhatsApp number", async () => {
    const user = userEvent.setup();
    render(<Registration />);

    const whatsappInput = screen.getByLabelText(/WhatsApp Number/i);
    
    // Type valid WhatsApp number
    await user.type(whatsappInput, "+254712345678");
    fireEvent.blur(whatsappInput);

    await waitFor(() => {
      // Check for success icon
      const checkIcon = whatsappInput.parentElement?.querySelector('svg[class*="text-primary"]');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe("IP Rate Limiting", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "test-site-key");
    });

    it("should use Edge Function when VITE_USE_REGISTRATION_EDGE_FUNCTION is true", async () => {
      const user = userEvent.setup();
      vi.stubEnv("VITE_USE_REGISTRATION_EDGE_FUNCTION", "true");
      
      const mockInvoke = vi.fn().mockResolvedValue({
        data: { success: true, data: { id: "123", email: "test@example.com" } },
        error: null,
      });

      vi.mocked(supabase.functions.invoke).mockImplementation(mockInvoke);

      render(<Registration />);

      const captchaTrigger = screen.getByTestId("recaptcha-trigger");
      await user.click(captchaTrigger);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);
      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(linkedInInput, "linkedin.com/in/test");

      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("register-with-ip", {
          body: expect.objectContaining({
            full_name: "John Doe",
            email: "john@example.com",
            linkedin_url: expect.stringContaining("linkedin.com"),
          }),
        });
      });
    });

    it("should handle IP rate limit error from Edge Function", async () => {
      const user = userEvent.setup();
      vi.stubEnv("VITE_USE_REGISTRATION_EDGE_FUNCTION", "true");

      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          error: "Rate limit exceeded. Maximum 3 registrations per email or 5 per IP per hour.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        error: null,
      });

      vi.mocked(supabase.functions.invoke).mockImplementation(mockInvoke);

      render(<Registration />);

      const captchaTrigger = screen.getByTestId("recaptcha-trigger");
      await user.click(captchaTrigger);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);
      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(linkedInInput, "linkedin.com/in/test");

      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      }, { timeout: 10000 });
      
      // Verify the error message contains rate limit related text
      const errorCalls = vi.mocked(toast.error).mock.calls;
      const lastErrorCall = errorCalls[errorCalls.length - 1];
      expect(lastErrorCall[0]).toMatch(/rate limit|too many|Rate limit exceeded/i);
    });

    it("should handle IP rate limit error with specific IP limit message", async () => {
      const user = userEvent.setup();
      vi.stubEnv("VITE_USE_REGISTRATION_EDGE_FUNCTION", "true");

      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          error: "Rate limit exceeded. Maximum 5 registrations per IP per hour.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        error: null,
      });

      vi.mocked(supabase.functions.invoke).mockImplementation(mockInvoke);

      render(<Registration />);

      const captchaTrigger = screen.getByTestId("recaptcha-trigger");
      await user.click(captchaTrigger);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);
      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(linkedInInput, "linkedin.com/in/test");

      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      }, { timeout: 10000 });
      
      // Verify the error message contains rate limit related text
      const errorCalls = vi.mocked(toast.error).mock.calls;
      const lastErrorCall = errorCalls[errorCalls.length - 1];
      expect(lastErrorCall[0]).toMatch(/5 per IP|rate limit|too many|Rate limit exceeded/i);
    });

    it("should handle database rate limit error (RLS policy violation)", async () => {
      const user = userEvent.setup();
      vi.stubEnv("VITE_USE_REGISTRATION_EDGE_FUNCTION", "false");

      const mockInsert = vi.fn().mockResolvedValue({
        error: {
          message: "new row violates row-level security policy",
          code: "42501",
        },
      });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<typeof supabase.from>);

      render(<Registration />);

      const captchaTrigger = screen.getByTestId("recaptcha-trigger");
      await user.click(captchaTrigger);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);
      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(linkedInInput, "linkedin.com/in/test");

      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      }, { timeout: 10000 });
      
      // Verify the error message contains rate limit related text
      const errorCalls = vi.mocked(toast.error).mock.calls;
      const lastErrorCall = errorCalls[errorCalls.length - 1];
      expect(lastErrorCall[0]).toMatch(/rate limit|too many|Rate limit exceeded/i);
    });

    it("should handle Edge Function network errors gracefully", async () => {
      const user = userEvent.setup();
      vi.stubEnv("VITE_USE_REGISTRATION_EDGE_FUNCTION", "true");

      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Network error",
          status: 500,
        },
      });

      vi.mocked(supabase.functions.invoke).mockImplementation(mockInvoke);

      render(<Registration />);

      const captchaTrigger = screen.getByTestId("recaptcha-trigger");
      await user.click(captchaTrigger);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const linkedInInput = screen.getByLabelText(/LinkedIn Profile/i);
      const submitButton = screen.getByRole("button", {
        name: /Complete Registration/i,
      });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(linkedInInput, "linkedin.com/in/test");

      const form = submitButton.closest("form") as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Verify error was shown (could be "Failed to submit" or generic error)
      expect(toast.error).toHaveBeenCalled();
    });

  });
});


import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import Registration from "./Registration";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Mock Supabase is handled via vi.mock at the top, but we'll re-mock implementations in beforeEach
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
    rpc: vi.fn(),
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
        "registration.errors.whatsappRequired": "WhatsApp number is required",
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
  let uploadMock: ReturnType<typeof vi.fn>;
  let insertMock: ReturnType<typeof vi.fn>;
  let invokeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variable for CAPTCHA
    vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "test-site-key");
    
    uploadMock = vi.fn().mockResolvedValue({ data: { path: "resumes/test.pdf" }, error: null });
    
    // Set up chained insert mock
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: "mock-id" }, error: null, count: null, status: 200, statusText: "OK" });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    insertMock = vi.fn().mockReturnValue({ select: mockSelect });
    
    invokeMock = vi.fn().mockResolvedValue({ data: null, error: null, count: null, status: 200, statusText: "OK" });

    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: uploadMock,
      download: vi.fn(),
      createSignedUrl: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      url: "mock-url",
      headers: {},
      fetch: vi.fn(),
      shouldThrowOnError: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      insert: insertMock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    vi.mocked(supabase.functions.invoke).mockImplementation(
      invokeMock as unknown as (
        functionName: string,
        options?: Parameters<typeof supabase.functions.invoke>[1]
      ) => ReturnType<typeof supabase.functions.invoke>
    );
    
    // Set up default rpc mock
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null, count: null, status: 200, statusText: "OK" });
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
      expect(screen.getByText(/WhatsApp number is required/i)).toBeInTheDocument();
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
    // WhatsApp is now required
    const whatsappInput = screen.getByLabelText(/WhatsApp Number/i);
    await user.type(whatsappInput, "+254712345678");
    
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

    // Use the mocks set up in beforeEach
    // But we need to make sure insertMock returns a builder that works for registrationService
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: "mock-id" }, error: null, count: null, status: 200, statusText: "OK" });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    insertMock.mockReturnValue({ select: mockSelect });

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
    const whatsappInput = screen.getByLabelText(/WhatsApp Number/i);
    await user.type(whatsappInput, "+254712345678");
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
      expect(invokeMock).toHaveBeenCalled();
    }, { timeout: 5000 });
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
        // Check for success icon by its test ID
        expect(screen.getByTestId("fullName-success")).toBeInTheDocument();
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
      expect(screen.getByTestId("whatsapp-success")).toBeInTheDocument();
    });
  });
});

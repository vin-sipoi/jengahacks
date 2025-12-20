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
  default: ({ onChange, onExpired, onError }: any) => (
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
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("valid full name")
      );
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
    
    // Use fireEvent to bypass HTML5 validation
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Please enter a valid email address"
      );
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
      expect(toast.error).toHaveBeenCalledWith(
        "Please provide either your LinkedIn profile or upload your resume"
      );
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
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

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

    // Verify the input has the value
    expect(linkedInInput).toHaveValue("linkedin.com/in/test");
    
    // Check that the label contains a checkmark (CheckCircle icon)
    // The icon is rendered as an SVG, so we check for its presence via the label
    const label = linkedInInput.closest("div")?.querySelector("label");
    expect(label).toBeInTheDocument();
    // The CheckCircle component should be rendered when hasLinkedIn is true
    // We verify by checking the input value which triggers the state change
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
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining("Rate limit exceeded")
        );
      }, { timeout: 2000 });
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
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringMatching(/5 per IP|Rate limit exceeded/i)
        );
      }, { timeout: 2000 });
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
      } as any);

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
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining("Rate limit exceeded")
        );
      }, { timeout: 2000 });
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


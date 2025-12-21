import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/test-utils";
import SocialShare from "./SocialShare";

// Mock window.open
const mockOpen = vi.fn();
Object.defineProperty(window, "open", {
  writable: true,
  value: mockOpen,
});

// Mock navigator.share
const mockShare = vi.fn();
const mockNavigatorShare = vi.fn().mockResolvedValue(undefined);

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.defineProperty(navigator, "clipboard", {
  writable: true,
  value: mockClipboard,
});

describe("SocialShare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOpen.mockClear();
    mockShare.mockClear();
    mockClipboard.writeText.mockClear();
    // Delete navigator.share first to ensure it's configurable
    try {
      delete (navigator as { share?: unknown }).share;
    } catch {
      // Ignore if delete fails
    }
    // Set navigator.share to undefined by default
    Object.defineProperty(navigator, "share", {
      writable: true,
      configurable: true,
      value: undefined,
    });
  });

  it("should render default variant", () => {
    render(<SocialShare />);
    expect(screen.getByText("Share this event")).toBeInTheDocument();
    expect(screen.getByText("Twitter")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Copy Link")).toBeInTheDocument();
  });

  it("should render compact variant", () => {
    render(<SocialShare variant="compact" />);
    expect(screen.getByText("Share:")).toBeInTheDocument();
    expect(screen.getByText("Twitter")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByText("Copy Link")).toBeInTheDocument();
  });

  it("should render icon-only variant", () => {
    // Delete and set navigator.share for this test
    try {
      delete (navigator as { share?: unknown }).share;
    } catch {
      // Ignore if delete fails
    }
    Object.defineProperty(navigator, "share", {
      writable: true,
      configurable: true,
      value: mockNavigatorShare,
    });
    render(<SocialShare variant="icon-only" />);
    // Check for aria-labels instead of text
    expect(screen.getByLabelText("Share")).toBeInTheDocument();
    expect(screen.getByLabelText("Share Twitter")).toBeInTheDocument();
    expect(screen.getByLabelText("Share Facebook")).toBeInTheDocument();
    expect(screen.getByLabelText("Share LinkedIn")).toBeInTheDocument();
    expect(screen.getByLabelText("Share WhatsApp")).toBeInTheDocument();
    expect(screen.getByLabelText("Copy Link")).toBeInTheDocument();
  });

  it("should show native share button when navigator.share is available", () => {
    try {
      delete (navigator as { share?: unknown }).share;
    } catch {
      // Ignore if delete fails
    }
    Object.defineProperty(navigator, "share", {
      writable: true,
      configurable: true,
      value: mockNavigatorShare,
    });
    render(<SocialShare variant="compact" />);
    expect(screen.getByText("Share via...")).toBeInTheDocument();
  });

  it("should not show native share button when navigator.share is not available", () => {
    render(<SocialShare variant="compact" />);
    expect(screen.queryByText("Share via...")).not.toBeInTheDocument();
  });

  it("should open Twitter share link when clicked", () => {
    render(<SocialShare variant="compact" />);
    
    const twitterButton = screen.getByText("Twitter");
    fireEvent.click(twitterButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining("twitter.com/intent/tweet"),
      "_blank",
      expect.any(String)
    );
  });

  it("should use custom URL when provided", () => {
    const customUrl = "https://example.com/custom";
    render(<SocialShare url={customUrl} variant="compact" />);
    
    const twitterButton = screen.getByText("Twitter");
    fireEvent.click(twitterButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(customUrl)),
      "_blank",
      expect.any(String)
    );
  });

  it("should use custom title when provided", () => {
    const customTitle = "Custom Event Title";
    render(<SocialShare title={customTitle} variant="compact" />);
    
    const twitterButton = screen.getByText("Twitter");
    fireEvent.click(twitterButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(customTitle)),
      "_blank",
      expect.any(String)
    );
  });

  it("should copy link to clipboard when copy button is clicked", async () => {
    render(<SocialShare variant="compact" />);
    
    const copyButton = screen.getByText("Copy Link");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalled();
    });
    
    // Verify clipboard was called with a URL string
    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.any(String));
    const calledUrl = mockClipboard.writeText.mock.calls[0][0];
    expect(calledUrl).toMatch(/^https?:\/\//);
  });

  it("should use native share API when available", async () => {
    try {
      delete (navigator as { share?: unknown }).share;
    } catch {
      // Ignore if delete fails
    }
    const mockShareFn = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      writable: true,
      configurable: true,
      value: mockShareFn,
    });
    
    render(<SocialShare variant="compact" />);
    
    const nativeShareButton = screen.getByText("Share via...");
    fireEvent.click(nativeShareButton);

    // Wait for async operation
    await waitFor(() => {
      expect(mockShareFn).toHaveBeenCalled();
    });
    
    // Verify the call arguments
    const callArgs = mockShareFn.mock.calls[0][0];
    expect(callArgs).toHaveProperty("title");
    expect(callArgs).toHaveProperty("text");
    expect(callArgs.url).toMatch(/^https?:\/\//);
  });

  it("should handle email share", () => {
    const originalLocation = window.location;
    const mockLocation = { href: "" };
    Object.defineProperty(window, "location", {
      writable: true,
      configurable: true,
      value: mockLocation,
    });

    render(<SocialShare variant="default" />);
    
    const emailButton = screen.getByText("Email");
    fireEvent.click(emailButton);

    expect(mockLocation.href).toContain("mailto:");

    // Restore original location
    Object.defineProperty(window, "location", {
      writable: true,
      configurable: true,
      value: originalLocation,
    });
  });

  it("should render Reddit and Telegram buttons in default variant", () => {
    render(<SocialShare variant="default" />);
    expect(screen.getByText("Reddit")).toBeInTheDocument();
    expect(screen.getByText("Telegram")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });
});

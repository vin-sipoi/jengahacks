import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import Hero from "./Hero";

// Mock the icon image
vi.mock("@/assets/jengahacks-icon.svg", () => ({
  default: "mock-icon.svg",
}));

describe("Hero", () => {
  it("should render the main heading", () => {
    render(<Hero />);
    expect(screen.getByText(/JENGA/i)).toBeInTheDocument();
    expect(screen.getByText(/HACKS/i)).toBeInTheDocument();
  });

  it("should render the tagline", () => {
    render(<Hero />);
    expect(
      screen.getByText(/48 hours of innovation, collaboration/i)
    ).toBeInTheDocument();
  });

  it("should render event details", () => {
    render(<Hero />);
    expect(screen.getByText(/February 21-22, 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/iHub, Nairobi/i)).toBeInTheDocument();
  });

  it("should render call-to-action buttons", () => {
    render(<Hero />);
    expect(screen.getByText("Register Now")).toBeInTheDocument();
    expect(screen.getByText("Learn More")).toBeInTheDocument();
  });

  it("should have correct href for Register Now button", () => {
    render(<Hero />);
    const registerButton = screen.getByText("Register Now").closest("a");
    expect(registerButton).toHaveAttribute("href", "#register");
  });

  it("should have correct href for Learn More button", () => {
    render(<Hero />);
    const learnMoreButton = screen.getByText("Learn More").closest("a");
    expect(learnMoreButton).toHaveAttribute("href", "#about");
  });

  it("should render stats section", () => {
    render(<Hero />);
    expect(screen.getByText("100+")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("Hackers")).toBeInTheDocument();
    expect(screen.getByText("Hours")).toBeInTheDocument();
  });

  it("should render the icon image", () => {
    render(<Hero />);
    const icon = screen.getByAltText(/JengaHacks Logo/i);
    expect(icon).toBeInTheDocument();
  });
});


import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import Sponsors from "./Sponsors";

// Mock the logo images
vi.mock("@/assets/silicon-savannah-logo.png", () => ({
  default: "mock-silicon-savannah.png",
}));

vi.mock("@/assets/adamur-logo.png", () => ({
  default: "mock-adamur.png",
}));

vi.mock("@/assets/promptbi-logo.svg", () => ({
  default: "mock-promptbi.svg",
}));

describe("Sponsors", () => {
  it("should render the main heading", () => {
    render(<Sponsors />);
    expect(screen.getByText(/Our/i)).toBeInTheDocument();
    expect(screen.getByText(/Sponsors/i)).toBeInTheDocument();
  });

  it("should render the description", () => {
    render(<Sponsors />);
    expect(
      screen.getByText(/Backed by leading tech companies/i)
    ).toBeInTheDocument();
  });

  it("should render Platinum Partners section", () => {
    render(<Sponsors />);
    expect(screen.getByText("Platinum Partners")).toBeInTheDocument();
  });

  it("should render sponsor logos", () => {
    render(<Sponsors />);
    expect(
      screen.getByAltText("Silicon Savannah Solutions")
    ).toBeInTheDocument();
    expect(screen.getByAltText("Adamur - #BeyondCode")).toBeInTheDocument();
    expect(screen.getByAltText("PromptBI")).toBeInTheDocument();
  });

  it("should have correct links for sponsors", () => {
    render(<Sponsors />);
    const siliconSavannahLink = screen
      .getByAltText("Silicon Savannah Solutions")
      .closest("a");
    expect(siliconSavannahLink).toHaveAttribute(
      "href",
      "https://siliconsavannah.solutions"
    );
    expect(siliconSavannahLink).toHaveAttribute("target", "_blank");
    expect(siliconSavannahLink).toHaveAttribute("rel", "noopener noreferrer");

    const adamurLink = screen.getByAltText("Adamur - #BeyondCode").closest("a");
    expect(adamurLink).toHaveAttribute("href", "https://adamur.io");
    expect(adamurLink).toHaveAttribute("target", "_blank");
    expect(adamurLink).toHaveAttribute("rel", "noopener noreferrer");

    const promptbiLink = screen.getByAltText("PromptBI").closest("a");
    expect(promptbiLink).toHaveAttribute("href", "https://promptbix.com");
    expect(promptbiLink).toHaveAttribute("target", "_blank");
    expect(promptbiLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should render Become a Sponsor section", () => {
    render(<Sponsors />);
    expect(screen.getByText("Become a Sponsor")).toBeInTheDocument();
    expect(
      screen.getByText(/Partner with us to shape the future/i)
    ).toBeInTheDocument();
  });

  it("should have link to sponsorship page", () => {
    render(<Sponsors />);
    const sponsorshipLink = screen.getByText("Join Us →").closest("a");
    expect(sponsorshipLink).toHaveAttribute("href", "/sponsorship");
  });

  it("should have correct section id for navigation", () => {
    const { container } = render(<Sponsors />);
    const section = container.querySelector("#sponsors");
    expect(section).toBeInTheDocument();
  });
});


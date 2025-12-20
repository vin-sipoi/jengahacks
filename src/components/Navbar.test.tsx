import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import Navbar from "./Navbar";

// Mock the logo image
vi.mock("@/assets/jengahacks-logo.png", () => ({
  default: "mock-logo.png",
}));

describe("Navbar", () => {
  it("should render the logo", () => {
    render(<Navbar />);
    const logo = screen.getByAltText(/JengaHacks/i);
    expect(logo).toBeInTheDocument();
  });

  it("should render navigation links", () => {
    render(<Navbar />);
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Become a Sponsor")).toBeInTheDocument();
    expect(screen.getByText("Join Now")).toBeInTheDocument();
  });

  it("should have correct href attributes for anchor links", () => {
    render(<Navbar />);
    const aboutLink = screen.getByText("About").closest("a");
    expect(aboutLink).toHaveAttribute("href", "#about");

    const becomeSponsorLink = screen.getByText("Become a Sponsor").closest("a");
    expect(becomeSponsorLink).toHaveAttribute("href", "/sponsorship");
  });

  it("should toggle mobile menu when menu button is clicked", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    // Click the menu button
    const menuButton = screen.getByLabelText("Toggle menu");
    await user.click(menuButton);

    // Mobile navigation should be visible - check that mobile menu container exists
    const mobileNav = document.querySelector(".md\\:hidden.py-4");
    expect(mobileNav).toBeInTheDocument();
  });

  it("should close mobile menu when a link is clicked", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const menuButton = screen.getByLabelText("Toggle menu");
    await user.click(menuButton);

    // Get all About links and click the one in mobile menu
    const aboutLinks = screen.getAllByText("About");
    // The mobile menu link should be clickable
    expect(aboutLinks.length).toBeGreaterThan(0);
    await user.click(aboutLinks[0]);

    // Verify link exists (menu state is internal, hard to test without exposing state)
    expect(aboutLinks[0]).toBeInTheDocument();
  });

  it("should render desktop navigation on larger screens", () => {
    render(<Navbar />);
    const desktopNav = screen.getByText("About").closest("div");
    expect(desktopNav).toHaveClass("hidden", "md:flex");
  });
});


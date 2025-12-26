import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import About from "./About";

describe("About", () => {
  it("should render the main heading", () => {
    render(<About />);
    expect(screen.getByText(/Why/i)).toBeInTheDocument();
    expect(screen.getByText(/JengaHacks/i)).toBeInTheDocument();
  });

  it("should render the description", () => {
    render(<About />);
    expect(
      screen.getByText(/We're building the future of Kenyan technology/i)
    ).toBeInTheDocument();
  });

  it("should render all feature cards", () => {
    render(<About />);
    expect(screen.getByText("Build & Ship")).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByText("Win Big")).toBeInTheDocument();
    expect(screen.getByText("Learn & Grow")).toBeInTheDocument();
  });

  it("should have correct links for feature cards", () => {
    render(<About />);
    
    // Build & Ship -> /#register
    const buildCard = screen.getByText("Build & Ship").closest("a");
    expect(buildCard).toHaveAttribute("href", "/#register");

    // Network -> /judges-mentors
    const networkCard = screen.getByText("Network").closest("a");
    expect(networkCard).toHaveAttribute("href", "/judges-mentors");

    // Learn & Grow -> /#schedule
    const learnCard = screen.getByText("Learn & Grow").closest("a");
    expect(learnCard).toHaveAttribute("href", "/#schedule");

    // Win Big -> No link (div)
    const winCard = screen.getByText("Win Big").closest("a");
    expect(winCard).not.toBeInTheDocument();
    const winCardDiv = screen.getByText("Win Big").closest("div.block");
    expect(winCardDiv).toBeInTheDocument();
  });

  it("should render feature descriptions", () => {
    render(<About />);
    expect(
      screen.getByText(/36 hours to turn your ideas into working prototypes/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Connect with fellow developers, designers/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Compete for prizes, mentorship opportunities/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Workshops, talks, and hands-on sessions/i)
    ).toBeInTheDocument();
  });

  it("should render hackathon tracks section", () => {
    render(<About />);
    expect(screen.getByText("Hackathon Tracks")).toBeInTheDocument();
  });

  it("should render all track badges", () => {
    render(<About />);
    const tracks = [
      "FinTech",
      "HealthTech",
      "AgriTech",
      "EdTech",
      "Climate Tech",
      "Open Innovation",
    ];

    tracks.forEach((track) => {
      expect(screen.getByText(track)).toBeInTheDocument();
    });
  });

  it("should have correct section id for navigation", () => {
    const { container } = render(<About />);
    const section = container.querySelector("#about");
    expect(section).toBeInTheDocument();
  });
});


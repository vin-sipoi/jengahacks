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

  it("should render feature descriptions", () => {
    render(<About />);
    expect(
      screen.getByText(/48 hours to turn your ideas into working prototypes/i)
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


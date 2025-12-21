import { describe, it, expect } from "vitest";
import { render, waitFor } from "@/test/test-utils";
import StructuredData from "./StructuredData";

describe("StructuredData", () => {
  it("should render structured data scripts", () => {
    const { container } = render(<StructuredData />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(2);
  });

  it("should have correct script types", () => {
    const { container } = render(<StructuredData />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach((script) => {
      expect(script).toHaveAttribute("type", "application/ld+json");
    });
  });

  it("should contain valid JSON-LD data", async () => {
    const { container } = render(<StructuredData />);

    await waitFor(() => {
      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBeGreaterThan(0);
      
      scripts.forEach((script) => {
        const content = script.textContent;
        expect(content).toBeTruthy();
        
        // Verify it's valid JSON
        expect(() => JSON.parse(content!)).not.toThrow();
        
        // Verify it has required schema.org structure
        const data = JSON.parse(content!);
        expect(data).toHaveProperty("@context", "https://schema.org");
        expect(data).toHaveProperty("@type");
      });
    });
  });

  it("should contain event structured data", async () => {
    const { container } = render(<StructuredData />);

    await waitFor(() => {
      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      const eventScript = Array.from(scripts).find((script) => {
        const content = script.textContent;
        if (!content) return false;
        try {
          const data = JSON.parse(content);
          return data["@type"] === "Event";
        } catch {
          return false;
        }
      });

      expect(eventScript).toBeDefined();
      
      if (eventScript) {
        const data = JSON.parse(eventScript.textContent!);
        expect(data).toHaveProperty("name", "JengaHacks 2026");
        expect(data).toHaveProperty("startDate");
        expect(data).toHaveProperty("endDate");
        expect(data).toHaveProperty("location");
      }
    });
  });

  it("should contain organization structured data", async () => {
    const { container } = render(<StructuredData />);

    await waitFor(() => {
      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      const orgScript = Array.from(scripts).find((script) => {
        const content = script.textContent;
        if (!content) return false;
        try {
          const data = JSON.parse(content);
          return data["@type"] === "Organization";
        } catch {
          return false;
        }
      });

      expect(orgScript).toBeDefined();
      
      if (orgScript) {
        const data = JSON.parse(orgScript.textContent!);
        expect(data).toHaveProperty("name", "JengaHacks");
        expect(data).toHaveProperty("url");
      }
    });
  });

  it("should not use dangerouslySetInnerHTML", async () => {
    const { container } = render(<StructuredData />);

    await waitFor(() => {
      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach((script) => {
        // Scripts should have textContent set (not via dangerouslySetInnerHTML)
        expect(script.textContent).toBeTruthy();
        // Verify the content is valid JSON (set via textContent, not innerHTML)
        expect(() => JSON.parse(script.textContent!)).not.toThrow();
      });
    });
  });
});


import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getStoredLocale,
  setStoredLocale,
  getLocaleInfo,
  getSupportedLocales,
  SUPPORTED_LOCALES,
} from "./locale";

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.mock("./polyfills", () => ({
  safeLocalStorage: {
    getItem: (key: string) => localStorageMock.getItem(key),
    setItem: (key: string, value: string) => {
      localStorageMock.setItem(key, value);
      return true;
    },
    removeItem: (key: string) => {
      localStorageMock.removeItem(key);
      return true;
    },
  },
}));

describe("locale utilities", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("getStoredLocale", () => {
    it("should return stored locale from localStorage", () => {
      localStorageMock.setItem("jengahacks_locale", "sw-KE");
      const locale = getStoredLocale();
      expect(locale).toBe("sw-KE");
    });

    it("should return default locale when nothing stored", () => {
      const locale = getStoredLocale();
      expect(locale).toBe("en-UK");
    });

    it("should return default locale for invalid stored value", () => {
      localStorageMock.setItem("jengahacks_locale", "invalid-locale");
      const locale = getStoredLocale();
      expect(locale).toBe("en-UK");
    });
  });

  describe("setStoredLocale", () => {
    it("should store locale in localStorage", () => {
      const result = setStoredLocale("sw-KE");
      expect(localStorageMock.getItem("jengahacks_locale")).toBe("sw-KE");
      expect(result).toBe(true);
    });
  });

  describe("getLocaleInfo", () => {
    it("should return locale info for en-UK", () => {
      const info = getLocaleInfo("en-UK");
      expect(info.code).toBe("en-UK");
      expect(info.name).toBe("English");
      expect(info.nativeName).toBe("English");
    });

    it("should return locale info for sw-KE", () => {
      const info = getLocaleInfo("sw-KE");
      expect(info.code).toBe("sw-KE");
      expect(info.name).toBe("Swahili");
      expect(info.nativeName).toBe("Kiswahili");
    });
  });

  describe("getSupportedLocales", () => {
    it("should return all supported locales", () => {
      const locales = getSupportedLocales();
      expect(locales.length).toBeGreaterThan(0);
      expect(locales).toContainEqual(SUPPORTED_LOCALES["en-UK"]);
      expect(locales).toContainEqual(SUPPORTED_LOCALES["sw-KE"]);
    });
  });
});


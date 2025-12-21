/**
 * Browser compatibility polyfills and feature detection
 * This file ensures compatibility with older browsers
 */

/**
 * Check if a feature is supported
 */
export const isFeatureSupported = {
  localStorage: (): boolean => {
    try {
      const test = "__localStorage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },
  sessionStorage: (): boolean => {
    try {
      const test = "__sessionStorage_test__";
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },
  blob: (): boolean => {
    return typeof Blob !== "undefined";
  },
  url: (): boolean => {
    return typeof URL !== "undefined" && typeof URL.createObjectURL === "function";
  },
  fetch: (): boolean => {
    return typeof fetch !== "undefined";
  },
  intersectionObserver: (): boolean => {
    return typeof IntersectionObserver !== "undefined";
  },
  arrayIncludes: (): boolean => {
    return Array.prototype.includes !== undefined;
  },
  objectEntries: (): boolean => {
    return typeof Object.entries === "function";
  },
  objectValues: (): boolean => {
    return typeof Object.values === "function";
  },
  promise: (): boolean => {
    return typeof Promise !== "undefined";
  },
};

/**
 * Safe localStorage wrapper with fallback
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isFeatureSupported.localStorage()) {
      console.warn("localStorage is not supported");
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("localStorage.getItem error:", error);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (!isFeatureSupported.localStorage()) {
      console.warn("localStorage is not supported");
      return false;
    }
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error("localStorage.setItem error:", error);
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    if (!isFeatureSupported.localStorage()) {
      return false;
    }
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("localStorage.removeItem error:", error);
      return false;
    }
  },
};

/**
 * Safe sessionStorage wrapper with fallback
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (!isFeatureSupported.sessionStorage()) {
      console.warn("sessionStorage is not supported");
      return null;
    }
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error("sessionStorage.getItem error:", error);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (!isFeatureSupported.sessionStorage()) {
      console.warn("sessionStorage is not supported");
      return false;
    }
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error("sessionStorage.setItem error:", error);
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    if (!isFeatureSupported.sessionStorage()) {
      return false;
    }
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("sessionStorage.removeItem error:", error);
      return false;
    }
  },
};

/**
 * Safe URL.createObjectURL with cleanup
 */
export const createObjectURL = (blob: Blob): string | null => {
  if (!isFeatureSupported.url()) {
    console.error("URL.createObjectURL is not supported");
    return null;
  }
  try {
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("URL.createObjectURL error:", error);
    return null;
  }
};

/**
 * Safe URL.revokeObjectURL
 */
export const revokeObjectURL = (url: string): void => {
  if (!isFeatureSupported.url()) {
    return;
  }
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("URL.revokeObjectURL error:", error);
  }
};

/**
 * Array.includes polyfill for older browsers
 */
if (!Array.prototype.includes) {
  Array.prototype.includes = function (searchElement: any, fromIndex?: number): boolean {
    const O = Object(this);
    const len = parseInt(String(O.length)) || 0;
    if (len === 0) {
      return false;
    }
    const n = fromIndex !== undefined ? fromIndex : 0;
    let k = n >= 0 ? n : Math.max(len + n, 0);
    function sameValueZero(x: any, y: any): boolean {
      return (
        x === y ||
        (typeof x === "number" && typeof y === "number" && isNaN(x) && isNaN(y))
      );
    }
    while (k < len) {
      if (sameValueZero(O[k], searchElement)) {
        return true;
      }
      k++;
    }
    return false;
  };
}

/**
 * Object.entries polyfill for older browsers
 */
if (!Object.entries) {
  Object.entries = function <T extends Record<string, any>>(obj: T): [string, any][] {
    const ownProps = Object.keys(obj);
    let i = ownProps.length;
    const resArray = new Array(i);
    while (i--) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }
    return resArray;
  };
}

/**
 * Object.values polyfill for older browsers
 */
if (!Object.values) {
  Object.values = function <T extends Record<string, any>>(obj: T): any[] {
    const ownProps = Object.keys(obj);
    let i = ownProps.length;
    const resArray = new Array(i);
    while (i--) {
      resArray[i] = obj[ownProps[i]];
    }
    return resArray;
  };
}

/**
 * String.includes polyfill for older browsers
 */
if (!String.prototype.includes) {
  String.prototype.includes = function (search: string, start?: number): boolean {
    if (typeof start !== "number") {
      start = 0;
    }
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

/**
 * String.startsWith polyfill for older browsers
 */
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (searchString: string, position?: number): boolean {
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };
}

/**
 * String.endsWith polyfill for older browsers
 */
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (searchString: string, length?: number): boolean {
    if (length === undefined || length > this.length) {
      length = this.length;
    }
    return this.substring(length - searchString.length, length) === searchString;
  };
}

/**
 * Array.from polyfill for older browsers (basic implementation)
 */
if (!Array.from) {
  Array.from = function <T>(arrayLike: ArrayLike<T> | Iterable<T>): T[] {
    if (arrayLike == null) {
      throw new TypeError("Array.from requires an array-like object");
    }
    const items = Object(arrayLike);
    const len = parseInt(items.length) || 0;
    const A = new Array(len);
    let k = 0;
    while (k < len) {
      const kValue = items[k];
      A[k] = kValue;
      k += 1;
    }
    return A;
  };
}


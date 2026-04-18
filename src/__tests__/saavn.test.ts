import { describe, it, expect } from "vitest";
import CryptoJS from "crypto-js";
import { decryptUrl } from "@/lib/saavn";

// Generate a valid encrypted URL for testing
// Key is "38346591" using DES-ECB (the JioSaavn standard)
const DES_KEY = CryptoJS.enc.Utf8.parse("38346591");
const KNOWN_URL = "https://aac.saavncdn.com/123/abc_96.mp4";

function encryptForTest(plaintext: string): string {
  const encrypted = CryptoJS.DES.encrypt(plaintext, DES_KEY, {
    mode: CryptoJS.mode.ECB,
  });
  return encrypted.toString(); // base64 output
}

describe("saavn lib", () => {
  describe("decryptUrl", () => {
    it("round-trips a known plaintext URL", () => {
      const encrypted = encryptForTest(KNOWN_URL);
      const result = decryptUrl(encrypted);
      expect(result).toBe(KNOWN_URL);
    });

    it("returns a non-empty string for valid ciphertext", () => {
      const encrypted = encryptForTest("https://test.example.com/abc_96.mp4");
      const result = decryptUrl(encrypted);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("handles saavn-style URLs with the _96 suffix", () => {
      const url = "https://aac.saavncdn.com/files/abc123_96.mp4";
      const encrypted = encryptForTest(url);
      const result = decryptUrl(encrypted);
      expect(result).toContain("saavncdn.com");
      expect(result).toContain("_96");
    });
  });
});

// decodeEntities is private — test the logic via re-implementation
describe("decodeEntities logic", () => {
  function decodeEntities(str: string): string {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");
  }

  it("decodes &amp;", () => {
    expect(decodeEntities("Rock &amp; Roll")).toBe("Rock & Roll");
  });

  it("decodes &lt; and &gt;", () => {
    expect(decodeEntities("a &lt; b &gt; c")).toBe("a < b > c");
  });

  it("decodes &quot;", () => {
    expect(decodeEntities("&quot;hello&quot;")).toBe('"hello"');
  });

  it("decodes &#39;", () => {
    expect(decodeEntities("it&#39;s")).toBe("it's");
  });

  it("decodes &nbsp;", () => {
    expect(decodeEntities("hello&nbsp;world")).toBe("hello world");
  });

  it("decodes multiple entities in one string", () => {
    expect(decodeEntities("A &amp; B &lt; C")).toBe("A & B < C");
  });

  it("returns unchanged string without entities", () => {
    expect(decodeEntities("normal text")).toBe("normal text");
  });
});

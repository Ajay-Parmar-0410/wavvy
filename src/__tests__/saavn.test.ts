import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import CryptoJS from "crypto-js";
import { decryptUrl, getArtistById } from "@/lib/saavn";

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

describe("getArtistById — feedback #3 (artist page parity)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const mockFetchOnce = (payload: unknown) => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    }) as unknown as typeof fetch;
  };

  it("accepts responses that expose `id` instead of `artistId`", async () => {
    mockFetchOnce({
      id: "459320",
      name: "Arijit Singh",
      image: "http://c.saavncdn.com/artist/a_150x150.jpg",
      topSongs: [],
      topAlbums: [],
    });
    const result = await getArtistById("459320");
    expect(result).not.toBeNull();
    expect(result?.artist.name).toBe("Arijit Singh");
    expect(result?.artist.id).toBe("459320");
  });

  it("accepts responses that expose `artistId` (legacy shape)", async () => {
    mockFetchOnce({
      artistId: "459320",
      name: "Arijit Singh",
      image: "http://c.saavncdn.com/artist/a_150x150.jpg",
      topSongs: [],
      topAlbums: [],
    });
    const result = await getArtistById("459320");
    expect(result).not.toBeNull();
    expect(result?.artist.id).toBe("459320");
  });

  it("surfaces albums so the UI can render them (Arijit case)", async () => {
    mockFetchOnce({
      id: "459320",
      name: "Arijit Singh",
      image: "http://c.saavncdn.com/artist/a_150x150.jpg",
      topSongs: [],
      topAlbums: [
        {
          id: "alb-1",
          title: "Kalank",
          subtitle: "Arijit Singh",
          image: "http://c.saavncdn.com/albums/k_150x150.jpg",
          year: "2019",
        },
        {
          id: "alb-2",
          title: "Aashiqui 2",
          subtitle: "Arijit Singh",
          image: "http://c.saavncdn.com/albums/a_150x150.jpg",
          year: "2013",
        },
      ],
    });
    const result = await getArtistById("459320");
    expect(result?.topAlbums).toHaveLength(2);
    expect(result?.topAlbums[0].name).toBe("Kalank");
  });

  it("normalises singles and similarArtists when present", async () => {
    mockFetchOnce({
      id: "459320",
      name: "Arijit Singh",
      image: "",
      topSongs: [],
      topAlbums: [],
      singles: [
        { id: "s-1", title: "Channa Mereya", image: "", subtitle: "Arijit Singh" },
      ],
      similarArtists: [
        { id: "art-2", name: "Atif Aslam", image: "" },
      ],
    });
    const result = await getArtistById("459320");
    expect(result?.singles).toHaveLength(1);
    expect(result?.singles[0].name).toBe("Channa Mereya");
    expect(result?.similarArtists).toHaveLength(1);
    expect(result?.similarArtists[0].name).toBe("Atif Aslam");
  });

  it("returns null for clearly-empty responses (no id, no name)", async () => {
    mockFetchOnce({});
    const result = await getArtistById("bogus");
    expect(result).toBeNull();
  });
});

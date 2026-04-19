"use client";

/**
 * Dominant-color extraction — uses an offscreen canvas so we don't pull in
 * a heavyweight color library. Returns a CSS `rgb(...)` string that is safe
 * to drop into a gradient. Falls back to the Spotify-grey card colour on any
 * failure (CORS, missing image, SSR).
 */
export async function getDominantColor(
  imageUrl: string,
  fallback = "rgb(40, 40, 40)"
): Promise<string> {
  if (typeof window === "undefined") return fallback;
  if (!imageUrl) return fallback;

  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 24; // tiny — we only need an average
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(fallback);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 200) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        if (count === 0) {
          resolve(fallback);
          return;
        }
        // Darken slightly — Spotify's gradient target is muted, not saturated.
        const factor = 0.7;
        const dr = Math.round((r / count) * factor);
        const dg = Math.round((g / count) * factor);
        const db = Math.round((b / count) * factor);
        resolve(`rgb(${dr}, ${dg}, ${db})`);
      } catch {
        resolve(fallback);
      }
    };
    img.onerror = () => resolve(fallback);
    img.src = imageUrl;
  });
}

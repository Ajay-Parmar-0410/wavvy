import { describe, it, expect, vi } from "vitest";
import {
  formatTime,
  formatDuration,
  truncate,
  generateId,
  debounce,
  shuffleArray,
  cn,
} from "@/lib/utils";

describe("formatTime", () => {
  it("formats 0 seconds", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  it("formats seconds under a minute", () => {
    expect(formatTime(45)).toBe("0:45");
  });

  it("formats full minutes", () => {
    expect(formatTime(120)).toBe("2:00");
  });

  it("formats minutes and seconds", () => {
    expect(formatTime(185)).toBe("3:05");
  });

  it("pads single-digit seconds", () => {
    expect(formatTime(61)).toBe("1:01");
  });

  it("handles NaN", () => {
    expect(formatTime(NaN)).toBe("0:00");
  });

  it("handles Infinity", () => {
    expect(formatTime(Infinity)).toBe("0:00");
  });

  it("handles negative values", () => {
    expect(formatTime(-10)).toBe("0:00");
  });

  it("handles large values (10+ minutes)", () => {
    expect(formatTime(625)).toBe("10:25");
  });
});

describe("formatDuration", () => {
  it("formats under one hour", () => {
    expect(formatDuration(185)).toBe("3:05");
  });

  it("formats exactly one hour", () => {
    expect(formatDuration(3600)).toBe("1:00:00");
  });

  it("formats hours, minutes, seconds", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0:00");
  });

  it("handles NaN", () => {
    expect(formatDuration(NaN)).toBe("0:00");
  });

  it("handles negative", () => {
    expect(formatDuration(-100)).toBe("0:00");
  });
});

describe("truncate", () => {
  it("returns string unchanged if under max length", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns string unchanged if exactly max length", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates with ellipsis when over max length", () => {
    expect(truncate("hello world", 8)).toBe("hello w\u2026");
  });

  it("handles empty string", () => {
    expect(truncate("", 5)).toBe("");
  });
});

describe("generateId", () => {
  it("returns a string", () => {
    expect(typeof generateId()).toBe("string");
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("contains a hyphen separator", () => {
    expect(generateId()).toContain("-");
  });
});

describe("debounce", () => {
  it("delays function execution", async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("resets timer on repeated calls", async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced(); // should reset
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("passes arguments to the function", async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("a", "b");
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith("a", "b");

    vi.useRealTimers();
  });
});

describe("shuffleArray", () => {
  it("returns array of same length", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr)).toHaveLength(5);
  });

  it("contains all original elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });

  it("handles empty array", () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it("handles single element", () => {
    expect(shuffleArray([1])).toEqual([1]);
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges tailwind conflicts (last wins)", () => {
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useToastStore, toast } from "@/stores/toastStore";

describe("toastStore", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("addToast", () => {
    it("adds a toast with default type and duration", () => {
      useToastStore.getState().addToast("Hello");
      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe("Hello");
      expect(toasts[0].type).toBe("info");
      expect(toasts[0].duration).toBe(3000);
    });

    it("adds a toast with custom type", () => {
      useToastStore.getState().addToast("Error!", "error");
      expect(useToastStore.getState().toasts[0].type).toBe("error");
    });

    it("adds a toast with custom duration", () => {
      useToastStore.getState().addToast("Quick", "info", 1000);
      expect(useToastStore.getState().toasts[0].duration).toBe(1000);
    });

    it("auto-removes toast after duration", () => {
      useToastStore.getState().addToast("Temp", "info", 2000);
      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(2000);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it("can add multiple toasts", () => {
      useToastStore.getState().addToast("First");
      useToastStore.getState().addToast("Second");
      useToastStore.getState().addToast("Third");
      expect(useToastStore.getState().toasts).toHaveLength(3);
    });

    it("assigns unique IDs to toasts", () => {
      useToastStore.getState().addToast("First");
      useToastStore.getState().addToast("Second");
      const toasts = useToastStore.getState().toasts;
      expect(toasts[0].id).not.toBe(toasts[1].id);
    });
  });

  describe("removeToast", () => {
    it("removes a specific toast by ID", () => {
      useToastStore.getState().addToast("Keep");
      useToastStore.getState().addToast("Remove");
      const toasts = useToastStore.getState().toasts;
      const removeId = toasts[1].id;

      useToastStore.getState().removeToast(removeId);
      expect(useToastStore.getState().toasts).toHaveLength(1);
      expect(useToastStore.getState().toasts[0].message).toBe("Keep");
    });

    it("does nothing for non-existent ID", () => {
      useToastStore.getState().addToast("Stays");
      useToastStore.getState().removeToast("fake-id");
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe("convenience functions", () => {
    it("toast.success creates success toast", () => {
      toast.success("Done!");
      const toasts = useToastStore.getState().toasts;
      expect(toasts[0].type).toBe("success");
      expect(toasts[0].message).toBe("Done!");
    });

    it("toast.error creates error toast", () => {
      toast.error("Fail!");
      expect(useToastStore.getState().toasts[0].type).toBe("error");
    });

    it("toast.info creates info toast", () => {
      toast.info("FYI");
      expect(useToastStore.getState().toasts[0].type).toBe("info");
    });
  });
});

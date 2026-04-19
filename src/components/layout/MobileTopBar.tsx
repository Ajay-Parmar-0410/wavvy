"use client";

import { usePathname } from "next/navigation";
import { Music2 } from "lucide-react";
import { useMobileUiStore } from "@/stores/mobileUiStore";

function getTitle(pathname: string): string | null {
  if (pathname === "/") return null;
  if (pathname.startsWith("/search")) return "Search";
  if (pathname.startsWith("/library")) return "Your Library";
  if (pathname.startsWith("/history")) return "Recently played";
  if (pathname.startsWith("/downloads")) return "Downloads";
  return null;
}

export default function MobileTopBar() {
  const pathname = usePathname();
  const openProfileDrawer = useMobileUiStore((s) => s.openProfileDrawer);

  const title = getTitle(pathname);

  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-bg-primary flex-shrink-0">
      <button
        type="button"
        onClick={openProfileDrawer}
        aria-label="Open profile menu"
        className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-secondary to-accent-primary flex items-center justify-center flex-shrink-0"
      >
        <Music2 className="w-4 h-4 text-white" />
      </button>

      {title ? (
        <h1 className="font-heading text-xl font-bold text-text-primary truncate">
          {title}
        </h1>
      ) : (
        <span className="sr-only">Home</span>
      )}
    </header>
  );
}

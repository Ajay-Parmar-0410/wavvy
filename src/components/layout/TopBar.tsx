"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Home, Bell, Users, Download as DownloadIcon } from "lucide-react";
import SearchBar from "./SearchBar";
import { cn } from "@/lib/utils";

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isHome = pathname === "/";

  return (
    <header
      className="hidden md:flex items-center gap-4 px-4 flex-shrink-0 bg-bg-primary"
      style={{ height: "var(--topbar-height)" }}
    >
      {/* Back/forward */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-text-primary hover:bg-black/80 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => router.forward()}
          aria-label="Go forward"
          className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-text-primary hover:bg-black/80 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Home + search */}
      <div className="flex items-center gap-2 flex-1 max-w-2xl">
        <Link
          href="/"
          aria-label="Home"
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
            isHome
              ? "bg-bg-hover text-text-primary"
              : "bg-bg-tertiary text-text-primary hover:bg-bg-hover"
          )}
        >
          <Home className="w-6 h-6 fill-current" />
        </Link>
        <div className="flex-1">
          <SearchBar />
        </div>
      </div>

      {/* Right: stubs for notifications / friends / install / avatar */}
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="What's new"
          className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
        >
          <Bell className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Friend activity"
          className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
        >
          <Users className="w-5 h-5" />
        </button>
        <Link
          href="/downloads"
          aria-label="Install app"
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-tertiary text-text-primary text-xs font-semibold hover:bg-bg-hover transition-colors"
        >
          <DownloadIcon className="w-4 h-4" />
          Install App
        </Link>
        <div
          aria-label="Account"
          className="w-8 h-8 rounded-full bg-accent-primary text-bg-primary text-xs font-bold flex items-center justify-center"
        >
          W
        </div>
      </div>
    </header>
  );
}

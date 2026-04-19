"use client";

import Link from "next/link";
import { Music2 } from "lucide-react";
import SearchBar from "./SearchBar";

export default function MobileTopBar() {
  return (
    <header className="md:hidden flex items-center gap-3 px-3 py-2 bg-bg-primary border-b border-border flex-shrink-0">
      <Link
        href="/"
        aria-label="Home"
        className="flex items-center gap-2 flex-shrink-0"
      >
        <Music2 className="w-6 h-6 text-accent-primary" />
        <span className="font-heading text-base font-bold text-text-primary">
          Wavvy
        </span>
      </Link>
      <div className="flex-1">
        <SearchBar />
      </div>
    </header>
  );
}

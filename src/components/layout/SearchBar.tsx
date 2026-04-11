"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) {
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [query, router]
  );

  const handleClear = useCallback(() => {
    setQuery("");
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2.5 bg-bg-tertiary border transition-colors",
          isFocused ? "border-accent-primary/50" : "border-transparent"
        )}
      >
        <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search songs, albums, artists..."
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}

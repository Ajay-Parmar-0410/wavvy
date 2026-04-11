"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Download, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
  { href: "/downloads", label: "Downloads", icon: Download },
  { href: "/history", label: "More", icon: MoreHorizontal },
] as const;

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary border-t border-border">
      <div className="flex items-center justify-around h-[var(--mobile-nav-height)]">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-accent-primary"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

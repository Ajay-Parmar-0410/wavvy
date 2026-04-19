"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileUiStore } from "@/stores/mobileUiStore";

interface NavItem {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: (pathname: string) => boolean;
  onClick?: () => void;
}

export default function MobileNav() {
  const pathname = usePathname();
  const openCreateSheet = useMobileUiStore((s) => s.openCreateSheet);

  const items: NavItem[] = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      isActive: (p) => p === "/",
    },
    {
      href: "/search",
      label: "Search",
      icon: Search,
      isActive: (p) => p.startsWith("/search"),
    },
    {
      href: "/library",
      label: "Your Library",
      icon: Library,
      isActive: (p) => p.startsWith("/library") || p.startsWith("/playlist"),
    },
    {
      label: "Create",
      icon: Plus,
      onClick: openCreateSheet,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary border-t border-border">
      <div className="flex items-center justify-around h-[var(--mobile-nav-height)]">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.isActive?.(pathname) ?? false;
          const classes = cn(
            "flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors flex-1",
            active
              ? "text-text-primary"
              : "text-text-muted hover:text-text-secondary"
          );
          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className={classes}>
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          }
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={classes}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  Sparkles,
  Bell,
  Activity,
  Clock,
  Rss,
  Settings,
  Music2,
} from "lucide-react";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DrawerItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  badge?: string;
  onClick?: () => void;
}

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const items: DrawerItem[] = [
    { icon: Sparkles, label: "Your Premium", href: "#" },
    { icon: Bell, label: "What's new", href: "#" },
    { icon: Activity, label: "Your Sound Capsule", href: "#", badge: "New" },
    { icon: Clock, label: "Recents", href: "/history" },
    { icon: Rss, label: "Your Updates", href: "#" },
    { icon: Settings, label: "Settings and privacy", href: "#" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[80] bg-black/60"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            className="md:hidden fixed top-0 left-0 bottom-0 z-[81] w-[86%] max-w-sm bg-bg-secondary flex flex-col"
            role="dialog"
            aria-label="Profile menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-secondary to-accent-primary flex items-center justify-center flex-shrink-0">
                  <Music2 className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-text-primary truncate">
                    You
                  </p>
                  <p className="text-xs text-text-secondary">View profile</p>
                </div>
              </Link>
              <button
                onClick={onClose}
                className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account picker row */}
            <button
              className="flex items-center justify-between w-full px-5 py-3 mt-1 hover:bg-bg-tertiary/40 transition-colors"
              type="button"
            >
              <span className="text-sm text-text-primary font-medium">
                Add account
              </span>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </button>

            <div className="h-px bg-border mx-5 my-2" />

            {/* Menu items */}
            <nav className="flex-1 overflow-y-auto pb-4">
              {items.map(({ icon: Icon, label, href, badge }) => {
                const content = (
                  <span className="flex items-center justify-between w-full px-5 py-3 hover:bg-bg-tertiary/40 transition-colors">
                    <span className="flex items-center gap-4 min-w-0">
                      <Icon className="w-5 h-5 text-text-secondary flex-shrink-0" />
                      <span className="text-sm text-text-primary truncate">
                        {label}
                      </span>
                    </span>
                    {badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-accent-primary text-bg-primary flex-shrink-0 ml-2">
                        {badge}
                      </span>
                    )}
                  </span>
                );
                return href ? (
                  <Link key={label} href={href} onClick={onClose}>
                    {content}
                  </Link>
                ) : (
                  <button key={label} type="button" className="w-full text-left">
                    {content}
                  </button>
                );
              })}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

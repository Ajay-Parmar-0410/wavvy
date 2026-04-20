"use client";

import { useEffect, useRef } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface PlaylistOptionsMenuProps {
  isOpen: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onEditDetails: () => void;
  onDelete: () => void;
}

export default function PlaylistOptionsMenu({
  isOpen,
  anchorRect,
  onClose,
  onEditDetails,
  onDelete,
}: PlaylistOptionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !anchorRect) return null;

  const menuWidth = 220;
  const estimatedMenuHeight = 100;
  let left = anchorRect.left;
  let top = anchorRect.bottom + 6;

  if (typeof window !== "undefined") {
    if (left + menuWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - menuWidth - 8);
    }
    if (top + estimatedMenuHeight > window.innerHeight - 8) {
      top = Math.max(8, anchorRect.top - estimatedMenuHeight - 6);
    }
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      style={{ position: "fixed", top, left, width: menuWidth, zIndex: 80 }}
      className="rounded-md bg-bg-secondary border border-border shadow-xl py-1"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onEditDetails();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary transition-colors"
      >
        <Pencil className="w-4 h-4" />
        Edit details
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
}

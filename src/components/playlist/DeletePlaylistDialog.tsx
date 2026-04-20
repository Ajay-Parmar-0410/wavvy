"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface DeletePlaylistDialogProps {
  isOpen: boolean;
  playlistName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeletePlaylistDialog({
  isOpen,
  playlistName,
  onClose,
  onConfirm,
}: DeletePlaylistDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-playlist-title"
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-[81] w-full max-w-sm bg-bg-secondary rounded-xl border border-border p-6 shadow-2xl text-center"
          >
            <h3
              id="delete-playlist-title"
              className="font-heading text-lg font-semibold text-text-primary mb-2"
            >
              Delete from Your Library?
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              This will delete <strong>{playlistName}</strong> from Your
              Library.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-sm font-medium text-text-primary bg-bg-tertiary hover:bg-bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 rounded-full text-sm font-medium bg-danger text-white hover:brightness-110 transition-all"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

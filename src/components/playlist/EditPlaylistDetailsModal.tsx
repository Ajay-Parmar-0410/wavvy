"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Music, X } from "lucide-react";

interface EditPlaylistDetailsModalProps {
  isOpen: boolean;
  initialName: string;
  initialDescription?: string;
  coverUrl?: string;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => void | Promise<void>;
}

export default function EditPlaylistDetailsModal({
  isOpen,
  initialName,
  initialDescription,
  coverUrl,
  onClose,
  onSave,
}: EditPlaylistDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription ?? "");
    }
  }, [isOpen, initialName, initialDescription]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSave({ name: trimmed, description: description.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-playlist-title"
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
            className="relative z-[81] w-full max-w-md bg-bg-secondary rounded-xl border border-border p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                id="edit-playlist-title"
                className="font-heading text-lg font-semibold text-text-primary"
              >
                Edit details
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="relative w-32 h-32 rounded-md overflow-hidden bg-bg-tertiary flex-shrink-0">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt="Playlist cover"
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-10 h-10 text-text-muted" />
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Playlist name"
                  maxLength={100}
                  className="w-full px-3 py-2.5 rounded-md bg-bg-tertiary border border-border text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-accent-primary/50 transition-colors"
                  autoFocus
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add an optional description"
                  rows={4}
                  maxLength={300}
                  className="w-full px-3 py-2.5 rounded-md bg-bg-tertiary border border-border text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-accent-primary/50 transition-colors resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || !name.trim()}
                    className="px-5 py-2 rounded-full text-sm font-semibold bg-text-primary text-bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

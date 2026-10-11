"use client";

import { useEffect } from "react";

// Bottom sheet on phones, centered dialog on wider screens.
export default function Sheet({ open, onClose, label, children, className = "" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="scrim-in fixed inset-0 z-50 flex items-end justify-center bg-scrim/60 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`sheet-in flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-mist/70 bg-paper shadow-lift sm:rounded-3xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-mist sm:hidden" />
        {children}
      </div>
    </div>
  );
}

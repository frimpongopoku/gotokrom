"use client";

import { useEffect, useState } from "react";

export default function ShareSheet({ open, onClose, autoMessage }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const blobId = localStorage.getItem("our-list:blobId");
    if (blobId) {
      setUrl(`${window.location.origin}/?list=${blobId}`);
    }
  }, [open]);

  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      /* clipboard unavailable */
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Our List", text: "Join our shared shopping list", url });
      } catch (err) {
        /* user cancelled */
      }
    } else {
      copy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="torn-top w-full max-w-md rounded-t-2xl bg-paper px-5 pb-7 pt-6 shadow-lift sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-2xl">🧺</div>
        <h2 className="font-display text-xl font-bold text-ink">
          {autoMessage ? "Your list is ready" : "Share this list"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-inkSoft">
          {autoMessage
            ? "Send this link to your partner so their phone stays in sync with yours."
            : "Anyone with this link can view and edit the list — no account needed."}
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-card border border-mist bg-paperDim px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-inkSoft">{url || "…"}</span>
          <button
            onClick={copy}
            className="shrink-0 rounded-lg bg-pine px-3 py-1.5 text-xs font-bold text-paper transition active:scale-95"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={share}
            className="flex-1 rounded-card bg-ink py-3 text-sm font-bold text-paper transition active:scale-[0.98]"
          >
            Share link
          </button>
          <button
            onClick={onClose}
            className="rounded-card border border-mist px-5 py-3 text-sm font-bold text-ink transition active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

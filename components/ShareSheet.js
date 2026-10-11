"use client";

import { useEffect, useState } from "react";
import Sheet from "./Sheet";

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
        await navigator.share({ title: "Pokah Groceries", text: "Join our shared shopping list", url });
      } catch (err) {
        /* user cancelled */
      }
    } else {
      copy();
    }
  };

  return (
    <Sheet open={open} onClose={onClose} label="Share this list">
      <div className="px-5 pb-6 pt-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
          {autoMessage ? "Your list is ready" : "Share this list"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-inkSoft">
          {autoMessage
            ? "Send this link to your partner so their phone stays in sync with yours."
            : "Anyone with this link can view and edit the list — no account needed."}
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-mist bg-surface py-2 pl-4 pr-2">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-inkSoft">{url || "…"}</span>
          <button onClick={copy} className="press shrink-0 rounded-xl border border-mist bg-paperDim px-3 py-2 text-xs font-bold text-ink">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={share} className="press flex-1 rounded-2xl bg-pine py-3.5 text-[15px] font-bold text-paper">
            Share link
          </button>
          <button onClick={onClose} className="press rounded-2xl border border-mist px-5 py-3.5 text-[15px] font-bold text-ink">
            Done
          </button>
        </div>
      </div>
    </Sheet>
  );
}

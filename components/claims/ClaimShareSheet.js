"use client";

import { useEffect, useState } from "react";
import Sheet from "../Sheet";
import { useShop } from "@/lib/store";
import { claimTotal, fmt } from "@/lib/money";

export function reviewUrl(blobId, ids) {
  if (typeof window === "undefined" || !blobId || !ids.length) return "";
  return `${window.location.origin}/review/${ids.join(",")}?list=${blobId}`;
}

// Sends one or more claims for review. With a single claim, the other unpaid
// ones can ride along in the same link so it's one message, not five.
export default function ClaimShareSheet({ open, claims, onClose, onDownload }) {
  const { blobId, data } = useShop();
  const [copied, setCopied] = useState(false);
  const [bundle, setBundle] = useState(false);

  const others = (data.claims || []).filter((c) => !c.paidAt && !claims.some((x) => x.id === c.id));
  const canBundle = claims.length === 1 && others.length > 0;
  const included = canBundle && bundle ? [...claims, ...others] : claims;
  const total = included.reduce((s, c) => s + claimTotal(c), 0);
  const url = reviewUrl(blobId, included.map((c) => c.id));

  useEffect(() => {
    if (open) {
      setCopied(false);
      setBundle(false);
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

  const message =
    included.length === 1
      ? `Claim: ${included[0].title} — ${fmt(total)}. Review and pay here:`
      : `${included.length} claims — ${fmt(total)} in total. Review and pay here:`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Claim to review", text: message, url });
      } catch (err) {
        /* user cancelled */
      }
    } else {
      copy();
    }
  };

  return (
    <Sheet open={open} onClose={onClose} label="Send for review">
      <div className="overflow-y-auto px-5 pb-6 pt-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Send for review</h2>
        <p className="mt-1 text-sm leading-relaxed text-inkSoft">
          They open the link, check the items, and mark it paid. No sign-in needed.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-mist bg-surface">
          <div className="flex items-end justify-between gap-3 bg-ink px-4 py-3 text-paper">
            <div className="min-w-0">
              <p className="truncate text-xs opacity-70">{included.length === 1 ? included[0].title : `${included.length} claims`}</p>
              <p className="font-display text-lg font-bold">
                {included.reduce((n, c) => n + c.items.length, 0)} items
              </p>
            </div>
            <p className="font-mono text-2xl font-bold">{fmt(total)}</p>
          </div>
          <div className="flex items-center gap-2 py-2 pl-4 pr-2">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-inkSoft">{url || "…"}</span>
            <button onClick={copy} className="press shrink-0 rounded-xl border border-mist bg-paperDim px-3 py-2 text-xs font-bold text-ink">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {canBundle && (
          <button
            type="button"
            role="switch"
            aria-checked={bundle}
            onClick={() => setBundle((b) => !b)}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-mist bg-surface px-4 py-3 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">
                Include the {others.length} other unpaid claim{others.length === 1 ? "" : "s"}
              </span>
              <span className="block text-xs text-inkSoft">One link for everything outstanding</span>
            </span>
            <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${bundle ? "bg-pine" : "bg-mist"}`}>
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-paper shadow transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  bundle ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button onClick={share} className="press flex items-center justify-center gap-2 rounded-2xl bg-pine py-3.5 text-[15px] font-bold text-paper">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Share link
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onDownload(included)}
              className="press rounded-2xl border border-mist py-3.5 text-[15px] font-bold text-ink hover:bg-surface"
            >
              Download PDF
            </button>
            <button onClick={onClose} className="press rounded-2xl border border-mist py-3.5 text-[15px] font-bold text-ink hover:bg-surface">
              Done
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

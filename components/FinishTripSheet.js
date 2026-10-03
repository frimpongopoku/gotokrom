"use client";

import { useEffect } from "react";
import { fmt } from "@/lib/money";

// Finishing a trip is a deliberate step, so it asks first and shows what's
// still unchecked before closing the trip.
export default function FinishTripSheet({ open, trip, inCart, planned, onConfirm, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const total = trip.items.length;
  const checked = trip.items.filter((i) => i.checked).length;
  const left = total - checked;

  return (
    <div className="scrim-in fixed inset-0 z-50 flex items-end justify-center bg-scrim/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-trip-title"
        className="sheet-in torn-top w-full max-w-md rounded-t-2xl bg-paper px-5 pb-6 pt-3 shadow-lift sm:rounded-card sm:pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-mist sm:hidden" />

        <h2 id="finish-trip-title" className="font-display text-xl font-bold text-ink">
          Finish this trip?
        </h2>
        <p className="mt-1 text-sm text-inkSoft">
          The trip is marked done and you can't add to it anymore. You can reopen it later if you need to.
        </p>

        <dl className="mt-4 space-y-2 rounded-card border border-dashed border-mist px-4 py-3">
          <div className="flex items-baseline justify-between">
            <dt className="text-sm text-inkSoft">Checked off</dt>
            <dd className="font-mono text-sm font-bold text-ink">
              {checked} of {total}
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-sm text-inkSoft">In cart</dt>
            <dd className="font-mono text-sm font-bold text-pineDark">
              {fmt(inCart)} <span className="font-normal text-inkSoft">of {fmt(planned)}</span>
            </dd>
          </div>
        </dl>

        {left > 0 && (
          <p className="mt-3 rounded-card bg-yolk/15 px-3 py-2 text-[13px] text-yolkDark">
            {left} item{left === 1 ? " isn't" : "s aren't"} checked off yet.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={onClose}
            autoFocus
            className="rounded-card bg-pine py-3.5 text-sm font-bold text-paper shadow-paper transition hover:brightness-110 hover:shadow-lift active:scale-[0.98]"
          >
            Keep shopping
          </button>
          <button
            onClick={onConfirm}
            className="rounded-card py-3 text-sm font-bold text-ink transition hover:bg-mist/50 active:scale-[0.98]"
          >
            Finish trip
          </button>
        </div>
      </div>
    </div>
  );
}

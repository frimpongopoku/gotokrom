"use client";

import { useEffect, useState } from "react";
import Sheet from "../Sheet";
import { claimTotal, fmt } from "@/lib/money";

export const PAY_METHODS = [
  { id: "momo", label: "MoMo" },
  { id: "cash", label: "Cash" },
  { id: "bank", label: "Bank" },
];

export default function MarkPaidSheet({ open, claims, onClose, onConfirm }) {
  const [method, setMethod] = useState("momo");
  const [ref, setRef] = useState("");

  useEffect(() => {
    if (open) setRef("");
  }, [open]);

  const total = claims.reduce((s, c) => s + claimTotal(c), 0);
  const single = claims.length === 1;

  return (
    <Sheet open={open} onClose={onClose} label="Mark as paid">
      <div className="overflow-y-auto px-5 pb-6 pt-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Mark as paid</h2>
        <p className="mt-1 text-sm text-inkSoft">
          {single ? claims[0]?.title : `${claims.length} claims`} · they'll see it right away.
        </p>

        <div className="mt-4 rounded-2xl bg-pine/10 px-4 py-3">
          <p className="text-xs text-inkSoft">Paying back</p>
          <p className="font-mono text-3xl font-bold tracking-tight text-pineDark">{fmt(total)}</p>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-[13px] font-semibold text-inkSoft">How did you pay?</legend>
          <div role="radiogroup" className="grid grid-cols-3 gap-2">
            {PAY_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={method === m.id}
                onClick={() => setMethod(m.id)}
                className={`press h-12 rounded-xl text-sm font-semibold ${
                  method === m.id ? "bg-ink text-paper" : "border border-mist bg-surface text-ink hover:border-inkSoft/50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 block">
          <span className="mb-2 block text-[13px] font-semibold text-inkSoft">Reference (optional)</span>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder={method === "momo" ? "Transaction ID" : method === "bank" ? "Transfer reference" : "Any note"}
            className="w-full rounded-xl border border-mist bg-surface px-4 py-3 text-[16px] text-ink placeholder:text-inkSoft/60 focus:border-pineDark focus:outline-none"
          />
        </label>

        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="press rounded-2xl border border-mist px-5 py-3.5 text-[15px] font-bold text-ink">
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ method, ref })}
            className="press flex flex-1 items-center justify-center gap-2 rounded-2xl bg-pine py-3.5 text-[15px] font-bold text-paper"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Confirm payment
          </button>
        </div>
      </div>
    </Sheet>
  );
}

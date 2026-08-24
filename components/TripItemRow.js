"use client";

import { useState } from "react";

export default function TripItemRow({ item, onToggle, onUpdate, onRemove }) {
  const [priceDraft, setPriceDraft] = useState(item.price === "" ? "" : String(item.price));
  const [editingPrice, setEditingPrice] = useState(false);

  const commitPrice = () => {
    setEditingPrice(false);
    const val = priceDraft === "" ? "" : Math.max(0, Number(priceDraft) || 0);
    onUpdate({ price: val });
  };

  const bumpQty = (delta) => {
    onUpdate({ qty: Math.max(1, (Number(item.qty) || 1) + delta) });
  };

  return (
    <li className="flex items-center gap-2.5 px-4 py-3">
      <button
        aria-label={item.checked ? `Uncheck ${item.name}` : `Check off ${item.name}`}
        onClick={onToggle}
        className={`stamp flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
          item.checked ? "border-pine bg-pine" : "border-mist bg-surface"
        }`}
      >
        {item.checked && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#FAF6EC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex min-w-0 flex-1 items-baseline">
        <span className={item.checked ? "strike-wrap" : ""}>
          <span className={`text-[15px] ${item.checked ? "text-inkSoft/70" : "text-ink"}`}>{item.name}</span>
        </span>
        {Number(item.qty) > 1 && (
          <span className="ml-1.5 shrink-0 font-mono text-xs text-inkSoft">×{item.qty}</span>
        )}
        <span className="leader" />
      </div>

      <div className="flex shrink-0 items-center gap-1 text-inkSoft">
        <button onClick={() => bumpQty(-1)} aria-label="Decrease quantity" className="px-1 text-sm active:scale-90">
          −
        </button>
        <button onClick={() => bumpQty(1)} aria-label="Increase quantity" className="px-1 text-sm active:scale-90">
          +
        </button>
      </div>

      {editingPrice ? (
        <input
          autoFocus
          inputMode="decimal"
          value={priceDraft}
          onChange={(e) => setPriceDraft(e.target.value)}
          onBlur={commitPrice}
          onKeyDown={(e) => e.key === "Enter" && commitPrice()}
          placeholder="0.00"
          className="w-16 shrink-0 rounded-md border border-pine bg-surface px-1.5 py-1 text-right font-mono text-sm text-ink focus:outline-none"
        />
      ) : (
        <button
          onClick={() => setEditingPrice(true)}
          className={`w-16 shrink-0 rounded-md px-1.5 py-1 text-right font-mono text-sm transition hover:bg-paperDim ${
            item.price === "" ? "text-inkSoft/50" : "text-ink"
          }`}
        >
          {item.price === "" ? "add ₵" : `₵${Number(item.price).toFixed(2)}`}
        </button>
      )}

      <button
        onClick={onRemove}
        aria-label={`Remove ${item.name}`}
        className="shrink-0 rounded-full p-1 text-inkSoft/60 transition hover:text-clay active:scale-90"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </li>
  );
}

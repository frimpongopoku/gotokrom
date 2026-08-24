"use client";

import { useEffect, useState } from "react";
import ItemCombobox from "./ItemCombobox";

export default function ItemSheet({ open, item, itemBank, onClose, onSave, onDelete }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setPrice(item?.price === "" || item?.price == null ? "" : String(item.price));
    setQty(item?.qty && item.qty > 0 ? Number(item.qty) : 1);
  }, [open, item]);

  if (!open) return null;

  const bumpQty = (delta) => setQty((q) => Math.max(1, q + delta));

  const save = () => {
    if (!name.trim()) return;
    onSave({ name, price, qty });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="torn-top w-full max-w-md rounded-t-2xl bg-paper px-5 pb-7 pt-6 shadow-lift sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-ink">Edit item</h2>

        <label className="mt-5 block text-[11px] font-bold uppercase tracking-[0.1em] text-inkSoft">Item</label>
        <ItemCombobox
          items={itemBank}
          value={name}
          onChangeText={setName}
          onPick={(picked) => {
            setName(picked.name);
            if (picked.lastPrice != null) setPrice(String(picked.lastPrice));
          }}
          onSubmit={save}
          placeholder="Item name…"
          inputClassName="mt-1.5 w-full rounded-card border border-mist bg-surface/70 px-3.5 py-3 text-[15px] text-ink placeholder:text-inkSoft/60 focus:border-pine focus:outline-none"
        />

        <div className="mt-5 flex items-end gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-inkSoft">Quantity</label>
            <div className="mt-1.5 flex items-center gap-2 rounded-card border border-mist bg-paperDim px-1.5 py-1.5">
              <button
                onClick={() => bumpQty(-1)}
                aria-label="Decrease quantity"
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-ink transition hover:bg-mist/50 active:scale-90"
              >
                −
              </button>
              <span className="w-8 text-center font-mono text-xl font-bold text-ink">{qty}</span>
              <button
                onClick={() => bumpQty(1)}
                aria-label="Increase quantity"
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-ink transition hover:bg-mist/50 active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-inkSoft">
              Price each
            </label>
            <div className="mt-1.5 flex items-center gap-1.5 rounded-card border border-mist bg-surface/70 px-3.5 py-3 focus-within:border-pine">
              <span className="font-mono text-lg font-bold text-inkSoft">₵</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                inputMode="decimal"
                placeholder="0.00"
                className="w-full bg-transparent font-mono text-lg font-bold text-ink placeholder:text-inkSoft/40 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {price !== "" && qty > 1 && (
          <p className="mt-3 text-xs text-inkSoft">
            ₵{(Number(price) || 0).toFixed(2)} × {qty} = <span className="font-bold text-ink">₵{((Number(price) || 0) * qty).toFixed(2)}</span>
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={save}
            className="rounded-card bg-pine py-3.5 text-sm font-bold text-paper transition active:scale-[0.98]"
          >
            Save changes
          </button>
          <button
            onClick={onDelete}
            className="rounded-card py-3 text-sm font-bold text-clay transition hover:bg-clay/10 active:scale-[0.98]"
          >
            Remove item
          </button>
          <button onClick={onClose} className="rounded-card py-3 text-sm font-bold text-inkSoft transition active:scale-[0.98]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

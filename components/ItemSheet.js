"use client";

import { useEffect, useState } from "react";
import ItemCombobox from "./ItemCombobox";
import CategoryPicker from "./CategoryPicker";
import { fmt } from "@/lib/money";

function Label({ children }) {
  return <span className="mb-1.5 block text-[13px] font-semibold text-inkSoft">{children}</span>;
}

export default function ItemSheet({ open, item, itemBank, categories, onCreateCategory, onClose, onSave, onDelete }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState(1);
  const [categoryId, setCategoryId] = useState(null);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setPrice(item?.price === "" || item?.price == null ? "" : String(item.price));
    setQty(item?.qty && item.qty > 0 ? Number(item.qty) : 1);
    setCategoryId(item?.categoryId ?? null);
  }, [open, item]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const bumpQty = (delta) => setQty((q) => Math.max(1, q + delta));
  const lineTotal = (Number(price) || 0) * qty;

  const save = () => {
    if (!name.trim()) return;
    onSave({ name, price, qty, categoryId });
  };

  return (
    <div className="scrim-in fixed inset-0 z-50 flex items-end justify-center bg-scrim/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit item"
        className="sheet-in torn-top max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-paper px-5 pb-6 pt-3 shadow-lift sm:rounded-card sm:pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-mist sm:hidden" />

        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-ink">Edit item</h2>
          <button
            onClick={onDelete}
            className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-clay transition hover:bg-clay/10 active:scale-95"
          >
            Remove
          </button>
        </div>

        <div className="mt-4">
          <Label>Item</Label>
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
            inputClassName="w-full rounded-card border border-mist bg-surface/70 px-3.5 py-3 text-[16px] text-ink placeholder:text-inkSoft/60 focus:border-pine focus:outline-none"
          />
        </div>

        <div className="mt-4 flex items-end gap-3">
          <div>
            <Label>Quantity</Label>
            <div className="flex items-center rounded-card border border-mist bg-surface/70 p-1">
              <button
                onClick={() => bumpQty(-1)}
                aria-label="Decrease quantity"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-lg text-ink transition hover:bg-mist/50 active:scale-90"
              >
                −
              </button>
              <span className="w-8 text-center font-mono text-lg font-bold text-ink">{qty}</span>
              <button
                onClick={() => bumpQty(1)}
                aria-label="Increase quantity"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-lg text-ink transition hover:bg-mist/50 active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          <label className="min-w-0 flex-1">
            <Label>Price each</Label>
            <span className="flex items-center gap-1.5 rounded-card border border-mist bg-surface/70 px-3.5 py-[11px] focus-within:border-pine">
              <span className="font-mono text-lg font-bold text-inkSoft">₵</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                inputMode="decimal"
                placeholder="0.00"
                className="w-full min-w-0 bg-transparent font-mono text-lg font-bold text-ink placeholder:font-normal placeholder:text-inkSoft/40 focus:outline-none"
              />
            </span>
          </label>
        </div>

        <div className="mt-5">
          <Label>Category</Label>
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} onCreate={onCreateCategory} />
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-dashed border-mist pt-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-inkSoft">{qty > 1 && price !== "" ? `${qty} × ${fmt(price)}` : "Line total"}</p>
            <p className="truncate font-mono text-base font-bold text-ink min-[360px]:text-lg">{fmt(lineTotal)}</p>
          </div>
          <button onClick={onClose} className="rounded-card px-4 py-3 text-sm font-bold text-inkSoft transition hover:bg-mist/50 hover:text-ink active:scale-[0.98]">
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded-card bg-pine px-6 py-3 text-sm font-bold text-paper shadow-paper transition hover:-translate-y-px hover:shadow-lift hover:brightness-110 active:scale-[0.98]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

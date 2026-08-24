"use client";

import { useState } from "react";
import ItemCombobox from "./ItemCombobox";

export default function TripAddItem({ itemBank, onAdd }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name, price, qty: Math.max(1, Number(qty) || 1) });
    setName("");
    setPrice("");
    setQty("1");
  };

  return (
    <div className="flex items-center gap-2 border-t border-mist/70 p-2.5">
      <ItemCombobox
        items={itemBank}
        value={name}
        onChangeText={setName}
        onPick={(item) => {
          setName(item.name);
          if (item.lastPrice != null) setPrice(String(item.lastPrice));
        }}
        onSubmit={submit}
        placeholder="Add an item…"
        inputClassName="w-full rounded-lg border border-transparent bg-transparent px-2 py-2 text-[15px] text-ink placeholder:text-inkSoft/70 focus:border-mist focus:bg-paperDim focus:outline-none"
      />
      <div className="flex shrink-0 items-center gap-0.5">
        <span className="text-xs text-inkSoft/70">×</span>
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          inputMode="numeric"
          aria-label="Quantity"
          placeholder="1"
          className="w-9 rounded-lg border border-mist bg-surface/70 px-1 py-2 text-center font-mono text-sm text-ink placeholder:text-inkSoft/50 focus:border-pine focus:outline-none"
        />
      </div>
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        inputMode="decimal"
        placeholder="₵"
        className="w-16 shrink-0 rounded-lg border border-mist bg-surface/70 px-2 py-2 text-right font-mono text-sm text-ink placeholder:text-inkSoft/50 focus:border-pine focus:outline-none"
      />
      <button
        onClick={submit}
        aria-label="Add item"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine text-paper transition active:scale-90"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

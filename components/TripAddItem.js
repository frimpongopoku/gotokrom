"use client";

import { useEffect, useRef, useState } from "react";
import ItemCombobox from "./ItemCombobox";
import CategoryPicker, { CategoryDot, categoryColor } from "./CategoryPicker";

const BURST_PARTICLES = 12;

// A small ring of confetti that flies out of the add button.
function Burst({ color }) {
  const colors = [color, "#E8A93B", "#4FA37A", color, "#F2D08A"];
  return (
    <span className="burst" aria-hidden="true">
      {Array.from({ length: BURST_PARTICLES }, (_, i) => {
        const angle = (i / BURST_PARTICLES) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1);
        const dist = i % 3 === 0 ? 30 : 22;
        return (
          <span
            key={i}
            style={{
              "--dx": `${Math.cos(angle) * dist}px`,
              "--dy": `${Math.sin(angle) * dist}px`,
              "--size": `${i % 3 === 0 ? 5 : 7}px`,
              "--delay": `${(i % 4) * 18}ms`,
              backgroundColor: colors[i % colors.length],
            }}
          />
        );
      })}
    </span>
  );
}

// The add-item composer docked at the bottom of a trip. The chosen category
// stays selected between adds so a run of items lands in the same group.
export default function TripAddItem({ itemBank, categories, categoryId, onCategoryChange, onCreateCategory, onAdd, inputRef }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState(1);
  const [picking, setPicking] = useState(false);
  const [celebration, setCelebration] = useState(0);
  const [showCheck, setShowCheck] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!celebration) return;
    setShowCheck(true);
    const t = setTimeout(() => setShowCheck(false), 700);
    return () => clearTimeout(t);
  }, [celebration]);

  const category = categories.find((c) => c.id === categoryId) ?? null;

  useEffect(() => {
    if (!picking) return;
    const close = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPicking(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [picking]);

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name, price, qty, categoryId });
    setName("");
    setPrice("");
    setQty(1);
    setCelebration((n) => n + 1);
    inputRef?.current?.focus();
  };

  return (
    <div className="px-3 pb-3 pt-2.5">
      <div className="flex items-center gap-2 rounded-card border border-mist bg-surface px-1.5 py-1 shadow-paper focus-within:border-pine">
        <ItemCombobox
          items={itemBank}
          value={name}
          onChangeText={setName}
          onPick={(item) => {
            setName(item.name);
            if (item.lastPrice != null) setPrice(String(item.lastPrice));
          }}
          onSubmit={submit}
          inputRef={inputRef}
          dropUp
          placeholder={category ? `Add to ${category.name}…` : "Add an item…"}
          inputClassName="w-full bg-transparent px-2 py-2.5 text-[15px] text-ink placeholder:text-inkSoft/70 focus:outline-none"
        />
        <span className="relative shrink-0">
          {celebration > 0 && <Burst key={celebration} color={category ? categoryColor(category) : "#4FA37A"} />}
          <button
            onClick={submit}
            aria-label="Add item"
            disabled={!name.trim() && !showCheck}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-pine text-paper shadow-paper transition hover:-translate-y-px hover:shadow-lift hover:brightness-110 active:scale-90 disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:brightness-100"
          >
            <span key={celebration} className={celebration ? "pop" : ""}>
              {showCheck ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="check-draw">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              )}
            </span>
          </button>
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="relative min-w-0 flex-1" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setPicking((p) => !p)}
            aria-expanded={picking}
            className="flex w-full min-w-0 items-center gap-2 rounded-full border border-mist bg-surface/70 py-1.5 pl-2.5 pr-2 text-left text-[13px] font-semibold text-ink transition hover:border-inkSoft/50 hover:bg-surface active:scale-[0.98]"
          >
            <CategoryDot category={category} />
            <span className={`truncate ${category ? "" : "text-inkSoft"}`}>{category ? category.name : "No category"}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              className={`ml-auto shrink-0 text-inkSoft transition ${picking ? "rotate-180" : ""}`}
            >
              <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {picking && (
            <div className="popover-in absolute bottom-full left-0 z-30 mb-2 w-[min(22rem,calc(100vw-1.5rem))] rounded-card border border-mist bg-paper p-3 shadow-lift">
              <p className="mb-2 text-xs text-inkSoft">New items go into</p>
              <CategoryPicker
                categories={categories}
                value={categoryId}
                onCreate={onCreateCategory}
                onChange={(id) => {
                  onCategoryChange(id);
                  setPicking(false);
                }}
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center rounded-full border border-mist bg-surface/70">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition hover:bg-mist/60 active:scale-90"
          >
            −
          </button>
          <span className="w-5 text-center font-mono text-sm font-bold text-ink" aria-label="Quantity">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition hover:bg-mist/60 active:scale-90"
          >
            +
          </button>
        </div>

        <label className="flex w-24 shrink-0 items-center gap-1 rounded-full border border-mist bg-surface/70 px-3 py-1.5 focus-within:border-pine">
          <span className="font-mono text-sm font-bold text-inkSoft">₵</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            inputMode="decimal"
            aria-label="Price each"
            placeholder="0.00"
            className="w-full min-w-0 bg-transparent text-right font-mono text-sm font-bold text-ink placeholder:font-normal placeholder:text-inkSoft/50 focus:outline-none"
          />
        </label>
      </div>
    </div>
  );
}

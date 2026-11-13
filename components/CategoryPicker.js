"use client";

import { useState } from "react";

// Categorical hues validated as a set on the dark surface (lightness band,
// chroma floor, colour-blind separation between neighbours, 3:1 contrast).
// Categories take the next color in order, so neighbours rarely clash.
export const CATEGORY_COLORS = ["#3987E5", "#D95926", "#199E70", "#C98500", "#D55181", "#008300", "#9085E9", "#E66767"];

export function categoryColor(category) {
  if (!category) return "rgb(var(--color-ink-soft))";
  const n = Number.isInteger(category.color) ? category.color : category.name.length;
  return CATEGORY_COLORS[n % CATEGORY_COLORS.length];
}

export function CategoryDot({ category, className = "h-2.5 w-2.5" }) {
  return (
    <span
      className={`shrink-0 rounded-full ${className} ${category ? "" : "border-[1.5px] border-dashed border-inkSoft/70"}`}
      style={category ? { backgroundColor: categoryColor(category) } : undefined}
    />
  );
}

function Option({ category, selected, onClick }) {
  const color = category ? categoryColor(category) : null;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition active:scale-95 ${
        selected ? "text-ink" : "border-mist text-inkSoft hover:border-inkSoft/50 hover:text-ink"
      }`}
      style={selected ? { borderColor: color ?? "rgb(var(--color-ink-soft))", backgroundColor: color ? `${color}2e` : undefined } : undefined}
    >
      <CategoryDot category={category} className="h-2 w-2" />
      {category ? category.name : "None"}
    </button>
  );
}

export default function CategoryPicker({ categories, value, onChange, onCreate }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    const id = draft.trim() ? onCreate(draft) : null;
    setDraft("");
    setAdding(false);
    if (id) onChange(id);
  };

  const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div role="radiogroup" aria-label="Category" className="flex flex-wrap items-center gap-1.5">
      <Option category={null} selected={!value} onClick={() => onChange(null)} />
      {sorted.map((c) => (
        <Option key={c.id} category={c} selected={value === c.id} onClick={() => onChange(c.id)} />
      ))}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          onBlur={commit}
          placeholder="e.g. Produce"
          className="w-32 rounded-full border border-pine bg-surface px-3 py-1.5 text-[13px] text-ink placeholder:text-inkSoft/60 focus:outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-inkSoft/50 px-3 py-1.5 text-[13px] font-semibold text-inkSoft transition hover:border-pine hover:text-ink active:scale-95"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
          New category
        </button>
      )}
    </div>
  );
}

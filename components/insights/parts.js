"use client";

import { categoryColor } from "../CategoryPicker";

export const NEUTRAL = "#6B6F76";

export function tagColor(row) {
  return row.category ? categoryColor(row.category) : NEUTRAL;
}

export function tagName(row) {
  if (row.other) return "Other tags";
  return row.category ? row.category.name : "No tag";
}

export function Card({ children, className = "", style }) {
  return (
    <section style={style} className={`min-w-0 rounded-3xl border border-mist bg-surface p-4 sm:p-5 ${className}`}>
      {children}
    </section>
  );
}

export function CardTitle({ children, aside }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-lg font-bold tracking-tight text-ink">{children}</h2>
      {aside && <span className="text-xs text-inkSoft">{aside}</span>}
    </div>
  );
}

// Money going up is the thing to watch, so it gets the warm chip; going down gets the brand chip.
export function ChangeChip({ pct, suffix = "" }) {
  const up = pct > 0;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
        up ? "bg-yolk/20 text-yolkDark" : "bg-pine/15 text-pineDark"
      }`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={up ? "" : "rotate-180"}>
        <path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only">{up ? "up" : "down"}</span>
      {Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%{suffix}
    </span>
  );
}

export function MonthPicker({ label, onPrev, onNext }) {
  const btn =
    "press flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-mist/60 disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-mist bg-surface p-0.5">
      <button onClick={onPrev} disabled={!onPrev} aria-label="Previous month" className={btn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="min-w-[6.5rem] text-center text-sm font-semibold text-ink" aria-live="polite">
        {label}
      </span>
      <button onClick={onNext} disabled={!onNext} aria-label="Next month" className={btn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-inkSoft/50 transition group-hover:translate-x-0.5 group-hover:text-inkSoft">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

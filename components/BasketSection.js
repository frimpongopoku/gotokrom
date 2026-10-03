"use client";

import { fmt } from "@/lib/money";
import { CategoryDot, categoryColor } from "./CategoryPicker";

// A category's slice of the basket: header with its own running total, then its items.
export default function BasketSection({ group, collapsed, onToggleCollapsed, onAddHere, children }) {
  const { category, items, planned, inCart, checked } = group;
  const allChecked = checked === items.length;
  const color = categoryColor(category);
  const progress = planned > 0 ? (inCart / planned) * 100 : (checked / items.length) * 100;

  return (
    <section className="border-t border-mist/70 first:border-t-0">
      <div className="flex items-stretch">
        <button
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          className="group flex min-w-0 flex-1 items-center gap-2.5 py-3 pl-4 pr-2 text-left transition-colors hover:bg-paperDim/60"
        >
          <CategoryDot category={category} className="h-3 w-3" />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className={`truncate font-display text-[17px] font-bold leading-tight ${category ? "text-ink" : "text-inkSoft"}`}>
                {category ? category.name : "No category"}
              </span>
              <span className="shrink-0 text-xs text-inkSoft">
                {allChecked ? "all in cart" : `${checked} of ${items.length}`}
              </span>
            </span>
            <span className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-mist/60">
              <span
                className="block h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%`, backgroundColor: color }}
              />
            </span>
          </span>
          <span className="shrink-0 pl-2 text-right font-mono">
            <span className="block text-[15px] font-bold leading-tight text-ink">{fmt(planned)}</span>
            {inCart > 0 && inCart < planned && (
              <span className="block text-[11px] text-pineDark">{fmt(inCart)} in</span>
            )}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className={`shrink-0 text-inkSoft/60 transition duration-300 group-hover:text-inkSoft ${collapsed ? "-rotate-90" : ""}`}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {onAddHere && (
          <button
            onClick={onAddHere}
            aria-label={`Add to ${category ? category.name : "no category"}`}
            className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full text-inkSoft transition hover:rotate-90 hover:bg-mist/50 hover:text-ink active:scale-90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      {/* Animating grid rows between 0fr and 1fr gives a smooth height change without measuring. */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: collapsed ? "0fr" : "1fr" }}
        inert={collapsed ? "" : undefined}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="divide-y divide-mist/50 border-t border-dashed border-mist/80">{children}</ul>
        </div>
      </div>
    </section>
  );
}

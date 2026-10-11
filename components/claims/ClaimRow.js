"use client";

import Link from "next/link";
import { claimTotal, fmt } from "@/lib/money";
import { CategoryDot } from "../CategoryPicker";

export function StatusChip({ claim, className = "" }) {
  const paid = Boolean(claim.paidAt);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        paid ? "bg-pine/15 text-pineDark" : "bg-yolk/20 text-yolkDark"
      } ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${paid ? "bg-pineDark" : "bg-yolk"}`} />
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

// Distinct categories on a claim, most-used first.
export function claimCategories(claim, categories) {
  const counts = new Map();
  for (const item of claim.items) {
    if (item.categoryId) counts.set(item.categoryId, (counts.get(item.categoryId) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => categories.find((c) => c.id === id))
    .filter(Boolean);
}

export default function ClaimRow({ claim, categories, selecting, selected, onToggle }) {
  const date = new Date(claim.spentAt);
  const tags = claimCategories(claim, categories);
  const count = claim.items.length;

  const body = (
    <>
      {selecting ? (
        <span
          className={`stamp flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            selected ? "border-pine bg-pine text-paper" : "border-mist"
          }`}
        >
          {selected && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="check-draw">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      ) : (
        <span className="w-10 shrink-0 text-center">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-inkSoft">
            {date.toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="block font-display text-xl font-bold leading-none text-ink">{date.getDate()}</span>
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-ink">{claim.title}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-inkSoft">
          {tags.slice(0, 3).map((t) => (
            <CategoryDot key={t.id} category={t} className="h-2 w-2" />
          ))}
          <span className="truncate">
            {count} item{count === 1 ? "" : "s"}
            {tags[0] ? ` · ${tags.map((t) => t.name).slice(0, 2).join(", ")}` : ""}
          </span>
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-mono text-sm font-bold text-ink">{fmt(claimTotal(claim))}</span>
        <StatusChip claim={claim} className="mt-1" />
      </span>
    </>
  );

  const className = `flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
    selected ? "bg-pine/[0.08]" : "hover:bg-paperDim"
  }`;

  if (selecting) {
    return (
      <button type="button" role="checkbox" aria-checked={selected} onClick={onToggle} className={className}>
        {body}
      </button>
    );
  }

  return (
    <Link href={`/claims/${claim.id}`} className={className}>
      {body}
    </Link>
  );
}

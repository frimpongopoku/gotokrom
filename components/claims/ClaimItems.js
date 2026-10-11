"use client";

import { fmt, groupByCategory } from "@/lib/money";
import { CategoryDot } from "../CategoryPicker";

function Row({ item, onOpen, isNew }) {
  const qty = Number(item.qty) || 1;
  const hasPrice = item.price !== "" && item.price != null;
  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] text-ink">{item.name}</span>
        <span className="block font-mono text-[11px] text-inkSoft">
          {hasPrice ? `${qty} × ${fmt(item.price)}` : qty > 1 ? `× ${qty} · no price yet` : "no price yet"}
        </span>
      </span>
      <span className={`shrink-0 font-mono text-sm font-bold ${hasPrice ? "text-ink" : "text-inkSoft/60"}`}>
        {hasPrice ? fmt(Number(item.price) * qty) : "add ₵"}
      </span>
      {onOpen && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-inkSoft/40 transition group-hover:translate-x-0.5 group-hover:text-inkSoft">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </>
  );
  const cls = "group flex w-full min-h-[56px] items-center gap-3 px-4 py-2 text-left";
  return (
    <li className={isNew ? "row-new" : ""}>
      {onOpen ? (
        <button onClick={onOpen} className={`${cls} transition-colors hover:bg-paperDim`}>
          {content}
        </button>
      ) : (
        <div className={cls}>{content}</div>
      )}
    </li>
  );
}

// A claim's items, grouped by category when any have one.
export default function ClaimItems({ claim, categories, onOpenItem, newIds }) {
  const groups = groupByCategory(claim, categories);
  const grouped = groups.some((g) => g.category);

  if (!grouped) {
    return (
      <ul className="divide-y divide-mist/60">
        {claim.items.map((item) => (
          <Row key={item.id} item={item} isNew={newIds?.has(item.id)} onOpen={onOpenItem ? () => onOpenItem(item) : null} />
        ))}
      </ul>
    );
  }

  return groups.map((group) => (
    <section key={group.category?.id ?? "none"} className="border-t border-mist/70 first:border-t-0">
      <div className="flex items-center justify-between gap-3 bg-paperDim/60 px-4 py-2">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <CategoryDot category={group.category} />
          {group.category ? group.category.name : "No category"}
          <span className="font-normal text-inkSoft">{group.items.length}</span>
        </span>
        <span className="font-mono text-[13px] font-bold text-ink">{fmt(group.planned)}</span>
      </div>
      <ul className="divide-y divide-mist/50">
        {group.items.map((item) => (
          <Row key={item.id} item={item} isNew={newIds?.has(item.id)} onOpen={onOpenItem ? () => onOpenItem(item) : null} />
        ))}
      </ul>
    </section>
  ));
}

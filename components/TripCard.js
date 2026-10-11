"use client";

import Link from "next/link";
import { fmt, formatDate, tripTotals } from "@/lib/money";

export default function TripCard({ trip }) {
  const { planned, inCart } = tripTotals(trip);
  const done = Boolean(trip.completedAt);
  const itemCount = trip.items.length;
  const checked = trip.items.filter((i) => i.checked).length;
  const progress = itemCount ? (checked / itemCount) * 100 : 0;

  return (
    <Link
      href={`/trip/${trip.id}`}
      className="press group block rounded-card border border-mist bg-surface px-4 py-3.5 hover:border-inkSoft/40 hover:shadow-lift"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-ink">{trip.name}</p>
          <p className="mt-0.5 text-xs text-inkSoft">
            {formatDate(trip.createdAt)} · {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-right font-mono text-sm font-bold text-ink">{fmt(done ? planned : inCart)}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-inkSoft/60 transition group-hover:translate-x-0.5 group-hover:text-inkSoft">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {!done && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-mist/70">
            <div className="h-full rounded-full bg-pine transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-inkSoft">
            {checked} of {itemCount} in cart · planned {fmt(planned)}
          </p>
        </div>
      )}
    </Link>
  );
}

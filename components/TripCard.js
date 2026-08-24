"use client";

import Link from "next/link";
import { fmt, formatDate, tripTotals } from "@/lib/money";

export default function TripCard({ trip }) {
  const { planned, inCart } = tripTotals(trip);
  const done = Boolean(trip.completedAt);
  const itemCount = trip.items.length;

  return (
    <Link
      href={`/trip/${trip.id}`}
      className="torn-top torn-bottom block rounded-card border border-mist bg-surface/70 px-4 py-5 shadow-paper transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold text-ink">{trip.name}</p>
          <p className="mt-0.5 text-xs text-inkSoft">
            {formatDate(trip.createdAt)} · {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            done ? "bg-pine/15 text-pineDark" : "bg-yolk/20 text-yolkDark"
          }`}
        >
          {done ? "Done" : "Active"}
        </span>
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-mist pt-2.5">
        <span className="font-mono text-xs text-inkSoft">{done ? "Total" : "In cart / planned"}</span>
        <span className="font-mono text-sm font-bold text-ink">
          {done ? fmt(planned) : `${fmt(inCart)} / ${fmt(planned)}`}
        </span>
      </div>
    </Link>
  );
}

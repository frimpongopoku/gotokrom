"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/lib/store";
import { fmt, formatDate, fromDateInput, toDateInput, tripTotals } from "@/lib/money";
import Sheet from "./Sheet";

// Starting a claim: name it and go, or turn a recent trip into one in a single tap.
export default function NewClaimSheet({ open, onClose }) {
  const { data, createClaim, createClaimFromTrip } = useShop();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => toDateInput(Date.now()));
  const router = useRouter();

  const claimedSources = new Set((data.claims || []).flatMap((c) => c.items.map((i) => i.sourceItemId).filter(Boolean)));
  const recentTrips = [...data.trips]
    .filter((t) => t.items.length > 0)
    .sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt))
    .slice(0, 4);

  const finish = (id) => {
    setTitle("");
    onClose();
    if (id) router.push(`/claims/${id}`);
  };

  const startBlank = () => {
    finish(createClaim({ title: title || "Claim", spentAt: date ? fromDateInput(date) : Date.now() }));
  };

  return (
    <Sheet open={open} onClose={onClose} label="Make a claim">
      <div className="overflow-y-auto px-5 pb-6 pt-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Make a claim</h2>
        <p className="mt-1 text-sm text-inkSoft">List what you paid for, then send it over to be paid back.</p>

        <div className="mt-4 flex gap-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startBlank()}
            placeholder="What was it for? e.g. Pharmacy"
            aria-label="Claim name"
            className="min-w-0 flex-1 rounded-2xl border border-mist bg-surface px-4 py-3.5 text-[16px] text-ink placeholder:text-inkSoft/60 focus:border-pineDark focus:outline-none"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date spent"
            className="w-[8.5rem] shrink-0 rounded-2xl border border-mist bg-surface px-3 py-3.5 text-[14px] text-ink focus:border-pineDark focus:outline-none"
          />
        </div>

        <button onClick={startBlank} className="press mt-3 w-full rounded-2xl bg-pine py-3.5 text-[15px] font-bold text-paper">
          Start claim
        </button>

        {recentTrips.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-inkSoft">Or claim a trip</p>
            <ul className="stagger overflow-hidden rounded-2xl border border-mist bg-surface">
              {recentTrips.map((trip, i) => {
                const already = trip.items.every((it) => claimedSources.has(it.id));
                return (
                  <li key={trip.id} style={{ "--i": i }} className="border-b border-mist/60 last:border-b-0">
                    <button
                      onClick={() => finish(createClaimFromTrip(trip.id))}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paperDim"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-ink">{trip.name}</span>
                        <span className="block text-xs text-inkSoft">
                          {formatDate(trip.completedAt || trip.createdAt)} · {trip.items.length} items
                          {already && " · already claimed"}
                        </span>
                      </span>
                      <span className="font-mono text-sm font-bold text-ink">{fmt(tripTotals(trip).planned)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Sheet>
  );
}

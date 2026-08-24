"use client";

import { useState } from "react";
import Header, { Wordmark } from "@/components/Header";
import HouseholdList from "@/components/HouseholdList";
import TripCard from "@/components/TripCard";
import NewTripSheet from "@/components/NewTripSheet";
import ShareSheet from "@/components/ShareSheet";
import { useShop } from "@/lib/store";

export default function Home() {
  const { data, status, justCreated, dismissJustCreated } = useShop();
  const [tripSheetOpen, setTripSheetOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const active = data.trips.filter((t) => !t.completedAt).sort((a, b) => b.createdAt - a.createdAt);
  const past = data.trips.filter((t) => t.completedAt).sort((a, b) => b.completedAt - a.completedAt);

  return (
    <>
      <Header
        right={
          <button
            onClick={() => setShareOpen(true)}
            aria-label="Share list"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-mist/60 active:scale-90"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
              <path d="M8.6 10.5L15.4 6.5M8.6 13.5L15.4 17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        }
      />

      <main className="mx-auto max-w-xl px-4 pb-28 pt-5">
        {status === "offline" && (
          <div className="mb-4 rounded-lg bg-clay/10 px-3 py-2 text-xs font-medium text-clay">
            Offline — changes will sync once you're back online.
          </div>
        )}

        {justCreated && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-pine/10 px-3 py-2 text-xs font-medium text-pineDark">
            <span>New shared list ready — tap the share icon above to invite your wife.</span>
            <button
              onClick={dismissJustCreated}
              aria-label="Dismiss"
              className="shrink-0 text-inkSoft transition hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        <HouseholdList />

        <button
          onClick={() => setTripSheetOpen(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-card bg-pine py-4 text-[15px] font-bold text-paper shadow-lift transition active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
            <circle cx="17" cy="20" r="1.4" fill="currentColor" />
            <path d="M3 3h2l1 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Start shopping trip
        </button>

        {active.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 px-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-inkSoft">
              Active trips
            </h2>
            <div className="flex flex-col gap-3">
              {active.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 px-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-inkSoft">
              Past trips
            </h2>
            <div className="flex flex-col gap-3">
              {past.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}

        {active.length === 0 && past.length === 0 && (
          <div className="mt-10 flex flex-col items-center px-6 text-center">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-inkSoft">
              No trips yet. Note what you're running low on above, then start a trip when you're
              headed to the store.
            </p>
          </div>
        )}
      </main>

      <NewTripSheet open={tripSheetOpen} onClose={() => setTripSheetOpen(false)} />
      <ShareSheet
        open={shareOpen}
        autoMessage={justCreated}
        onClose={() => {
          setShareOpen(false);
          dismissJustCreated();
        }}
      />
    </>
  );
}

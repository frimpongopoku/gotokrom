"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import AppNav from "@/components/AppNav";
import HouseholdList from "@/components/HouseholdList";
import TripCard from "@/components/TripCard";
import NewTripSheet from "@/components/NewTripSheet";
import NewClaimSheet from "@/components/NewClaimSheet";
import ShareSheet from "@/components/ShareSheet";
import { useShop } from "@/lib/store";
import { claimTotal, fmt } from "@/lib/money";
import useCountUp from "@/lib/useCountUp";

const PAST_TRIPS_SHOWN = 5;

function SectionTitle({ children, aside }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between px-1">
      <h2 className="font-display text-lg font-bold tracking-tight text-ink">{children}</h2>
      {aside}
    </div>
  );
}

function ActionTile({ onClick, primary, icon, title, sub }) {
  return (
    <button
      onClick={onClick}
      className={`press group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-3xl p-4 text-left sm:min-h-[148px] sm:p-5 ${
        primary ? "bg-pine text-paper hover:shadow-lift" : "border border-mist bg-surface text-ink hover:border-inkSoft/40 hover:shadow-lift"
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${
          primary ? "bg-paper/10" : "bg-paperDim"
        }`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d={icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>
        <span className="block font-display text-[19px] font-bold leading-tight tracking-tight sm:text-[22px]">{title}</span>
        <span className={`mt-0.5 block text-[13px] ${primary ? "text-paper/70" : "text-inkSoft"}`}>{sub}</span>
      </span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="absolute right-4 top-4 opacity-60 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100"
      >
        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function ClaimsSnapshot({ claims }) {
  const unpaid = claims.filter((c) => !c.paidAt).sort((a, b) => b.spentAt - a.spentAt);
  const total = unpaid.reduce((sum, c) => sum + claimTotal(c), 0);
  const shown = useCountUp(total);

  if (claims.length === 0) return null;

  return (
    <section>
      <SectionTitle
        aside={
          <Link href="/claims" className="text-[13px] font-semibold text-inkSoft transition hover:text-ink">
            All claims →
          </Link>
        }
      >
        Claims
      </SectionTitle>
      <Link href="/claims" className="press block rounded-card border border-mist bg-surface p-4 hover:border-inkSoft/40 hover:shadow-lift">
        <p className="text-xs text-inkSoft">{unpaid.length ? "Waiting to be paid" : "All paid up"}</p>
        <p className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-ink">
          <span className={unpaid.length ? "highlight" : ""}>{fmt(shown)}</span>
        </p>
        {unpaid.length > 0 && (
          <ul className="mt-3 divide-y divide-mist/60 border-t border-mist/60">
            {unpaid.slice(0, 3).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="truncate text-ink">{c.title}</span>
                <span className="shrink-0 font-mono text-[13px] text-inkSoft">{fmt(claimTotal(c))}</span>
              </li>
            ))}
            {unpaid.length > 3 && <li className="pt-2 text-xs text-inkSoft">+ {unpaid.length - 3} more</li>}
          </ul>
        )}
      </Link>
    </section>
  );
}

export default function Home() {
  const { data, status, justCreated, dismissJustCreated } = useShop();
  const [tripSheetOpen, setTripSheetOpen] = useState(false);
  const [claimSheetOpen, setClaimSheetOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [allPast, setAllPast] = useState(false);

  const active = data.trips.filter((t) => !t.completedAt).sort((a, b) => b.createdAt - a.createdAt);
  const past = data.trips.filter((t) => t.completedAt).sort((a, b) => b.completedAt - a.completedAt);
  const claims = data.claims || [];
  const neededCount = data.itemBank.filter((i) => i.needed).length;
  const unpaid = claims.filter((c) => !c.paidAt);
  const unpaidTotal = unpaid.reduce((sum, c) => sum + claimTotal(c), 0);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <Header
        nav
        wide
        right={
          <button
            onClick={() => setShareOpen(true)}
            aria-label="Share list"
            className="press flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-mist/60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        }
      />

      <main className="page-in mx-auto max-w-2xl px-4 pb-28 pt-5 md:max-w-5xl md:px-6 md:pb-16 md:pt-8">
        {status === "offline" && (
          <div className="mb-4 rounded-2xl bg-clay/15 px-4 py-2.5 text-xs font-medium text-clay">
            Offline — changes will sync once you're back online.
          </div>
        )}

        {justCreated && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-pine/10 px-4 py-2.5 text-xs font-medium text-pineDark">
            <span>New shared list ready — tap the share icon above to invite your partner.</span>
            <button onClick={dismissJustCreated} aria-label="Dismiss" className="shrink-0 text-inkSoft transition hover:text-ink">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        <p className="px-1 text-[13px] text-inkSoft">{today}</p>
        <h1 className="mt-0.5 px-1 font-display text-[32px] font-bold leading-[1.05] tracking-[-0.03em] text-ink md:text-[40px]">
          What's the plan?
        </h1>

        <div className="mt-5 grid grid-cols-2 gap-3 md:max-w-2xl md:gap-4">
          <ActionTile
            primary
            onClick={() => setTripSheetOpen(true)}
            icon="M3 4h2l2.4 11h11.2L21 8H6.2M9 20h.01M18 20h.01"
            title="Start shopping"
            sub={neededCount ? `${neededCount} on the house list` : "Fresh trip"}
          />
          <ActionTile
            onClick={() => setClaimSheetOpen(true)}
            icon="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3"
            title="Make a claim"
            sub={unpaid.length ? `${fmt(unpaidTotal)} unpaid` : "Get paid back"}
          />
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[1.15fr_1fr] md:items-start md:gap-10">
          <div className="flex flex-col gap-8">
            <HouseholdList />
          </div>

          <div className="flex flex-col gap-8">
            {active.length > 0 && (
              <section>
                <SectionTitle>Active trips</SectionTitle>
                <div className="stagger flex flex-col gap-2.5">
                  {active.map((trip, i) => (
                    <div key={trip.id} style={{ "--i": i }}>
                      <TripCard trip={trip} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <ClaimsSnapshot claims={claims} />

            {past.length > 0 && (
              <section>
                <SectionTitle aside={<span className="font-mono text-xs text-inkSoft">{past.length}</span>}>Past trips</SectionTitle>
                <div className="stagger flex flex-col gap-2.5">
                  {(allPast ? past : past.slice(0, PAST_TRIPS_SHOWN)).map((trip, i) => (
                    <div key={trip.id} style={{ "--i": i }}>
                      <TripCard trip={trip} />
                    </div>
                  ))}
                </div>
                {past.length > PAST_TRIPS_SHOWN && (
                  <button
                    onClick={() => setAllPast((v) => !v)}
                    className="press mt-2.5 w-full rounded-2xl border border-mist py-3 text-sm font-semibold text-inkSoft hover:text-ink"
                  >
                    {allPast ? "Show fewer" : `Show all ${past.length}`}
                  </button>
                )}
              </section>
            )}

            {active.length === 0 && past.length === 0 && claims.length === 0 && (
              <p className="rounded-card border border-dashed border-mist px-6 py-8 text-center text-sm leading-relaxed text-inkSoft">
                No trips or claims yet. Note what's running low, start a trip when you head out, or make a claim for
                something you already paid for.
              </p>
            )}
          </div>
        </div>
      </main>

      <AppNav />
      <NewTripSheet open={tripSheetOpen} onClose={() => setTripSheetOpen(false)} />
      <NewClaimSheet open={claimSheetOpen} onClose={() => setClaimSheetOpen(false)} />
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

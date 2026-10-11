"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import ClaimItems from "@/components/claims/ClaimItems";
import { StatusChip } from "@/components/claims/ClaimRow";
import MarkPaidSheet, { PAY_METHODS } from "@/components/claims/MarkPaidSheet";
import Toast, { useToast } from "@/components/Toast";
import { useShop } from "@/lib/store";
import { claimTotal, fmt, formatDate, formatDateTime } from "@/lib/money";
import useCountUp from "@/lib/useCountUp";

async function downloadPdf(claims, categories) {
  const { downloadClaimsPdf } = await import("@/lib/pdf");
  downloadClaimsPdf(claims, categories);
}

function ReviewCard({ claim, categories, open, onToggleOpen, selected, onToggleSelected, justPaid, index }) {
  const paid = Boolean(claim.paidAt);
  const method = PAY_METHODS.find((m) => m.id === claim.paidMethod);

  return (
    <article style={{ "--i": index }} className="relative overflow-hidden rounded-3xl border border-mist bg-surface">
      {paid && (
        <span
          className={`pointer-events-none absolute right-14 top-4 rotate-[-12deg] rounded-lg border-[3px] border-pineDark px-2 py-0.5 font-display text-base font-extrabold tracking-[0.1em] text-pineDark ${
            justPaid ? "stamp-in" : ""
          }`}
        >
          PAID
        </span>
      )}
      <div className="flex items-center gap-3 p-4">
        {!paid ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Include ${claim.title} in payment`}
            onClick={onToggleSelected}
            className={`stamp flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              selected ? "border-pine bg-pine text-paper" : "border-mist"
            }`}
          >
            {selected && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="check-draw">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine/15 text-pineDark">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
        <button onClick={onToggleOpen} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[16px] font-semibold text-ink">{claim.title}</span>
            <span className="block text-xs text-inkSoft">
              {formatDate(claim.spentAt)} · {claim.items.length} item{claim.items.length === 1 ? "" : "s"}
            </span>
          </span>
          <span className="shrink-0 font-mono text-[15px] font-bold text-ink">{fmt(claimTotal(claim))}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`shrink-0 text-inkSoft transition duration-300 ${open ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }} inert={open ? undefined : ""}>
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-mist/70">
            <ClaimItems claim={claim} categories={categories} />
          </div>
          {claim.note && (
            <p className="mx-4 mt-3 rounded-2xl bg-paperDim px-4 py-3 text-sm leading-relaxed text-ink">
              <span className="block text-xs text-inkSoft">Note</span>
              {claim.note}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 pt-3">
            {paid ? (
              <span className="text-[13px] text-pineDark">
                Paid {formatDateTime(claim.paidAt)}
                {method ? ` · ${method.label}` : ""}
                {claim.paidRef ? ` · ref ${claim.paidRef}` : ""}
              </span>
            ) : (
              <StatusChip claim={claim} />
            )}
            <button
              onClick={() => downloadPdf([claim], categories)}
              className="press rounded-xl border border-mist px-3 py-2 text-[13px] font-semibold text-ink hover:bg-paperDim"
            >
              PDF
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ReviewPage({ params }) {
  const { data, status, markClaimsPaid } = useShop();
  const categories = data.categories || [];
  const ids = decodeURIComponent(params.ids).split(",").filter(Boolean);
  const claims = ids.map((id) => (data.claims || []).find((c) => c.id === id)).filter(Boolean);
  const unpaid = claims.filter((c) => !c.paidAt);

  const [openIds, setOpenIds] = useState(() => new Set());
  const [selected, setSelected] = useState(() => new Set());
  const [seeded, setSeeded] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [justPaid, setJustPaid] = useState(() => new Set());
  const [toast, showToast] = useToast();

  // Once the claims arrive: everything unpaid is selected, and a lone claim starts open.
  useEffect(() => {
    if (seeded || claims.length === 0) return;
    setSelected(new Set(unpaid.map((c) => c.id)));
    setOpenIds(new Set(claims.length === 1 ? [claims[0].id] : []));
    setSeeded(true);
  }, [claims.length, seeded]); // eslint-disable-line react-hooks/exhaustive-deps

  const toPay = unpaid.filter((c) => selected.has(c.id));
  const payTotal = toPay.reduce((s, c) => s + claimTotal(c), 0);
  const outstanding = unpaid.reduce((s, c) => s + claimTotal(c), 0);
  const shownOutstanding = useCountUp(outstanding);

  const toggleSet = (setter) => (id) =>
    setter((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (claims.length === 0) {
    return (
      <>
        <Header />
        <main className="page-in mx-auto max-w-md px-6 py-16 text-center">
          {status === "loading" ? (
            <p className="text-sm text-inkSoft">Loading claims…</p>
          ) : (
            <>
              <p className="font-display text-2xl font-bold text-ink">Claim not found</p>
              <p className="mt-2 text-sm text-inkSoft">It may have been deleted, or the link is from a different list.</p>
              <Link href="/" className="press mt-6 inline-block rounded-2xl bg-pine px-6 py-3 text-sm font-bold text-paper">
                Open Pokah
              </Link>
            </>
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="page-in mx-auto max-w-2xl px-4 pb-40 pt-6 md:px-6 md:pt-10">
        <p className="px-1 text-[13px] text-inkSoft">
          {claims.length === 1 ? "A claim" : `${claims.length} claims`} for you to review
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 px-1">
          <h1 className="font-display text-[32px] font-bold leading-[1.05] tracking-[-0.03em] text-ink md:text-[40px]">
            {unpaid.length ? "Review & pay" : "All paid up"}
          </h1>
          <p className="font-mono text-2xl font-bold text-ink md:text-3xl">
            <span className={unpaid.length ? "highlight" : ""}>{fmt(shownOutstanding)}</span>
          </p>
        </div>
        <p className="mt-1 px-1 text-sm text-inkSoft">
          {unpaid.length
            ? `${unpaid.length} unpaid · tap a claim to see what's in it`
            : "Nothing left to pay on this link. Thank you!"}
        </p>

        <div className="stagger mt-6 flex flex-col gap-3">
          {claims.map((claim, i) => (
            <ReviewCard
              key={claim.id}
              index={i}
              claim={claim}
              categories={categories}
              open={openIds.has(claim.id)}
              onToggleOpen={() => toggleSet(setOpenIds)(claim.id)}
              selected={selected.has(claim.id)}
              onToggleSelected={() => toggleSet(setSelected)(claim.id)}
              justPaid={justPaid.has(claim.id)}
            />
          ))}
        </div>

        {claims.length > 1 && (
          <button
            onClick={() => downloadPdf(claims, categories)}
            className="press mt-4 w-full rounded-2xl border border-mist py-3 text-sm font-semibold text-ink hover:bg-surface"
          >
            Download all as one PDF
          </button>
        )}
      </main>

      {unpaid.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-mist bg-paper/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-inkSoft">
                {toPay.length} of {unpaid.length} selected
              </p>
              <p className="font-mono text-xl font-bold text-ink">{fmt(payTotal)}</p>
            </div>
            <button
              onClick={() => setPayOpen(true)}
              disabled={toPay.length === 0}
              className="press flex h-12 items-center gap-2 rounded-2xl bg-pine px-5 text-[15px] font-bold text-paper disabled:opacity-40"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Mark as paid
            </button>
          </div>
        </div>
      )}

      <Toast toast={toast} bottom="bottom-28" />

      <MarkPaidSheet
        open={payOpen}
        claims={toPay}
        onClose={() => setPayOpen(false)}
        onConfirm={(payment) => {
          const paidIds = toPay.map((c) => c.id);
          markClaimsPaid(paidIds, payment);
          setJustPaid(new Set(paidIds));
          setPayOpen(false);
          showToast(`Paid ${fmt(payTotal)}`);
        }}
      />
    </>
  );
}

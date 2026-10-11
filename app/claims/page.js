"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import AppNav from "@/components/AppNav";
import NewClaimSheet from "@/components/NewClaimSheet";
import ClaimRow from "@/components/claims/ClaimRow";
import MarkPaidSheet from "@/components/claims/MarkPaidSheet";
import ClaimShareSheet from "@/components/claims/ClaimShareSheet";
import Toast, { useToast } from "@/components/Toast";
import { CategoryDot } from "@/components/CategoryPicker";
import { useShop } from "@/lib/store";
import { claimTotal, fmt, formatMonth, formatRelative } from "@/lib/money";
import useCountUp from "@/lib/useCountUp";

const FILTERS = [
  { id: "unpaid", label: "Unpaid" },
  { id: "paid", label: "Paid" },
  { id: "all", label: "All" },
];
const PAGE = 40;

async function downloadPdf(claims, categories) {
  const { downloadClaimsPdf } = await import("@/lib/pdf");
  downloadClaimsPdf(claims, categories);
}

export default function ClaimsPage() {
  const { data, markClaimsPaid } = useShop();
  const claims = data.claims || [];
  const categories = data.categories || [];

  const [filter, setFilter] = useState("unpaid");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState(null);
  const [limit, setLimit] = useState(PAGE);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [newOpen, setNewOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [shareClaims, setShareClaims] = useState(null);
  const [toast, showToast] = useToast();

  const unpaid = claims.filter((c) => !c.paidAt);
  const unpaidTotal = unpaid.reduce((s, c) => s + claimTotal(c), 0);
  const shownTotal = useCountUp(unpaidTotal);
  const oldest = unpaid.reduce((min, c) => Math.min(min, c.spentAt), Infinity);

  const counts = { unpaid: unpaid.length, paid: claims.length - unpaid.length, all: claims.length };

  const usedTags = useMemo(() => {
    const ids = new Set(claims.flatMap((c) => c.items.map((i) => i.categoryId).filter(Boolean)));
    return categories.filter((c) => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [claims, categories]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return claims
      .filter((c) => (filter === "all" ? true : filter === "paid" ? c.paidAt : !c.paidAt))
      .filter((c) => !tag || c.items.some((i) => i.categoryId === tag))
      .filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          (c.note || "").toLowerCase().includes(q) ||
          c.items.some((i) => i.name.toLowerCase().includes(q))
      )
      .sort((a, b) => b.spentAt - a.spentAt);
  }, [claims, filter, tag, query]);

  const months = useMemo(() => {
    const out = [];
    for (const c of visible.slice(0, limit)) {
      const label = formatMonth(c.spentAt);
      let m = out[out.length - 1];
      if (!m || m.label !== label) {
        m = { label, claims: [], total: 0 };
        out.push(m);
      }
      m.claims.push(c);
    }
    // Month totals cover every visible claim in the month, not just the loaded page.
    for (const m of out) m.total = visible.filter((c) => formatMonth(c.spentAt) === m.label).reduce((s, c) => s + claimTotal(c), 0);
    return out;
  }, [visible, limit]);

  const selectedClaims = claims.filter((c) => selected.has(c.id));
  const selectedTotal = selectedClaims.reduce((s, c) => s + claimTotal(c), 0);
  const selectedUnpaid = selectedClaims.filter((c) => !c.paidAt);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const allVisibleSelected = visible.length > 0 && visible.every((c) => selected.has(c.id));

  return (
    <>
      <Header nav wide />

      <main className="page-in mx-auto max-w-2xl px-4 pb-40 pt-5 md:max-w-5xl md:px-6 md:pt-8">
        <div className="flex items-center justify-between gap-3 px-1">
          <h1 className="font-display text-[32px] font-bold leading-none tracking-[-0.03em] text-ink md:text-[40px]">Claims</h1>
          <div className="flex gap-2">
            {claims.length > 0 && (
              <button
                onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
                className="press h-10 rounded-full border border-mist bg-surface px-4 text-sm font-semibold text-ink hover:border-inkSoft/50"
              >
                {selecting ? "Cancel" : "Select"}
              </button>
            )}
            <button
              onClick={() => setNewOpen(true)}
              className="press flex h-10 items-center gap-1.5 rounded-full bg-pine pl-3 pr-4 text-sm font-bold text-paper"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
              New
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[1fr_300px] md:items-start md:gap-8">
          <aside className="md:sticky md:top-24 md:order-2">
            <div className="rounded-3xl border border-mist bg-surface p-5">
              <p className="text-xs text-inkSoft">Outstanding</p>
              <p className="mt-1 font-mono text-[32px] font-bold leading-none tracking-tight text-ink">
                <span className={unpaid.length ? "highlight" : ""}>{fmt(shownTotal)}</span>
              </p>
              <p className="mt-2 text-xs text-inkSoft">
                {unpaid.length
                  ? `${unpaid.length} unpaid claim${unpaid.length === 1 ? "" : "s"} · oldest ${formatRelative(oldest)}`
                  : claims.length
                  ? "Everything's paid up."
                  : "No claims yet."}
              </p>
              {unpaid.length > 0 && (
                <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                  <button
                    onClick={() => setShareClaims(unpaid)}
                    className="press rounded-xl bg-ink py-2.5 text-sm font-bold text-paper"
                  >
                    Send all for review
                  </button>
                  <button
                    onClick={() => downloadPdf(unpaid, categories)}
                    aria-label="Download statement of unpaid claims"
                    className="press flex h-full w-11 items-center justify-center rounded-xl border border-mist text-ink hover:bg-paperDim"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0 md:order-1">
            {claims.length > 0 && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <div role="tablist" aria-label="Status" className="relative grid flex-1 grid-cols-3 rounded-xl bg-paperDim p-1 sm:max-w-sm">
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 top-1 rounded-lg bg-surface shadow-paper transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{
                        left: 4,
                        width: "calc((100% - 8px) / 3)",
                        transform: `translateX(${FILTERS.findIndex((f) => f.id === filter) * 100}%)`,
                      }}
                    />
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        role="tab"
                        aria-selected={filter === f.id}
                        onClick={() => {
                          setFilter(f.id);
                          setLimit(PAGE);
                        }}
                        className={`relative h-9 rounded-lg text-[13px] font-semibold transition-colors ${filter === f.id ? "text-ink" : "text-inkSoft"}`}
                      >
                        {f.label} <span className="font-mono text-[11px] opacity-70">{counts[f.id]}</span>
                      </button>
                    ))}
                  </div>
                  <label className="flex h-11 min-w-[12rem] flex-1 items-center gap-2 rounded-xl border border-mist bg-surface px-3 focus-within:border-pineDark">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-inkSoft" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search claims, items, notes"
                      aria-label="Search claims"
                      className="min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-inkSoft/60 focus:outline-none"
                    />
                  </label>
                </div>

                {usedTags.length > 0 && (
                  <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
                    {[null, ...usedTags].map((t) => {
                      const on = tag === (t?.id ?? null);
                      return (
                        <button
                          key={t?.id ?? "all"}
                          onClick={() => setTag(t?.id ?? null)}
                          className={`press flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold ${
                            on ? "border-ink bg-ink text-paper" : "border-mist text-inkSoft hover:text-ink"
                          }`}
                        >
                          {t && <CategoryDot category={t} className="h-2 w-2" />}
                          {t ? t.name : "All tags"}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {selecting && (
              <div className="mt-4 flex items-center justify-between px-1 text-[13px]">
                <span className="text-inkSoft">Tap claims to select them</span>
                <button
                  onClick={() => setSelected(allVisibleSelected ? new Set() : new Set(visible.map((c) => c.id)))}
                  className="font-semibold text-pineDark"
                >
                  {allVisibleSelected ? "Clear" : `Select all ${visible.length}`}
                </button>
              </div>
            )}

            {claims.length === 0 ? (
              <div className="mt-2 rounded-3xl border border-dashed border-mist px-6 py-12 text-center">
                <p className="font-display text-xl font-bold text-ink">No claims yet</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-inkSoft">
                  Paid for something? List it, add what it cost, and send a link to get paid back.
                </p>
                <button onClick={() => setNewOpen(true)} className="press mt-5 rounded-2xl bg-pine px-6 py-3 text-sm font-bold text-paper">
                  Make your first claim
                </button>
              </div>
            ) : visible.length === 0 ? (
              <p className="mt-10 text-center text-sm text-inkSoft">
                {filter === "unpaid" && !query && !tag ? "Nothing waiting — all paid up." : "No claims match."}
              </p>
            ) : (
              <div className="mt-5 flex flex-col gap-6">
                {months.map((m) => (
                  <section key={m.label}>
                    <div className="mb-2 flex items-baseline justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-inkSoft">
                      <span>{m.label}</span>
                      <span className="font-mono">{fmt(m.total)}</span>
                    </div>
                    <ul className="stagger overflow-hidden rounded-card border border-mist bg-surface">
                      {m.claims.map((c, i) => (
                        <li key={c.id} style={{ "--i": i }} className="border-b border-mist/60 last:border-b-0">
                          <ClaimRow
                            claim={c}
                            categories={categories}
                            selecting={selecting}
                            selected={selected.has(c.id)}
                            onToggle={() => toggle(c.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
                {visible.length > limit && (
                  <button
                    onClick={() => setLimit((l) => l + PAGE)}
                    className="press rounded-2xl border border-mist py-3 text-sm font-semibold text-inkSoft hover:text-ink"
                  >
                    Show more ({visible.length - limit} left)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {selecting && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-3 md:bottom-6">
          <div className="rise-in mx-auto max-w-md rounded-3xl bg-ink p-3 text-paper shadow-lift">
            <div className="flex items-baseline justify-between px-2 pb-2.5">
              <span className="text-[13px] opacity-70">
                {selected.size} claim{selected.size === 1 ? "" : "s"}
              </span>
              <span className="font-mono text-xl font-bold">{fmt(selectedTotal)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => downloadPdf(selectedClaims, categories)}
                className="press rounded-xl bg-paper/10 py-3 text-sm font-semibold hover:bg-paper/15"
              >
                PDF
              </button>
              <button
                onClick={() => setShareClaims(selectedClaims)}
                className="press rounded-xl bg-paper/10 py-3 text-sm font-semibold hover:bg-paper/15"
              >
                Send link
              </button>
              <button
                onClick={() => setPayOpen(true)}
                disabled={selectedUnpaid.length === 0}
                className="press rounded-xl bg-paper py-3 text-sm font-bold text-ink disabled:opacity-40"
              >
                Mark paid
              </button>
            </div>
          </div>
        </div>
      )}

      <AppNav />
      <Toast toast={toast} bottom="bottom-28" />
      <NewClaimSheet open={newOpen} onClose={() => setNewOpen(false)} />
      <MarkPaidSheet
        open={payOpen}
        claims={selectedUnpaid}
        onClose={() => setPayOpen(false)}
        onConfirm={(payment) => {
          markClaimsPaid(selectedUnpaid.map((c) => c.id), payment);
          setPayOpen(false);
          showToast(`${selectedUnpaid.length} marked paid`);
          stopSelecting();
        }}
      />
      <ClaimShareSheet
        open={Boolean(shareClaims)}
        claims={shareClaims || []}
        onClose={() => setShareClaims(null)}
        onDownload={(list) => downloadPdf(list, categories)}
      />
    </>
  );
}

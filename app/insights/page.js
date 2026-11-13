"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import AppNav from "@/components/AppNav";
import Toast, { useToast } from "@/components/Toast";
import { PaceChart, Sparkline } from "@/components/insights/Charts";
import { Card, CardTitle, ChangeChip, Chevron, MonthPicker, tagColor, tagName } from "@/components/insights/parts";
import { useShop } from "@/lib/store";
import { claimTotal, fmt } from "@/lib/money";
import { availableMonths, describeEvery, dueSoon, monthKey, monthLabel, purchasesFrom, summarizeMonth } from "@/lib/insights";
import useCountUp from "@/lib/useCountUp";

const MONTH_KEY = "pokah:insights-month";

function Tile({ label, value }) {
  return (
    <div className="rounded-2xl border border-mist bg-surface px-3 py-2.5">
      <p className="text-[11px] text-inkSoft">{label}</p>
      <p className="mt-0.5 truncate font-mono text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

export default function InsightsPage() {
  const { data, status, addNeededItem } = useShop();
  const categories = data.categories || [];
  const purchases = useMemo(() => purchasesFrom(data.trips), [data.trips]);
  const months = useMemo(() => availableMonths(purchases), [purchases]);
  const [month, setMonth] = useState(null);
  const [toast, showToast] = useToast();

  // Default to the current month if it has anything, else the latest month that does.
  useEffect(() => {
    if (month && months.includes(month)) return;
    let saved = null;
    try {
      saved = sessionStorage.getItem(MONTH_KEY);
    } catch (err) {
      /* storage unavailable */
    }
    if (saved && months.includes(saved)) return setMonth(saved);
    const withData = new Set(purchases.map((p) => monthKey(p.at)));
    setMonth([...months].reverse().find((m) => withData.has(m)) ?? months[months.length - 1]);
  }, [months, purchases, month]);

  const pick = (m) => {
    setMonth(m);
    try {
      sessionStorage.setItem(MONTH_KEY, m);
    } catch (err) {
      /* storage unavailable */
    }
  };

  const key = month ?? months[months.length - 1];
  const summary = useMemo(() => summarizeMonth(purchases, key, categories), [purchases, key, categories]);
  const due = useMemo(() => dueSoon(purchases, data.itemBank), [purchases, data.itemBank]);
  const shownTotal = useCountUp(summary.total);

  const idx = months.indexOf(key);
  const isCurrent = key === monthKey(Date.now());
  const name = monthLabel(key).split(" ")[0];
  const prevName = monthLabel(summary.prevKey).split(" ")[0];
  const change = summary.hasPrev && summary.prevTotal > 0 ? ((summary.total - summary.prevTotal) / summary.prevTotal) * 100 : null;

  const monthClaims = (data.claims || []).filter((c) => monthKey(c.spentAt) === key);
  const claimed = monthClaims.reduce((s, c) => s + claimTotal(c), 0);
  const paidBack = monthClaims.filter((c) => c.paidAt).reduce((s, c) => s + claimTotal(c), 0);

  const oftenMax = Math.max(1, ...summary.often.map((o) => o.times));
  const empty = purchases.length === 0;

  return (
    <>
      <Header nav wide />

      <main className="page-in mx-auto max-w-2xl px-4 pb-28 pt-5 md:max-w-5xl md:px-6 md:pb-16 md:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <h1 className="font-display text-[32px] font-bold leading-none tracking-[-0.03em] text-ink md:text-[40px]">Insights</h1>
          {!empty && (
            <MonthPicker
              label={monthLabel(key)}
              onPrev={idx > 0 ? () => pick(months[idx - 1]) : null}
              onNext={idx < months.length - 1 ? () => pick(months[idx + 1]) : null}
            />
          )}
        </div>

        {empty ? (
          <div className="mt-6 rounded-3xl border border-dashed border-mist px-6 py-12 text-center">
            <p className="font-display text-xl font-bold text-ink">{status === "loading" ? "Loading…" : "Nothing to show yet"}</p>
            {status !== "loading" && (
              <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-inkSoft">
                Insights build up from finished trips. Check items off as you shop and finish the trip — the month's picture
                starts here.
              </p>
            )}
          </div>
        ) : (
          <div key={key} className="stagger mt-6 grid gap-5 md:grid-cols-2 md:gap-6">
            <section style={{ "--i": 0 }} className="flex flex-col justify-between gap-5 px-1">
              <div>
                <p className="text-sm text-inkSoft">{isCurrent ? `So far in ${name}` : `You spent in ${name}`}</p>
                <p className="mt-1 font-mono text-[42px] font-bold leading-none tracking-[-0.04em] text-ink md:text-[54px]">{fmt(shownTotal)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {change != null && <ChangeChip pct={change} suffix={` vs ${prevName}`} />}
                  {summary.hasPrev && (
                    <span className="text-[13px] text-inkSoft">
                      {prevName} was <span className="font-mono">{fmt(summary.prevTotal)}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Tile label="Trips" value={summary.trips} />
                <Tile label="Items" value={summary.items} />
                <Tile label="Avg trip" value={fmt(summary.avgTrip).replace(/\.\d\d$/, "")} />
              </div>
            </section>

            <Card className="md:row-span-1" style={{ "--i": 1 }}>
              <CardTitle>Spending pace</CardTitle>
              <div className="mt-2">
                {summary.total > 0 ? (
                  <PaceChart summary={summary} />
                ) : (
                  <p className="py-8 text-center text-sm text-inkSoft">No finished trips in {name} yet.</p>
                )}
              </div>
            </Card>

            {summary.categories.length > 0 && (
              <Card>
                <CardTitle aside="by tag">Where it went</CardTitle>
                <div role="img" aria-label="Share of spending by tag" className="mt-4 flex h-3.5 gap-[2px]">
                  {summary.categories.map((row, i) => (
                    <div
                      key={row.id}
                      className="grow-x rounded"
                      style={{ "--i": i, flex: `${row.total} 1 0`, backgroundColor: tagColor(row) }}
                    />
                  ))}
                </div>
                <ul className="mt-3 divide-y divide-mist/60">
                  {summary.categories.map((row) => {
                    const pct = summary.total ? Math.round((row.total / summary.total) * 100) : 0;
                    const delta = row.total - row.prev;
                    const body = (
                      <>
                        <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: tagColor(row) }} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] text-ink">{tagName(row)}</span>
                          <span className="block text-xs text-inkSoft">
                            {pct}% of spend
                            {summary.hasPrev &&
                              (row.prev === 0
                                ? ` · new vs ${prevName}`
                                : Math.abs(delta) >= 1
                                ? ` · ${delta > 0 ? "▲" : "▼"} ${fmt(Math.abs(delta))} vs ${prevName}`
                                : ` · same as ${prevName}`)}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-sm font-bold text-ink">{fmt(row.total)}</span>
                      </>
                    );
                    return (
                      <li key={row.id}>
                        {row.other ? (
                          <div className="flex items-center gap-3 py-2.5">{body}</div>
                        ) : (
                          <Link href={`/insights/tag/${row.id}/${key}`} className="group flex items-center gap-3 py-2.5">
                            {body}
                            <Chevron />
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            {summary.prices.length > 0 && (
              <Card>
                <CardTitle aside="vs. last time bought">Price watch</CardTitle>
                <ul className="mt-2 divide-y divide-mist/60">
                  {summary.prices.map((p) => (
                    <li key={p.key}>
                      <Link href={`/insights/item/${encodeURIComponent(p.key)}`} className="group flex items-center gap-3 py-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] text-ink">{p.name}</span>
                          <span className="block font-mono text-xs text-inkSoft">
                            {fmt(p.from)} → {fmt(p.to)}
                          </span>
                        </span>
                        <Sparkline values={p.history} />
                        <ChangeChip pct={p.pct} />
                        <Chevron />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {summary.often.length > 0 && (
              <Card>
                <CardTitle>Bought most often</CardTitle>
                <ul className="mt-2">
                  {summary.often.map((o, i) => (
                    <li key={o.key}>
                      <Link href={`/insights/item/${encodeURIComponent(o.key)}`} className="block py-2">
                        <span className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="truncate text-ink">{o.name}</span>
                          <span className="shrink-0 text-inkSoft">
                            <span className="font-mono text-ink">{o.times}×</span> · {fmt(o.spend)}
                          </span>
                        </span>
                        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-mist/60">
                          <span className="grow-x block h-full rounded-full bg-pineDark" style={{ "--i": i, width: `${(o.times / oftenMax) * 100}%` }} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {due.length > 0 && (
              <Card>
                <CardTitle>Probably due soon</CardTitle>
                <p className="mt-0.5 text-xs text-inkSoft">From how often you usually buy them</p>
                <ul className="mt-2 divide-y divide-mist/60">
                  {due.map((d) => (
                    <li key={d.key} className="flex items-center gap-3 py-2.5">
                      <Link href={`/insights/item/${encodeURIComponent(d.key)}`} className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-ink">{d.name}</span>
                        <span className="block text-xs text-inkSoft">
                          {describeEvery(d.every)[0].toUpperCase() + describeEvery(d.every).slice(1)} · last bought {d.since} days ago
                        </span>
                      </Link>
                      <button
                        onClick={() => {
                          addNeededItem(d.name);
                          showToast(`${d.name} added to the list`);
                        }}
                        className="press h-9 shrink-0 rounded-xl border border-mist bg-paperDim px-3 text-[13px] font-semibold text-ink hover:border-inkSoft/50"
                      >
                        + List
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {monthClaims.length > 0 && (
              <Card>
                <CardTitle
                  aside={
                    <Link href="/claims" className="hover:text-ink">
                      Open →
                    </Link>
                  }
                >
                  Claims in {name}
                </CardTitle>
                <p className="mt-2 font-mono text-2xl font-bold text-ink">
                  {fmt(claimed)}{" "}
                  <span className="font-body text-[13px] font-normal text-inkSoft">
                    across {monthClaims.length} claim{monthClaims.length === 1 ? "" : "s"}
                  </span>
                </p>
                {claimed > 0 && (
                  <>
                    <div role="img" aria-label={`Paid back ${fmt(paidBack)}, still out ${fmt(claimed - paidBack)}`} className="mt-3 flex h-2.5 gap-[2px]">
                      {paidBack > 0 && <div className="grow-x rounded bg-pineDark" style={{ flex: `${paidBack} 1 0` }} />}
                      {claimed - paidBack > 0 && <div className="grow-x rounded bg-mist" style={{ "--i": 1, flex: `${claimed - paidBack} 1 0` }} />}
                    </div>
                    <div className="mt-2 flex flex-wrap justify-between gap-2 text-[13px]">
                      <span className="flex items-center gap-1.5 text-ink">
                        <span className="h-2 w-2 rounded-sm bg-pineDark" />
                        Paid back <span className="font-mono">{fmt(paidBack)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-inkSoft">
                        <span className="h-2 w-2 rounded-sm bg-mist" />
                        Still out <span className="font-mono text-ink">{fmt(claimed - paidBack)}</span>
                      </span>
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>
        )}
      </main>

      <AppNav />
      <Toast toast={toast} bottom="bottom-28" />
    </>
  );
}

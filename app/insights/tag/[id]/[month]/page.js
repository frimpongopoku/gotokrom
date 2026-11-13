"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { MonthBars } from "@/components/insights/Charts";
import { Card, CardTitle, ChangeChip, Chevron, NEUTRAL } from "@/components/insights/parts";
import { categoryColor } from "@/components/CategoryPicker";
import { useShop } from "@/lib/store";
import { fmt } from "@/lib/money";
import { monthLabel, purchasesFrom, summarizeMonth, tagItems, tagMonths } from "@/lib/insights";
import useCountUp from "@/lib/useCountUp";

const SHOWN = 12;

export default function TagInsightsPage({ params }) {
  const router = useRouter();
  const { data } = useShop();
  const categories = data.categories || [];
  const id = params.id;
  const key = params.month;
  const category = id === "none" ? null : categories.find((c) => c.id === id) ?? null;
  const color = category ? categoryColor(category) : NEUTRAL;
  const name = category ? category.name : "No tag";

  const purchases = useMemo(() => purchasesFrom(data.trips), [data.trips]);
  const summary = useMemo(() => summarizeMonth(purchases, key, categories), [purchases, key, categories]);
  const months = useMemo(() => tagMonths(purchases, id, key, 6), [purchases, id, key]);
  const items = useMemo(() => tagItems(purchases, id, key), [purchases, id, key]);

  const total = months[months.length - 1].total;
  const prev = months[months.length - 2].total;
  const shown = useCountUp(total);
  const share = summary.total ? Math.round((total / summary.total) * 100) : 0;
  const monthName = monthLabel(key).split(" ")[0];
  const prevName = monthLabel(months[months.length - 2].key).split(" ")[0];
  const top = Math.max(1, ...items.map((i) => i.spend));

  return (
    <>
      <Header back={() => router.push("/insights")} title={name} subtitle={`Insights · ${monthLabel(key)}`} wide />

      <main className="page-in mx-auto max-w-2xl px-4 pb-16 pt-5 md:max-w-5xl md:px-6 md:pt-8">
        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <section className="px-1">
            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded" style={{ backgroundColor: color }} />
              <h1 className="font-display text-[30px] font-bold tracking-[-0.03em] text-ink">{name}</h1>
            </div>
            <p className="mt-2 font-mono text-[38px] font-bold leading-none tracking-[-0.03em] text-ink">{fmt(shown)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-inkSoft">
              <span>
                {share}% of {monthName}
              </span>
              {prev > 0 && <ChangeChip pct={((total - prev) / prev) * 100} suffix={` vs ${prevName}`} />}
            </div>
          </section>

          <Card>
            <CardTitle>Last 6 months</CardTitle>
            <div className="mt-3">
              <MonthBars months={months} color={color} selectedKey={key} />
            </div>
          </Card>

          <Card className="md:col-span-2">
            <CardTitle aside={`${items.length} item${items.length === 1 ? "" : "s"} · by spend`}>What you bought</CardTitle>
            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-inkSoft">Nothing under this tag in {monthName}.</p>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_3rem_5.5rem_14px] gap-2 border-b border-mist/60 pb-2 text-[11px] uppercase tracking-wider text-inkSoft">
                  <span>Item</span>
                  <span className="text-right">Times</span>
                  <span className="text-right">Spent</span>
                  <span />
                </div>
                <ul className="stagger divide-y divide-mist/60 md:grid md:grid-cols-1">
                  {items.slice(0, SHOWN).map((it, i) => (
                    <li key={it.key} style={{ "--i": i }}>
                      <Link
                        href={`/insights/item/${encodeURIComponent(it.key)}`}
                        className="group grid grid-cols-[minmax(0,1fr)_3rem_5.5rem_14px] items-center gap-2 py-2.5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] text-ink">{it.name}</span>
                          <span className="mt-1.5 block h-1 overflow-hidden rounded-full">
                            <span className="grow-x block h-full rounded-full" style={{ "--i": i, width: `${(it.spend / top) * 100}%`, backgroundColor: color }} />
                          </span>
                        </span>
                        <span className="text-right font-mono text-[13px] text-inkSoft">{it.times}×</span>
                        <span className="text-right font-mono text-sm font-bold text-ink">{fmt(it.spend)}</span>
                        <Chevron />
                      </Link>
                    </li>
                  ))}
                </ul>
                {items.length > SHOWN && <p className="pt-3 text-xs text-inkSoft">+ {items.length - SHOWN} smaller items</p>}
              </>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Toast, { useToast } from "@/components/Toast";
import { PriceChart } from "@/components/insights/Charts";
import { Card, CardTitle, ChangeChip, Chevron, NEUTRAL } from "@/components/insights/parts";
import { categoryColor } from "@/components/CategoryPicker";
import { useShop } from "@/lib/store";
import { fmt, formatDate } from "@/lib/money";
import { describeEvery, itemDetail, itemKey, purchasesFrom } from "@/lib/insights";

function Tile({ label, value }) {
  return (
    <div className="rounded-2xl border border-mist bg-surface px-3 py-2.5">
      <p className="text-[11px] text-inkSoft">{label}</p>
      <p className="mt-0.5 truncate font-mono text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

export default function ItemInsightsPage({ params }) {
  const router = useRouter();
  const { data, status, addNeededItem } = useShop();
  const [toast, showToast] = useToast();
  const key = decodeURIComponent(params.key);
  const purchases = useMemo(() => purchasesFrom(data.trips), [data.trips]);
  const detail = useMemo(() => itemDetail(purchases, key), [purchases, key]);

  if (!detail) {
    return (
      <>
        <Header back={() => router.push("/insights")} title={status === "loading" ? "Loading…" : "Item not found"} />
        {status !== "loading" && (
          <main className="mx-auto max-w-xl px-4 py-10 text-center text-sm text-inkSoft">No finished trips include this item.</main>
        )}
      </>
    );
  }

  const category = (data.categories || []).find((c) => c.id === detail.categoryId) ?? null;
  const color = category ? categoryColor(category) : NEUTRAL;
  const onList = data.itemBank.some((i) => i.needed && itemKey(i.name) === key);
  const history = [...detail.purchases].reverse();

  return (
    <>
      <Header back={() => router.back()} title={detail.name} subtitle={category ? category.name : "Item"} wide />

      <main className="page-in mx-auto max-w-2xl px-4 pb-16 pt-5 md:max-w-5xl md:px-6 md:pt-8">
        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <section className="flex flex-col gap-5 px-1">
            <div>
              <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-ink">{detail.name}</h1>
              {detail.last ? (
                <>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
                    <span className="font-mono text-[38px] font-bold leading-none tracking-[-0.03em] text-ink">{fmt(detail.last.price)}</span>
                    <span className="text-sm text-inkSoft">last paid · {formatDate(detail.last.at)}</span>
                  </div>
                  {detail.change != null && detail.priced.length > 1 && Math.abs(detail.change) >= 0.05 && (
                    <div className="mt-3">
                      <ChangeChip
                        pct={detail.change}
                        suffix={` since ${new Date(detail.first.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} (${fmt(detail.first.price)})`}
                      />
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-inkSoft">No price recorded yet.</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Tile label="Bought" value={`${detail.times}×`} />
              <Tile label="Usually" value={detail.every ? describeEvery(detail.every).replace("every ", "") : "—"} />
              <Tile label="Avg price" value={detail.avgPrice != null ? fmt(detail.avgPrice) : "—"} />
            </div>
            <button
              onClick={() => {
                addNeededItem(detail.name);
                showToast("Added to running low");
              }}
              disabled={onList}
              className="press rounded-2xl bg-pine py-3.5 text-[15px] font-bold text-paper disabled:opacity-40"
            >
              {onList ? "Already on the list" : "Add to running low"}
            </button>
          </section>

          {detail.priced.length > 0 && (
            <Card>
              <CardTitle>Price each time</CardTitle>
              <div className="mt-3">
                <PriceChart points={detail.priced} color={color} />
              </div>
            </Card>
          )}

          <Card className="md:col-span-2">
            <CardTitle aside={`${detail.times} time${detail.times === 1 ? "" : "s"}`}>Every purchase</CardTitle>
            <ul className="stagger mt-2 divide-y divide-mist/60">
              {history.map((p, i) => (
                <li key={`${p.tripId}-${i}`} style={{ "--i": i }}>
                  <Link href={`/trip/${p.tripId}`} className="group flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-ink">{p.tripName}</span>
                      <span className="block text-xs text-inkSoft">
                        {formatDate(p.at)}
                        {p.qty > 1 ? ` · ×${p.qty}` : ""}
                      </span>
                    </span>
                    <span className="font-mono text-sm font-bold text-ink">{p.price != null ? fmt(p.price) : "—"}</span>
                    <Chevron />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </main>

      <Toast toast={toast} bottom="bottom-8" />
    </>
  );
}

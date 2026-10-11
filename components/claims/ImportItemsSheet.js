"use client";

import { useEffect, useMemo, useState } from "react";
import Sheet from "../Sheet";
import { useShop } from "@/lib/store";
import { fmt, formatDate } from "@/lib/money";
import { CategoryDot } from "../CategoryPicker";

const SOURCES = [
  { id: "trip", label: "A trip" },
  { id: "house", label: "House list" },
  { id: "past", label: "Past items" },
];

function hasPrice(p) {
  return p !== "" && p != null;
}

// Pulls items into a claim from a trip, the house list or anything bought before.
// Trip items already on another claim are flagged so nothing gets claimed twice.
export default function ImportItemsSheet({ open, claim, onClose, onAdd }) {
  const { data } = useShop();
  const categories = data.categories || [];
  const [source, setSource] = useState("trip");
  const [tripId, setTripId] = useState(null);
  const [picked, setPicked] = useState(() => new Set());
  const [query, setQuery] = useState("");

  const trips = useMemo(
    () =>
      [...data.trips]
        .filter((t) => t.items.length)
        .sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt)),
    [data.trips]
  );

  // Where each trip item has already been claimed, keyed by trip item id.
  const claimedIn = useMemo(() => {
    const map = new Map();
    for (const c of data.claims || []) {
      for (const i of c.items) if (i.sourceItemId) map.set(i.sourceItemId, c);
    }
    return map;
  }, [data.claims]);

  const trip = trips.find((t) => t.id === tripId) ?? null;

  const rows = useMemo(() => {
    if (source === "trip") {
      if (!trip) return [];
      return trip.items.map((i) => {
        const other = claimedIn.get(i.id);
        return {
          key: i.id,
          name: i.name,
          qty: i.qty,
          price: i.price,
          categoryId: i.categoryId ?? null,
          sourceItemId: i.id,
          blockedBy: other ? (other.id === claim?.id ? "Already on this claim" : `On “${other.title}”`) : null,
        };
      });
    }
    const bank = source === "house" ? data.itemBank.filter((i) => i.needed) : data.itemBank;
    const q = query.trim().toLowerCase();
    return bank
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((i) => ({ key: i.id, name: i.name, qty: 1, price: i.lastPrice ?? "", categoryId: null, sourceItemId: null, blockedBy: null }));
  }, [source, trip, data.itemBank, claimedIn, claim?.id, query]);

  useEffect(() => {
    if (!open) return;
    setSource(trips.length ? "trip" : "past");
    setTripId(null);
    setQuery("");
  }, [open, trips.length]);

  // Fresh selection whenever the list changes: everything claimable that has a price.
  useEffect(() => {
    setPicked(new Set(source === "trip" ? rows.filter((r) => !r.blockedBy && hasPrice(r.price)).map((r) => r.key) : []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, tripId]);

  const toggle = (key) =>
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const selectable = rows.filter((r) => !r.blockedBy);
  const allPicked = selectable.length > 0 && selectable.every((r) => picked.has(r.key));
  const chosen = rows.filter((r) => picked.has(r.key));
  const total = chosen.reduce((s, r) => s + (Number(r.price) || 0) * (Number(r.qty) || 1), 0);

  const submit = () => {
    onAdd(chosen.map(({ name, qty, price, categoryId, sourceItemId }) => ({ name, qty, price, categoryId, sourceItemId })));
    onClose();
  };

  const showTripPicker = source === "trip" && !trip;

  return (
    <Sheet open={open} onClose={onClose} label="Add items to claim" className="sm:max-w-lg">
      <div className="shrink-0 px-5 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Add items</h2>
          <button onClick={onClose} aria-label="Close" className="press flex h-10 w-10 items-center justify-center rounded-full bg-paperDim text-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div role="tablist" className="relative mt-3 grid grid-cols-3 rounded-xl bg-paperDim p-1">
          <span
            aria-hidden="true"
            className="absolute bottom-1 top-1 rounded-lg bg-surface shadow-paper transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ left: 4, width: "calc((100% - 8px) / 3)", transform: `translateX(${SOURCES.findIndex((s) => s.id === source) * 100}%)` }}
          />
          {SOURCES.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={source === s.id}
              onClick={() => {
                setSource(s.id);
                setTripId(null);
              }}
              className={`relative h-10 rounded-lg text-[13px] font-semibold transition-colors ${source === s.id ? "text-ink" : "text-inkSoft"}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {source === "trip" && trip && (
          <button
            onClick={() => setTripId(null)}
            className="press mt-3 flex w-full items-center gap-3 rounded-2xl border border-mist bg-surface px-4 py-2.5 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-ink">{trip.name}</span>
              <span className="block text-xs text-inkSoft">
                {formatDate(trip.completedAt || trip.createdAt)} · {trip.items.length} items
              </span>
            </span>
            <span className="text-[13px] font-semibold text-pineDark">Change</span>
          </button>
        )}

        {source !== "trip" && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items…"
            aria-label="Search items"
            className="mt-3 w-full rounded-xl border border-mist bg-surface px-4 py-2.5 text-[16px] text-ink placeholder:text-inkSoft/60 focus:border-pineDark focus:outline-none"
          />
        )}

        {!showTripPicker && rows.length > 0 && (
          <div className="mt-3 flex items-center justify-between px-1 text-[13px]">
            <span className="text-inkSoft">
              {picked.size} of {selectable.length} selected
            </span>
            <button
              onClick={() => setPicked(allPicked ? new Set() : new Set(selectable.map((r) => r.key)))}
              className="font-semibold text-pineDark"
            >
              {allPicked ? "Clear" : "Select all"}
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-2">
        {showTripPicker ? (
          trips.length ? (
            <ul className="stagger overflow-hidden rounded-2xl border border-mist bg-surface">
              {trips.map((t, i) => {
                const left = t.items.filter((it) => !claimedIn.has(it.id)).length;
                return (
                  <li key={t.id} style={{ "--i": i }} className="border-b border-mist/60 last:border-b-0">
                    <button onClick={() => setTripId(t.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paperDim">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-ink">{t.name}</span>
                        <span className="block text-xs text-inkSoft">
                          {formatDate(t.completedAt || t.createdAt)} · {left ? `${left} unclaimed` : "all claimed"}
                        </span>
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-inkSoft">
                        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-inkSoft">No trips with items yet.</p>
          )
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-inkSoft">
            {source === "house" ? "Nothing on the house list right now." : "No items found."}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-mist bg-surface">
            {rows.map((r) => {
              const on = picked.has(r.key);
              const category = categories.find((c) => c.id === r.categoryId);
              return (
                <li key={r.key} className="border-b border-mist/60 last:border-b-0">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    disabled={Boolean(r.blockedBy)}
                    onClick={() => toggle(r.key)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors disabled:opacity-50 ${on ? "bg-pine/[0.07]" : "hover:bg-paperDim"}`}
                  >
                    <span
                      className={`stamp flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
                        on ? "border-pine bg-pine text-paper" : "border-mist"
                      }`}
                    >
                      {on && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="check-draw">
                          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-ink">
                        {r.name}
                        {Number(r.qty) > 1 && <span className="ml-1.5 font-mono text-xs text-inkSoft">×{r.qty}</span>}
                      </span>
                      <span className={`flex items-center gap-1.5 text-[11px] ${r.blockedBy ? "text-yolkDark" : "text-inkSoft"}`}>
                        {category && <CategoryDot category={category} className="h-1.5 w-1.5" />}
                        {r.blockedBy || (category ? category.name : hasPrice(r.price) ? "" : "No price yet")}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-sm font-semibold text-ink">
                      {hasPrice(r.price) ? fmt(Number(r.price) * (Number(r.qty) || 1)) : "—"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-mist bg-paper px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <button
          onClick={submit}
          disabled={chosen.length === 0}
          className="press flex w-full items-center justify-center gap-3 rounded-2xl bg-pine py-3.5 text-[15px] font-bold text-paper disabled:opacity-40"
        >
          {chosen.length ? `Add ${chosen.length} item${chosen.length === 1 ? "" : "s"}` : "Pick items to add"}
          {chosen.length > 0 && <span className="font-mono opacity-80">{fmt(total)}</span>}
        </button>
      </div>
    </Sheet>
  );
}

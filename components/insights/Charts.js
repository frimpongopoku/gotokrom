"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "@/lib/money";
import { daysInMonth, monthKey, monthLabel, monthStart } from "@/lib/insights";

// Charts render at their real pixel width (not a scaled viewBox) so text stays legible on phones.
function useWidth(fallback = 320) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.round(entry.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

export function niceMax(v) {
  if (v <= 0) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * pow >= v) return m * pow;
  return 10 * pow;
}

export function shortMoney(v) {
  if (v >= 1000) return `₵${Number((v / 1000).toFixed(1))}k`;
  return `₵${Math.round(v)}`;
}

function Tooltip({ left, width, children }) {
  const w = 164;
  const x = Math.min(Math.max(left - w / 2, 0), width - w);
  return (
    <div
      className="pointer-events-none absolute top-1 z-10 rounded-xl border border-mist bg-paperDim px-3 py-2 text-xs shadow-lift"
      style={{ left: x, width: w }}
    >
      {children}
    </div>
  );
}

function SeriesRow({ swatch, label, value, strong }) {
  return (
    <div className="mt-0.5 flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-inkSoft">
        {swatch}
        {label}
      </span>
      <span className={`font-mono ${strong ? "font-bold text-ink" : "text-ink"}`}>{value}</span>
    </div>
  );
}

const lineSwatch = <span className="h-0.5 w-3 rounded bg-pineDark" />;
const dashSwatch = <span className="w-3 border-t-2 border-dashed border-inkSoft" />;

function cumAt(pace, day) {
  let v = 0;
  for (const p of pace) if (p.day <= day) v = p.cum;
  return v;
}

// Running total through the month as a step line, with last month dashed behind it.
export function PaceChart({ summary, now = Date.now() }) {
  const [ref, width] = useWidth();
  const [hoverDay, setHoverDay] = useState(null);
  const [table, setTable] = useState(false);

  const { key, prevKey, pace, prevPace, hasPrev } = summary;
  const days = daysInMonth(key);
  const isCurrent = key === monthKey(now);
  const endDay = isCurrent ? new Date(now).getDate() : days;
  const prevEnd = Math.min(daysInMonth(prevKey), days);
  const max = niceMax(Math.max(summary.total, hasPrev ? cumAt(prevPace, prevEnd) : 0));

  const H = 200;
  const pad = { l: 42, r: 12, t: 14, b: 26 };
  const X = (d) => pad.l + ((d - 1) / (days - 1)) * (width - pad.l - pad.r);
  const Y = (v) => H - pad.b - (v / max) * (H - pad.b - pad.t);
  const path = (list, end) => {
    let d = `M${X(1)} ${Y(0)}`;
    for (const p of list) d += ` H${X(p.day)} V${Y(p.cum)}`;
    return `${d} H${X(end)}`;
  };

  const mon = monthLabel(key, "short");
  const prevMon = monthLabel(prevKey, "short");
  const ticks = [0, max / 2, max];
  const xTicks = [1, 8, 15, 22, 29].filter((d) => d <= days);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left - pad.l) / (rect.width - pad.l - pad.r);
    setHoverDay(Math.min(days, Math.max(1, Math.round(ratio * (days - 1)) + 1)));
  };

  const here = cumAt(pace, endDay);
  const there = cumAt(prevPace, Math.min(endDay, prevEnd));
  const diff = here - there;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-4 text-xs text-inkSoft">
          <span className="flex items-center gap-1.5">{lineSwatch}{mon}</span>
          {hasPrev && <span className="flex items-center gap-1.5">{dashSwatch}{prevMon}</span>}
        </div>
        <button onClick={() => setTable((t) => !t)} className="text-xs font-semibold text-inkSoft underline-offset-4 hover:text-ink hover:underline">
          {table ? "View as chart" : "View as table"}
        </button>
      </div>

      {table ? (
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-inkSoft">
              <th className="py-1.5 font-medium">Date</th>
              <th className="py-1.5 font-medium">Trip</th>
              <th className="py-1.5 text-right font-medium">Spent</th>
              <th className="py-1.5 text-right font-medium">Running</th>
            </tr>
          </thead>
          <tbody>
            {pace.map((p) => (
              <tr key={p.at} className="border-t border-mist/60">
                <td className="py-2 text-inkSoft">{p.day} {mon}</td>
                <td className="max-w-[9rem] truncate py-2 text-ink">{p.name}</td>
                <td className="py-2 text-right font-mono text-ink">{fmt(p.amount)}</td>
                <td className="py-2 text-right font-mono font-bold text-ink">{fmt(p.cum)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div ref={ref} className="relative mt-2">
          <svg
            width={width}
            height={H}
            role="img"
            aria-label={`Running total of spending through ${monthLabel(key)}${hasPrev ? ` compared with ${monthLabel(prevKey)}` : ""}`}
            onPointerMove={onMove}
            onPointerLeave={() => setHoverDay(null)}
            className="block touch-pan-y"
          >
            {ticks.map((v) => (
              <g key={v}>
                <line x1={pad.l} x2={width - pad.r} y1={Y(v)} y2={Y(v)} className="stroke-mist/70" strokeWidth="1" />
                <text x={pad.l - 6} y={Y(v) + 3} textAnchor="end" fontSize="10" className="fill-inkSoft font-mono">
                  {shortMoney(v)}
                </text>
              </g>
            ))}
            {xTicks.map((d) => (
              <text key={d} x={X(d)} y={H - 8} textAnchor="middle" fontSize="10" className="fill-inkSoft">
                {d} {mon}
              </text>
            ))}
            {hasPrev && (
              <path d={path(prevPace, prevEnd)} fill="none" strokeWidth="2" strokeDasharray="4 4" className="fade-late stroke-inkSoft/70" />
            )}
            <path key={key} d={path(pace, endDay)} pathLength="1" fill="none" strokeWidth="2" strokeLinejoin="round" className="draw-line stroke-pineDark" />
            {hoverDay && (
              <g>
                <line x1={X(hoverDay)} x2={X(hoverDay)} y1={pad.t} y2={H - pad.b} className="stroke-inkSoft" strokeWidth="1" />
                {hasPrev && hoverDay <= prevEnd && (
                  <circle cx={X(hoverDay)} cy={Y(cumAt(prevPace, hoverDay))} r="4" className="fill-inkSoft stroke-surface" strokeWidth="2" />
                )}
                {hoverDay <= endDay && (
                  <circle cx={X(hoverDay)} cy={Y(cumAt(pace, hoverDay))} r="5" className="fill-pineDark stroke-surface" strokeWidth="2" />
                )}
              </g>
            )}
          </svg>
          {hoverDay && (
            <Tooltip left={X(hoverDay)} width={width}>
              <p className="text-inkSoft">By {hoverDay} {mon}</p>
              {hoverDay <= endDay && <SeriesRow swatch={lineSwatch} label={mon} value={fmt(cumAt(pace, hoverDay))} strong />}
              {hasPrev && hoverDay <= prevEnd && <SeriesRow swatch={dashSwatch} label={prevMon} value={fmt(cumAt(prevPace, hoverDay))} />}
            </Tooltip>
          )}
        </div>
      )}

      {hasPrev && summary.total > 0 && Math.abs(diff) >= 1 && (
        <p className="mt-3 text-[13px] leading-relaxed text-inkSoft">
          {isCurrent ? "So far you're " : "You finished "}
          <span className="font-semibold text-ink">
            {fmt(Math.abs(diff))} {diff > 0 ? "ahead of" : "under"}
          </span>{" "}
          {monthLabel(prevKey, "long").split(" ")[0]}
          {isCurrent ? ` at the same point.` : "."}
        </p>
      )}
    </div>
  );
}

// One bar per month for a single tag; the selected month is solid, the rest muted.
export function MonthBars({ months, color, selectedKey }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const H = 180;
  const pad = { l: 8, r: 8, t: 22, b: 26 };
  const max = niceMax(Math.max(...months.map((m) => m.total), 1));
  const slot = (width - pad.l - pad.r) / months.length;
  const barW = Math.min(44, slot * 0.62);
  const Y = (v) => H - pad.b - (v / max) * (H - pad.b - pad.t);
  const withData = months.filter((m) => m.total > 0);
  const avg = withData.length ? withData.reduce((s, m) => s + m.total, 0) / withData.length : 0;

  return (
    <div ref={ref} className="relative">
      <svg width={width} height={H} role="img" aria-label="Spending per month for this tag" className="block">
        {avg > 0 && (
          <line x1={pad.l} x2={width - pad.r} y1={Y(avg)} y2={Y(avg)} className="stroke-inkSoft/70" strokeWidth="1" strokeDasharray="3 4" />
        )}
        <line x1={pad.l} x2={width - pad.r} y1={H - pad.b} y2={H - pad.b} className="stroke-mist" strokeWidth="1" />
        {months.map((m, i) => {
          const x = pad.l + i * slot + (slot - barW) / 2;
          const selected = m.key === selectedKey;
          return (
            <g key={m.key} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              <rect x={pad.l + i * slot} y={pad.t} width={slot} height={H - pad.t} fill="transparent" />
              {m.total > 0 && (
                <rect
                  x={x}
                  y={Y(m.total)}
                  width={barW}
                  height={H - pad.b - Y(m.total)}
                  rx="4"
                  fill={color}
                  fillOpacity={selected || hover === i ? 1 : 0.45}
                  className="grow-up transition-[fill-opacity]"
                  style={{ "--i": i }}
                />
              )}
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" className={selected ? "fill-ink font-semibold" : "fill-inkSoft"}>
                {monthStart(m.key).toLocaleDateString("en-US", { month: "short" })}
              </text>
              {selected && m.total > 0 && (
                <text x={x + barW / 2} y={Y(m.total) - 7} textAnchor="middle" fontSize="11" className="fill-ink font-mono font-semibold">
                  {shortMoney(m.total)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <Tooltip left={pad.l + hover * slot + slot / 2} width={width}>
          <p className="text-inkSoft">{monthLabel(months[hover].key)}</p>
          <p className="mt-0.5 font-mono font-bold text-ink">{fmt(months[hover].total)}</p>
        </Tooltip>
      )}
      {avg > 0 && <p className="mt-1 text-xs text-inkSoft">Dashed line: average {fmt(avg)} a month</p>}
    </div>
  );
}

// Price paid each time an item was bought.
export function PriceChart({ points, color = "#3987E5" }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const H = 180;
  const pad = { l: 44, r: 16, t: 18, b: 26 };
  const prices = points.map((p) => p.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const span = hi - lo || hi * 0.2 || 1;
  const min = Math.max(0, lo - span * 0.35);
  const max = hi + span * 0.35;
  const X = (i) => (points.length === 1 ? width / 2 : pad.l + (i / (points.length - 1)) * (width - pad.l - pad.r));
  const Y = (v) => H - pad.b - ((v - min) / (max - min)) * (H - pad.b - pad.t);
  const d = points.map((p, i) => `${i ? "L" : "M"}${X(i)} ${Y(p.price)}`).join(" ");
  const ticks = [min, (min + max) / 2, max];
  const labelEvery = Math.ceil(points.length / 6);

  return (
    <div ref={ref} className="relative">
      <svg width={width} height={H} role="img" aria-label="Price paid each time this item was bought" className="block">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={width - pad.r} y1={Y(v)} y2={Y(v)} className="stroke-mist/70" strokeWidth="1" />
            <text x={pad.l - 6} y={Y(v) + 3} textAnchor="end" fontSize="10" className="fill-inkSoft font-mono">
              ₵{v.toFixed(v < 100 ? 1 : 0)}
            </text>
          </g>
        ))}
        {points.length > 1 && (
          <path key={points.length} d={d} pathLength="1" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" className="draw-line" />
        )}
        {points.map((p, i) => (
          <g key={p.at + "-" + i} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            <circle cx={X(i)} cy={Y(p.price)} r="14" fill="transparent" />
            <circle cx={X(i)} cy={Y(p.price)} r={hover === i ? 6 : 4.5} fill={color} className="stroke-surface transition-all" strokeWidth="2" />
            {i % labelEvery === 0 || i === points.length - 1 ? (
              <text x={X(i)} y={H - 8} textAnchor="middle" fontSize="10" className="fill-inkSoft">
                {new Date(p.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      {hover != null && (
        <Tooltip left={X(hover)} width={width}>
          <p className="truncate text-inkSoft">{points[hover].tripName}</p>
          <p className="mt-0.5 font-mono font-bold text-ink">{fmt(points[hover].price)}</p>
        </Tooltip>
      )}
    </div>
  );
}

export function Sparkline({ values, width = 64, height = 26 }) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => [3 + (i / (values.length - 1)) * (width - 6), height - 4 - ((v - lo) / span) * (height - 8)]);
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} aria-hidden="true" className="shrink-0">
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" className="stroke-inkSoft" />
      <circle cx={last[0]} cy={last[1]} r="2.5" className="fill-ink" />
    </svg>
  );
}

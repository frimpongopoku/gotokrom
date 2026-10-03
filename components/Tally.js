"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "@/lib/money";
import { categoryColor } from "./CategoryPicker";

function useFlash(value) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 480);
      return () => clearTimeout(t);
    }
  }, [value]);

  return flash;
}

// One segment per category, sized by its share of the planned total and
// filled by how much of it is already in the cart.
function BasketMeter({ groups, planned }) {
  const segments = groups.filter((g) => g.planned > 0);
  if (planned <= 0 || segments.length === 0) {
    return <div className="h-2 rounded-full bg-mist/70" />;
  }
  return (
    <div className="flex h-2 gap-[3px]" aria-hidden="true">
      {segments.map((g) => {
        const color = categoryColor(g.category);
        return (
          <div
            key={g.category?.id ?? "none"}
            className="relative overflow-hidden rounded-full"
            style={{ flexGrow: g.planned, flexBasis: 0, backgroundColor: g.category ? `${color}40` : "rgb(var(--color-mist))" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${(g.inCart / g.planned) * 100}%`, backgroundColor: color }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function Tally({ inCart, planned, groups = [] }) {
  const cartFlash = useFlash(inCart);
  const plannedFlash = useFlash(planned);

  return (
    <div className="px-4 pt-3">
      <BasketMeter groups={groups} planned={planned} />
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="text-xs text-inkSoft">
          In cart{" "}
          <span className={`ml-1 font-mono text-base font-bold text-pineDark min-[360px]:text-lg ${cartFlash ? "tally-flash" : ""}`}>
            {fmt(inCart)}
          </span>
        </p>
        <p className="text-xs text-inkSoft">
          of{" "}
          <span className={`ml-1 font-mono text-base font-bold text-ink min-[360px]:text-lg ${plannedFlash ? "tally-flash" : ""}`}>
            {fmt(planned)}
          </span>
        </p>
      </div>
    </div>
  );
}

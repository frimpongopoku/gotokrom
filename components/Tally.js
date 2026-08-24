"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "@/lib/money";

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

export default function Tally({ inCart, planned }) {
  const cartFlash = useFlash(inCart);
  const plannedFlash = useFlash(planned);

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-mist bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-3.5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-inkSoft">In cart</p>
          <p className={`font-mono text-xl font-bold text-pineDark ${cartFlash ? "tally-flash" : ""}`}>
            {fmt(inCart)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-inkSoft">Planned total</p>
          <p className={`font-mono text-xl font-bold text-ink ${plannedFlash ? "tally-flash" : ""}`}>
            {fmt(planned)}
          </p>
        </div>
      </div>
    </div>
  );
}

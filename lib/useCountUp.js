"use client";

import { useEffect, useRef, useState } from "react";

// Eases a number from its previous value (0 on mount) to the new one, for totals that tick up.
export default function useCountUp(value, duration = 650) {
  const [shown, setShown] = useState(0);
  const fromRef = useRef(0);
  const shownRef = useRef(0);

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    fromRef.current = from;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (value - from) * eased;
      shownRef.current = next;
      setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return shown;
}

"use client";

import { useCallback, useEffect, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const show = useCallback((message) => setToast({ message, key: Date.now() }), []);
  return [toast, show];
}

export default function Toast({ toast, bottom = "bottom-24" }) {
  if (!toast) return null;
  return (
    <div className={`pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4 ${bottom}`} role="status">
      <div key={toast.key} className="rise-in flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper shadow-lift">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {toast.message}
      </div>
    </div>
  );
}

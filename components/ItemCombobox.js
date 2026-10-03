"use client";

import { useMemo, useRef, useState } from "react";

export default function ItemCombobox({
  items,
  value,
  onChangeText,
  onPick,
  onSubmit,
  placeholder,
  inputClassName,
  inputRef,
  dropUp = false,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return items.filter((i) => i.name.toLowerCase().includes(q) && i.name.toLowerCase() !== q).slice(0, 5);
  }, [items, value]);

  return (
    <div className="relative flex-1" ref={wrapRef}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChangeText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setOpen(false);
            onSubmit?.();
          }
        }}
        placeholder={placeholder}
        className={inputClassName}
      />
      {open && suggestions.length > 0 && (
        <ul
          className={`absolute left-0 right-0 z-30 overflow-hidden rounded-card border border-mist bg-paper shadow-lift ${
            dropUp ? "bottom-full mb-2" : "top-full mt-1"
          }`}
        >
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPick(s);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-ink transition hover:bg-paperDim active:bg-mist/60"
              >
                <span>{s.name}</span>
                {s.lastPrice != null && s.lastPrice !== "" && (
                  <span className="font-mono text-xs text-inkSoft">₵{Number(s.lastPrice).toFixed(2)}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

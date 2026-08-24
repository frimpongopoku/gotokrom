"use client";

export default function TripItemRow({ item, onToggle, onOpen }) {
  const qty = Number(item.qty) || 1;
  const hasPrice = item.price !== "" && item.price != null;
  const subtotal = hasPrice ? Number(item.price) * qty : null;

  return (
    <li className="flex items-center gap-2">
      <button
        aria-label={item.checked ? `Uncheck ${item.name}` : `Check off ${item.name}`}
        onClick={onToggle}
        className={`stamp ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
          item.checked ? "border-pine bg-pine" : "border-mist bg-surface"
        }`}
      >
        {item.checked && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#FAF6EC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <button
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3.5 pr-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={item.checked ? "strike-wrap min-w-0" : "min-w-0"}>
            <span className={`truncate text-[15px] ${item.checked ? "text-inkSoft/70" : "text-ink"}`}>
              {item.name}
            </span>
          </span>
          {qty > 1 && (
            <span className="shrink-0 rounded-full bg-yolk/20 px-1.5 py-0.5 font-mono text-[11px] font-bold text-yolkDark">
              ×{qty}
            </span>
          )}
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-md px-2 py-1 font-mono text-sm font-bold ${
              hasPrice ? "bg-pine/10 text-pineDark" : "bg-paperDim text-inkSoft/50"
            }`}
          >
            {hasPrice ? `₵${subtotal.toFixed(2)}` : "add ₵"}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-inkSoft/40">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    </li>
  );
}

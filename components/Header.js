"use client";

export function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-pine text-paper shadow-paper">
        <span className="h-2 w-2 rounded-full bg-yolk" />
      </span>
      <span className="font-display text-xl font-bold tracking-tight text-ink">Our List</span>
    </div>
  );
}

export default function Header({ back, title, subtitle, right }) {
  return (
    <header className="sticky top-0 z-20 border-b border-mist/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {back && (
            <button
              onClick={back}
              aria-label="Back"
              className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-mist/60 active:scale-95"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {title ? (
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold leading-tight text-ink">{title}</h1>
              {subtitle && <p className="truncate text-xs text-inkSoft">{subtitle}</p>}
            </div>
          ) : (
            <Wordmark />
          )}
        </div>
        {right}
      </div>
    </header>
  );
}

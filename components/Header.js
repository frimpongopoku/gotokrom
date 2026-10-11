"use client";

import ThemeToggle from "./ThemeToggle";
import { NavTabs } from "./AppNav";

export function Wordmark() {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="truncate font-display text-[22px] font-extrabold tracking-[-0.04em] text-ink">pokah</span>
      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-pine" />
    </div>
  );
}

export default function Header({ back, title, subtitle, right, nav = false, wide = false }) {
  return (
    <header className="sticky top-0 z-20 border-b border-mist/60 bg-paper/85 backdrop-blur-xl">
      <div className={`mx-auto flex items-center justify-between gap-3 px-4 py-3 md:px-6 ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
        <div className="flex min-w-0 items-center gap-2">
          {back && (
            <button
              onClick={back}
              aria-label="Back"
              className="press -ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-mist bg-surface text-ink hover:border-inkSoft/50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {title ? (
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold leading-tight tracking-tight text-ink">{title}</h1>
              {subtitle && <p className="truncate text-xs text-inkSoft">{subtitle}</p>}
            </div>
          ) : (
            <Wordmark />
          )}
          {nav && (
            <div className="ml-6 hidden md:block">
              <NavTabs />
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          {right}
        </div>
      </div>
    </header>
  );
}

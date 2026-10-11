"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShop } from "@/lib/store";

const TABS = [
  {
    href: "/",
    label: "Shopping",
    match: (p) => p === "/" || p.startsWith("/trip"),
    icon: "M3 4h2l2.4 11h11.2L21 8H6.2M9 20h.01M18 20h.01",
  },
  {
    href: "/claims",
    label: "Claims",
    match: (p) => p.startsWith("/claims"),
    icon: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3",
  },
];

function useUnpaidCount() {
  const { data } = useShop();
  return (data.claims || []).filter((c) => !c.paidAt).length;
}

// Desktop: a segmented control in the header. The active pill slides between tabs.
export function NavTabs() {
  const pathname = usePathname();
  const unpaid = useUnpaidCount();
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.match(pathname)));

  return (
    <nav aria-label="Main" className="relative grid grid-cols-2 rounded-full border border-mist bg-paperDim p-1">
      <span
        aria-hidden="true"
        className="absolute bottom-1 top-1 rounded-full bg-surface shadow-paper transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ left: 4, width: "calc(50% - 4px)", transform: `translateX(${activeIndex * 100}%)` }}
      />
      {TABS.map((tab, i) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={i === activeIndex ? "page" : undefined}
          className={`relative flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            i === activeIndex ? "text-ink" : "text-inkSoft hover:text-ink"
          }`}
        >
          {tab.label}
          {tab.href === "/claims" && unpaid > 0 && (
            <span className="rounded-full bg-pine px-1.5 font-mono text-[10px] font-bold leading-4 text-paper">{unpaid}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

// Phones: a bottom tab bar within thumb reach.
export default function AppNav() {
  const pathname = usePathname();
  const unpaid = useUnpaidCount();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-mist/70 bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-2">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`press relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                active ? "text-ink" : "text-inkSoft"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-0 h-[3px] w-10 rounded-b-full bg-pine transition-all duration-300 ${
                  active ? "opacity-100" : "scale-x-0 opacity-0"
                }`}
              />
              <span className="relative">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d={tab.icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {tab.href === "/claims" && unpaid > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-pine px-1 text-center font-mono text-[10px] font-bold leading-[18px] text-paper">
                    {unpaid}
                  </span>
                )}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

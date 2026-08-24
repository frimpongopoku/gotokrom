"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(null);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  if (light === null) return <div className="h-9 w-9 shrink-0" aria-hidden />;

  const toggle = () => {
    const next = !light;
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("our-list:theme", next ? "light" : "dark");
    setLight(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={light ? "Switch to night mode" : "Switch to day mode"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-mist/60 active:scale-90"
    >
      {light ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}

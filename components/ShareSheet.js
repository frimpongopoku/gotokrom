"use client";

import { useEffect, useState } from "react";
import Sheet from "./Sheet";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// Accepts a share link, a claim review link, or a bare list id.
function parseListId(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const fromParam = new URL(trimmed).searchParams.get("list");
    if (fromParam) return fromParam;
  } catch (err) {
    /* not a URL, fall through */
  }
  const match = trimmed.match(UUID_RE);
  return match ? match[0] : null;
}

function SwitchList({ currentId }) {
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const id = parseListId(value);
    if (!id) {
      setError("That doesn't look like a Pokah link. Copy it from Share on the other phone.");
      return;
    }
    if (id === currentId) {
      setError("You're already on this list.");
      return;
    }
    setChecking(true);
    setError("");
    try {
      const res = await fetch(`/api/blob/${id}`, { cache: "no-store" });
      if (!res.ok) {
        setError("Couldn't find that list. Check the link and try again.");
        setChecking(false);
        return;
      }
    } catch (err) {
      setError("You seem to be offline. Try again once you're connected.");
      setChecking(false);
      return;
    }
    // Full reload so the store bootstraps from the new list id.
    window.location.assign(`/?list=${encodeURIComponent(id)}`);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="press mt-5 w-full text-center text-[13px] font-semibold text-inkSoft hover:text-ink"
      >
        Missing your list? Switch to another one
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 border-t border-mist pt-4">
      <label htmlFor="switch-list" className="block text-sm font-bold text-ink">
        Switch to another list
      </label>
      <p className="mt-0.5 text-[13px] leading-relaxed text-inkSoft">
        Paste the share link from your partner's phone. This browser will open that list instead.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          id="switch-list"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder="https://…/?list=…"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-2xl border border-mist bg-surface px-4 py-3 text-base text-ink outline-none placeholder:text-inkSoft/60 focus:border-inkSoft/60"
        />
        <button
          type="submit"
          disabled={checking || !value.trim()}
          className="press shrink-0 rounded-2xl bg-pine px-5 text-[15px] font-bold text-paper disabled:opacity-40"
        >
          {checking ? "Checking…" : "Switch"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] font-medium text-clay">
          {error}
        </p>
      )}
    </form>
  );
}

export default function ShareSheet({ open, onClose, autoMessage }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const blobId = localStorage.getItem("our-list:blobId");
    setCurrentId(blobId);
    if (blobId) {
      setUrl(`${window.location.origin}/?list=${blobId}`);
    }
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      /* clipboard unavailable */
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Pokah Groceries", text: "Join our shared shopping list", url });
      } catch (err) {
        /* user cancelled */
      }
    } else {
      copy();
    }
  };

  return (
    <Sheet open={open} onClose={onClose} label="Share this list">
      <div className="px-5 pb-6 pt-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
          {autoMessage ? "Your list is ready" : "Share this list"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-inkSoft">
          {autoMessage
            ? "Send this link to your partner so their phone stays in sync with yours."
            : "Anyone with this link can view and edit the list — no account needed."}
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-mist bg-surface py-2 pl-4 pr-2">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-inkSoft">{url || "…"}</span>
          <button onClick={copy} className="press shrink-0 rounded-xl border border-mist bg-paperDim px-3 py-2 text-xs font-bold text-ink">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={share} className="press flex-1 rounded-2xl bg-pine py-3.5 text-[15px] font-bold text-paper">
            Share link
          </button>
          <button onClick={onClose} className="press rounded-2xl border border-mist px-5 py-3.5 text-[15px] font-bold text-ink">
            Done
          </button>
        </div>

        <SwitchList key={open ? "open" : "closed"} currentId={currentId} />
      </div>
    </Sheet>
  );
}

"use client";

import { useState } from "react";
import { useShop } from "@/lib/store";
import { formatRelative } from "@/lib/money";
import ItemCombobox from "./ItemCombobox";

export default function HouseholdList() {
  const { data, addNeededItem, setNeeded } = useShop();
  const [text, setText] = useState("");

  const needed = data.itemBank.filter((i) => i.needed).sort((a, b) => a.name.localeCompare(b.name));

  const submit = () => {
    if (!text.trim()) return;
    addNeededItem(text);
    setText("");
  };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-inkSoft">
          Around the house
        </h2>
        {needed.length > 0 && (
          <span className="font-mono text-[11px] text-inkSoft">{needed.length} noted</span>
        )}
      </div>

      <div className="rounded-card border border-mist bg-surface/60 shadow-paper">
        {needed.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-inkSoft">
            Nothing noted yet. Add whatever you spot running low.
          </p>
        ) : (
          <ul className="divide-y divide-mist/70">
            {needed.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  aria-label={`Mark ${item.name} as handled`}
                  onClick={() => setNeeded(item.id, false)}
                  className="stamp flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-yolk transition active:scale-90"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-yolk" />
                </button>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] text-ink">{item.name}</span>
                  {item.neededSince && (
                    <span className="block text-[11px] text-inkSoft/80">Added {formatRelative(item.neededSince)}</span>
                  )}
                </span>
                {item.lastPrice != null && item.lastPrice !== "" && (
                  <span className="font-mono text-xs text-inkSoft">₵{Number(item.lastPrice).toFixed(2)}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2 border-t border-mist/70 p-2.5">
          <ItemCombobox
            items={data.itemBank}
            value={text}
            onChangeText={setText}
            onPick={(item) => {
              addNeededItem(item.name);
              setText("");
            }}
            onSubmit={submit}
            placeholder="Add something you noticed…"
            inputClassName="w-full rounded-lg border border-transparent bg-transparent px-2 py-2 text-[15px] text-ink placeholder:text-inkSoft/70 focus:border-mist focus:bg-paperDim focus:outline-none"
          />
          <button
            onClick={submit}
            aria-label="Add item"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine text-paper transition active:scale-90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

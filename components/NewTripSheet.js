"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/lib/store";

function defaultTripName() {
  return `Shopping trip — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function NewTripSheet({ open, onClose }) {
  const { data, createTrip } = useShop();
  const [name, setName] = useState("");
  const router = useRouter();

  if (!open) return null;

  const neededCount = data.itemBank.filter((i) => i.needed).length;

  const go = (fromNeeded) => {
    const id = createTrip(name || defaultTripName(), { fromNeeded });
    setName("");
    onClose();
    router.push(`/trip/${id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="torn-top w-full max-w-md rounded-t-2xl bg-paper px-5 pb-7 pt-6 shadow-lift sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-2xl">🧾</div>
        <h2 className="font-display text-xl font-bold text-ink">Start a shopping trip</h2>
        <p className="mt-1 text-sm text-inkSoft">Name it, then decide what goes on the sheet.</p>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={defaultTripName()}
          className="mt-4 w-full rounded-card border border-mist bg-surface/70 px-3.5 py-3 text-[15px] text-ink placeholder:text-inkSoft/60 focus:border-pine focus:outline-none"
        />

        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={() => go(true)}
            disabled={neededCount === 0}
            className="rounded-card bg-pine py-3 text-sm font-bold text-paper transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {neededCount > 0
              ? `Bring in ${neededCount} item${neededCount === 1 ? "" : "s"} from the house list`
              : "Nothing on the house list yet"}
          </button>
          <button
            onClick={() => go(false)}
            className="rounded-card border border-mist py-3 text-sm font-bold text-ink transition active:scale-[0.98]"
          >
            Start with a blank sheet
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/lib/store";
import Sheet from "./Sheet";

function defaultTripName() {
  return `Shopping trip — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function NewTripSheet({ open, onClose }) {
  const { data, createTrip } = useShop();
  const [name, setName] = useState("");
  const router = useRouter();

  const neededCount = data.itemBank.filter((i) => i.needed).length;

  const go = (fromNeeded) => {
    const id = createTrip(name || defaultTripName(), { fromNeeded });
    setName("");
    onClose();
    router.push(`/trip/${id}`);
  };

  return (
    <Sheet open={open} onClose={onClose} label="Start a shopping trip">
      <div className="px-5 pb-6 pt-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Start shopping</h2>
        <p className="mt-1 text-sm text-inkSoft">Name the trip, then decide what goes on the sheet.</p>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={defaultTripName()}
          className="mt-4 w-full rounded-2xl border border-mist bg-surface px-4 py-3.5 text-[16px] text-ink placeholder:text-inkSoft/60 focus:border-pineDark focus:outline-none"
        />

        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={() => go(true)}
            disabled={neededCount === 0}
            className="press rounded-2xl bg-pine py-3.5 text-[15px] font-bold text-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            {neededCount > 0
              ? `Bring in ${neededCount} item${neededCount === 1 ? "" : "s"} from the house list`
              : "Nothing on the house list yet"}
          </button>
          <button
            onClick={() => go(false)}
            className="press rounded-2xl border border-mist py-3.5 text-[15px] font-bold text-ink hover:bg-surface"
          >
            Start with a blank sheet
          </button>
        </div>
      </div>
    </Sheet>
  );
}

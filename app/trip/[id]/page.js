"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "@/components/Header";
import TripItemRow from "@/components/TripItemRow";
import TripAddItem from "@/components/TripAddItem";
import Tally from "@/components/Tally";
import { useShop } from "@/lib/store";
import { tripTotals, formatDate } from "@/lib/money";

export default function TripPage({ params }) {
  const router = useRouter();
  const {
    data,
    addTripItem,
    updateTripItem,
    toggleTripItem,
    removeTripItem,
    finishTrip,
    reopenTrip,
    deleteTrip,
    renameTrip,
  } = useShop();

  const trip = data.trips.find((t) => t.id === params.id);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  if (!trip) {
    return (
      <>
        <Header back={() => router.push("/")} title="Trip not found" />
        <main className="mx-auto max-w-xl px-4 py-10 text-center text-sm text-inkSoft">
          This trip isn't here anymore.
        </main>
      </>
    );
  }

  const { planned, inCart } = tripTotals(trip);
  const done = Boolean(trip.completedAt);

  const openRename = () => {
    setNameDraft(trip.name);
    setRenaming(true);
  };

  const commitRename = () => {
    if (nameDraft.trim()) renameTrip(trip.id, nameDraft);
    setRenaming(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${trip.name}"? This can't be undone.`)) {
      deleteTrip(trip.id);
      router.push("/");
    }
  };

  const handleDownload = async () => {
    const { downloadTripPdf } = await import("@/lib/pdf");
    downloadTripPdf(trip);
  };

  return (
    <>
      <Header
        back={() => router.push("/")}
        title={trip.name}
        subtitle={`${formatDate(trip.createdAt)}${done ? " · done" : ""}`}
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={handleDownload}
              aria-label="Download PDF"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-mist/60 active:scale-90"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={openRename}
              aria-label="Rename trip"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-mist/60 active:scale-90"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 20l1-4L16 5l3 3L8 19l-4 1z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              aria-label="Delete trip"
              className="flex h-9 w-9 items-center justify-center rounded-full text-inkSoft transition hover:bg-clay/10 hover:text-clay active:scale-90"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 13h6l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        }
      />

      <main className="mx-auto max-w-xl px-4 pb-28 pt-5">
        {renaming && (
          <div className="mb-4 flex gap-2">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitRename()}
              className="flex-1 rounded-card border border-pine bg-surface px-3 py-2 text-[15px] text-ink focus:outline-none"
            />
            <button
              onClick={commitRename}
              className="rounded-card bg-pine px-4 py-2 text-sm font-bold text-paper active:scale-95"
            >
              Save
            </button>
          </div>
        )}

        <div className="torn-top torn-bottom rounded-card border border-mist bg-surface/70 shadow-paper">
          {trip.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-inkSoft">
              Nothing on this sheet yet. Add items below — we'll remember them for next time.
            </p>
          ) : (
            <ul className="divide-y divide-mist/70">
              {trip.items.map((item) => (
                <TripItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleTripItem(trip.id, item.id)}
                  onUpdate={(patch) => updateTripItem(trip.id, item.id, patch)}
                  onRemove={() => removeTripItem(trip.id, item.id)}
                />
              ))}
            </ul>
          )}

          {!done && <TripAddItem itemBank={data.itemBank} onAdd={(payload) => addTripItem(trip.id, payload)} />}
        </div>

        <button
          onClick={() => (done ? reopenTrip(trip.id) : finishTrip(trip.id))}
          className={`mt-5 w-full rounded-card py-3.5 text-sm font-bold transition active:scale-[0.98] ${
            done ? "border border-mist text-ink" : "bg-ink text-paper"
          }`}
        >
          {done ? "Reopen trip" : "Finish trip"}
        </button>
      </main>

      <Tally inCart={inCart} planned={planned} />
    </>
  );
}

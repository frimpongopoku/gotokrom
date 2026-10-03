"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import TripItemRow from "@/components/TripItemRow";
import TripAddItem from "@/components/TripAddItem";
import ItemSheet from "@/components/ItemSheet";
import Tally from "@/components/Tally";
import FinishTripSheet from "@/components/FinishTripSheet";
import BasketSection from "@/components/BasketSection";
import { useShop } from "@/lib/store";
import { tripTotals, groupByCategory, formatDate } from "@/lib/money";

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
    createCategory,
  } = useShop();

  const trip = data.trips.find((t) => t.id === params.id);
  const categories = data.categories || [];
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [addCategoryId, setAddCategoryId] = useState(null);
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [justAddedId, setJustAddedId] = useState(null);
  const addInputRef = useRef(null);

  useEffect(() => {
    if (!justAddedId) return;
    const t = setTimeout(() => setJustAddedId(null), 1800);
    return () => clearTimeout(t);
  }, [justAddedId]);

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
  const groups = groupByCategory(trip, categories);
  const grouped = groups.some((g) => g.category);
  const done = Boolean(trip.completedAt);

  const toggleCollapsed = (key) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const addToCategory = (categoryId) => {
    setAddCategoryId(categoryId);
    addInputRef.current?.focus();
  };

  const handleAdd = (payload) => {
    const id = addTripItem(trip.id, payload);
    if (!id) return;
    const key = payload.categoryId ?? "none";
    if (collapsed.has(key)) toggleCollapsed(key);
    setJustAddedId(id);
  };

  const renderItem = (item) => (
    <TripItemRow
      key={item.id}
      item={item}
      isNew={item.id === justAddedId}
      onToggle={() => toggleTripItem(trip.id, item.id)}
      onOpen={() => setEditingItem(item)}
    />
  );

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
    downloadTripPdf(trip, categories);
  };

  const closeSheet = () => setEditingItem(null);

  const handleSheetSave = (payload) => {
    updateTripItem(trip.id, editingItem.id, payload);
    closeSheet();
  };

  const handleSheetDelete = () => {
    removeTripItem(trip.id, editingItem.id);
    closeSheet();
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

      <main className={`mx-auto max-w-xl px-4 pt-5 ${done ? "pb-32" : "pb-56"}`}>
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

        <div className="torn-top torn-bottom rounded-card border border-mist bg-surface/70 py-1.5 shadow-paper">
          {trip.items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-display text-lg font-bold text-ink">This basket is empty</p>
              <p className="mt-1 text-sm text-inkSoft">
                {done
                  ? "Reopen the trip to add items."
                  : "Add items below. Pick a category first to group them, like Produce or Toiletries."}
              </p>
            </div>
          ) : grouped ? (
            groups.map((group) => {
              const key = group.category?.id ?? "none";
              return (
                <BasketSection
                  key={key}
                  group={group}
                  collapsed={collapsed.has(key)}
                  onToggleCollapsed={() => toggleCollapsed(key)}
                  onAddHere={done ? null : () => addToCategory(group.category?.id ?? null)}
                >
                  {group.items.map(renderItem)}
                </BasketSection>
              );
            })
          ) : (
            <ul className="divide-y divide-mist/60">{trip.items.map(renderItem)}</ul>
          )}
        </div>

        {done ? (
          <button
            onClick={() => reopenTrip(trip.id)}
            className="mt-8 w-full rounded-card border border-mist py-3.5 text-sm font-bold text-ink transition active:scale-[0.98]"
          >
            Reopen trip
          </button>
        ) : (
          trip.items.length > 0 && (
            <p className="mt-10 text-center text-[13px] text-inkSoft">
              Done shopping?{" "}
              <button
                onClick={() => setConfirmingFinish(true)}
                className="font-semibold text-ink underline decoration-mist decoration-2 underline-offset-4 transition hover:decoration-ink"
              >
                Finish this trip
              </button>
            </p>
          )
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-mist bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto max-w-xl">
          <Tally inCart={inCart} planned={planned} groups={groups} />
          {done ? (
            <div className="h-3" />
          ) : (
            <TripAddItem
              itemBank={data.itemBank}
              categories={categories}
              categoryId={addCategoryId}
              onCategoryChange={setAddCategoryId}
              onCreateCategory={createCategory}
              inputRef={addInputRef}
              onAdd={handleAdd}
            />
          )}
        </div>
      </div>

      <FinishTripSheet
        open={confirmingFinish}
        trip={trip}
        inCart={inCart}
        planned={planned}
        onClose={() => setConfirmingFinish(false)}
        onConfirm={() => {
          finishTrip(trip.id);
          setConfirmingFinish(false);
        }}
      />

      <ItemSheet
        open={Boolean(editingItem)}
        item={editingItem}
        itemBank={data.itemBank}
        categories={categories}
        onCreateCategory={createCategory}
        onClose={closeSheet}
        onSave={handleSheetSave}
        onDelete={handleSheetDelete}
      />
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ItemSheet from "@/components/ItemSheet";
import TripAddItem from "@/components/TripAddItem";
import ClaimItems from "@/components/claims/ClaimItems";
import { StatusChip } from "@/components/claims/ClaimRow";
import ImportItemsSheet from "@/components/claims/ImportItemsSheet";
import MarkPaidSheet, { PAY_METHODS } from "@/components/claims/MarkPaidSheet";
import ClaimShareSheet from "@/components/claims/ClaimShareSheet";
import Toast, { useToast } from "@/components/Toast";
import { useShop } from "@/lib/store";
import { claimTotal, fmt, formatDate, formatDateTime, fromDateInput, toDateInput } from "@/lib/money";
import useCountUp from "@/lib/useCountUp";

async function downloadPdf(claims, categories) {
  const { downloadClaimsPdf } = await import("@/lib/pdf");
  downloadClaimsPdf(claims, categories);
}

function Total({ value }) {
  const shown = useCountUp(value);
  return <>{fmt(shown)}</>;
}

export default function ClaimPage({ params }) {
  const router = useRouter();
  const {
    data,
    status,
    updateClaim,
    addClaimItems,
    updateClaimItem,
    removeClaimItem,
    deleteClaim,
    markClaimsPaid,
    markClaimUnpaid,
    createCategory,
  } = useShop();

  const claim = (data.claims || []).find((c) => c.id === params.id);
  const categories = data.categories || [];

  const [titleDraft, setTitleDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [addCategoryId, setAddCategoryId] = useState(null);
  const [newIds, setNewIds] = useState(() => new Set());
  const [justPaid, setJustPaid] = useState(false);
  const [toast, showToast] = useToast();
  const addInputRef = useRef(null);
  const noteTimer = useRef(null);

  // Keep the editable fields in step with synced changes, except while typing in them.
  const titleFocused = useRef(false);
  const noteFocused = useRef(false);
  useEffect(() => {
    if (claim && !titleFocused.current) setTitleDraft(claim.title);
    if (claim && !noteFocused.current) setNoteDraft(claim.note || "");
  }, [claim?.title, claim?.note]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!newIds.size) return;
    const t = setTimeout(() => setNewIds(new Set()), 1800);
    return () => clearTimeout(t);
  }, [newIds]);

  if (!claim) {
    return (
      <>
        <Header back={() => router.push("/claims")} title={status === "loading" ? "Loading…" : "Claim not found"} />
        {status !== "loading" && (
          <main className="mx-auto max-w-xl px-4 py-10 text-center text-sm text-inkSoft">This claim isn't here anymore.</main>
        )}
      </>
    );
  }

  const paid = Boolean(claim.paidAt);
  const total = claimTotal(claim);
  const missingPrices = claim.items.filter((i) => i.price === "" || i.price == null).length;
  const method = PAY_METHODS.find((m) => m.id === claim.paidMethod);

  const flagNew = (ids) => setNewIds(new Set(ids));

  const commitTitle = () => {
    titleFocused.current = false;
    if (titleDraft.trim() && titleDraft !== claim.title) updateClaim(claim.id, { title: titleDraft });
    else setTitleDraft(claim.title);
  };

  const changeNote = (value) => {
    setNoteDraft(value);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => updateClaim(claim.id, { note: value }), 400);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete the claim "${claim.title}"? This can't be undone.`)) {
      deleteClaim(claim.id);
      router.push("/claims");
    }
  };

  const actions = paid ? (
    <>
      <button
        onClick={() => downloadPdf([claim], categories)}
        className="press flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-mist bg-surface text-[15px] font-bold text-ink"
      >
        <DownloadIcon /> Receipt PDF
      </button>
      <button
        onClick={() => {
          markClaimUnpaid(claim.id);
          setJustPaid(false);
        }}
        className="press h-12 rounded-2xl border border-mist px-4 text-[15px] font-bold text-inkSoft hover:text-ink"
      >
        Mark unpaid
      </button>
    </>
  ) : (
    <>
      <button
        onClick={() => downloadPdf([claim], categories)}
        aria-label="Download PDF"
        className="press flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-mist bg-surface text-ink"
      >
        <DownloadIcon />
      </button>
      <button
        onClick={() => setPayOpen(true)}
        disabled={!claim.items.length}
        className="press h-12 rounded-2xl border border-mist bg-surface px-4 text-[15px] font-bold text-ink disabled:opacity-40"
      >
        Paid
      </button>
      <button
        onClick={() => setShareOpen(true)}
        disabled={!claim.items.length}
        className="press flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-pine text-[15px] font-bold text-paper disabled:opacity-40"
      >
        Send for review
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  );

  return (
    <>
      <Header
        back={() => router.push("/claims")}
        title={claim.title}
        subtitle={`Claim · ${formatDate(claim.spentAt)}`}
        wide
        right={
          <button
            onClick={handleDelete}
            aria-label="Delete claim"
            className="press flex h-10 w-10 items-center justify-center rounded-full text-inkSoft hover:bg-clay/10 hover:text-clay"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 13h6l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        }
      />

      <main className="page-in mx-auto max-w-2xl px-4 pb-36 pt-5 md:max-w-5xl md:px-6 md:pb-16 md:pt-8">
        <div className="grid gap-5 md:grid-cols-[1fr_340px] md:items-start md:gap-8">
          {/* Summary: on phones it sits on top, on desktop it rides along on the right. */}
          <aside className="md:sticky md:top-24 md:order-2">
            <div className="relative overflow-hidden rounded-3xl border border-mist bg-surface p-5">
              {paid && (
                <span
                  key={justPaid ? "fresh" : "settled"}
                  className={`absolute right-4 top-5 rotate-[-12deg] rounded-lg border-[3px] border-pineDark px-2.5 py-0.5 font-display text-xl font-extrabold tracking-[0.1em] text-pineDark ${
                    justPaid ? "stamp-in" : ""
                  }`}
                >
                  PAID
                </span>
              )}
              <StatusChip claim={claim} />
              <label className="mt-3 block">
                <span className="sr-only">Claim name</span>
                <input
                  value={titleDraft}
                  onFocus={() => (titleFocused.current = true)}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  className={`w-full rounded-lg bg-transparent font-display text-[26px] ${paid ? "pr-24" : ""} font-bold leading-tight tracking-tight text-ink focus:bg-paperDim focus:outline-none`}
                />
              </label>
              <label className="mt-1 inline-flex items-center gap-2 text-sm text-inkSoft">
                <span>Spent</span>
                <input
                  type="date"
                  value={toDateInput(claim.spentAt)}
                  onChange={(e) => e.target.value && updateClaim(claim.id, { spentAt: fromDateInput(e.target.value) })}
                  className="rounded-lg border border-mist bg-paperDim px-2 py-1 text-sm text-ink focus:border-pineDark focus:outline-none"
                />
              </label>

              <div className="mt-5 border-t border-mist/70 pt-4">
                <p className="text-xs text-inkSoft">{paid ? "Paid back" : "To be paid back"}</p>
                <p className="font-mono text-[34px] font-bold leading-tight tracking-tight text-ink">
                  <span className={paid ? "" : "highlight"}>
                    <Total value={total} />
                  </span>
                </p>
                <p className="mt-1 text-xs text-inkSoft">
                  {claim.items.length} item{claim.items.length === 1 ? "" : "s"}
                  {missingPrices > 0 && <span className="text-yolkDark"> · {missingPrices} without a price</span>}
                </p>
                {paid && (
                  <p className="mt-3 rounded-xl bg-pine/10 px-3 py-2 text-[13px] text-pineDark">
                    Paid {formatDateTime(claim.paidAt)}
                    {method ? ` · ${method.label}` : ""}
                    {claim.paidRef ? ` · ref ${claim.paidRef}` : ""}
                  </p>
                )}
              </div>

              <div className="mt-5 hidden gap-2 md:flex">{actions}</div>
            </div>
          </aside>

          <div className="min-w-0 md:order-1">
            <button
              onClick={() => setImportOpen(true)}
              className="press flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-pineDark/60 bg-pine/[0.06] px-4 py-3 text-left hover:bg-pine/10"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine text-paper">
                <DownloadIcon />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-ink">Add from a trip or list</span>
                <span className="block text-xs text-inkSoft">Prices and tags come along</span>
              </span>
            </button>

            <div className="mt-4 overflow-visible rounded-card border border-mist bg-surface">
              {claim.items.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="font-display text-lg font-bold text-ink">Nothing on this claim yet</p>
                  <p className="mt-1 text-sm text-inkSoft">Import from a trip above, or type items below.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-t-card">
                  <ClaimItems claim={claim} categories={categories} newIds={newIds} onOpenItem={setEditingItem} />
                </div>
              )}
              <div className="border-t border-mist/70">
                <TripAddItem
                  itemBank={data.itemBank}
                  categories={categories}
                  categoryId={addCategoryId}
                  onCategoryChange={setAddCategoryId}
                  onCreateCategory={createCategory}
                  inputRef={addInputRef}
                  onAdd={(payload) => flagNew(addClaimItems(claim.id, [payload]))}
                />
              </div>
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 block px-1 text-[13px] font-semibold text-inkSoft">Note</span>
              <textarea
                value={noteDraft}
                onFocus={() => (noteFocused.current = true)}
                onBlur={() => (noteFocused.current = false)}
                onChange={(e) => changeNote(e.target.value)}
                rows={3}
                placeholder="Anything they should know — e.g. paid cash for the produce"
                className="w-full resize-none rounded-2xl border border-mist bg-surface px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-inkSoft/60 focus:border-pineDark focus:outline-none"
              />
            </label>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-mist bg-paper/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-2xl gap-2">{actions}</div>
      </div>

      <Toast toast={toast} bottom="bottom-28" />

      <ImportItemsSheet
        open={importOpen}
        claim={claim}
        onClose={() => setImportOpen(false)}
        onAdd={(items) => {
          const ids = addClaimItems(claim.id, items);
          flagNew(ids);
          if (ids.length) showToast(`Added ${ids.length} item${ids.length === 1 ? "" : "s"}`);
        }}
      />

      <ItemSheet
        open={Boolean(editingItem)}
        item={editingItem}
        itemBank={data.itemBank}
        categories={categories}
        onCreateCategory={createCategory}
        onClose={() => setEditingItem(null)}
        onSave={(payload) => {
          updateClaimItem(claim.id, editingItem.id, payload);
          setEditingItem(null);
        }}
        onDelete={() => {
          removeClaimItem(claim.id, editingItem.id);
          setEditingItem(null);
        }}
      />

      <MarkPaidSheet
        open={payOpen}
        claims={[claim]}
        onClose={() => setPayOpen(false)}
        onConfirm={(payment) => {
          markClaimsPaid([claim.id], payment);
          setPayOpen(false);
          setJustPaid(true);
        }}
      />

      <ClaimShareSheet
        open={shareOpen}
        claims={[claim]}
        onClose={() => setShareOpen(false)}
        onDownload={(list) => downloadPdf(list, categories)}
      />
    </>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

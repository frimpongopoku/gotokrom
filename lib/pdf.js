import { jsPDF } from "jspdf";
import { claimTotal, formatDate, groupByCategory, tripTotals } from "./money";

// jsPDF's built-in fonts only support WinAnsi glyphs, not the cedi sign (₵)
// that Intl's GHS formatter produces, so PDFs get their own ASCII-safe format.
function fmtPdf(n) {
  return `GHS ${(Number(n) || 0).toFixed(2)}`;
}

export function downloadTripPdf(trip, categories = []) {
  const doc = new jsPDF({ unit: "pt", format: [320, 620] });
  const marginX = 28;
  const width = 320 - marginX * 2;
  let y = 46;

  doc.setFont("courier", "bold");
  doc.setFontSize(16);
  doc.text("POKAH GROCERIES", 160, y, { align: "center" });

  y += 20;
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.text(trip.name, 160, y, { align: "center" });
  y += 14;
  doc.text(formatDate(trip.createdAt), 160, y, { align: "center" });

  y += 14;
  doc.setLineDashPattern([1, 1.5], 0);
  doc.line(marginX, y, marginX + width, y);
  y += 22;

  doc.setFontSize(10);

  if (trip.items.length === 0) {
    doc.text("No items on this sheet.", marginX, y);
    y += 20;
  }

  // Courier is monospace, so every character has the same advance width —
  // build each row as a single fixed-width string instead of measuring and
  // right-aligning two separate text() calls (which drifted out of sync).
  const charWidth = doc.getTextWidth("0");
  const totalChars = Math.floor(width / charWidth);

  const groups = groupByCategory(trip, categories);
  const grouped = groups.some((g) => g.category);

  const ensureRoom = () => {
    if (y > 580) {
      doc.addPage([320, 620]);
      y = 40;
    }
  };

  const fixedRow = (left, right, fill) => {
    const dashCount = Math.max(1, totalChars - left.length - right.length);
    return left + fill.repeat(dashCount) + right;
  };

  for (const group of groups) {
    if (grouped) {
      ensureRoom();
      doc.setFont("courier", "bold");
      const label = (group.category ? group.category.name : "No category").toUpperCase();
      const right = " " + fmtPdf(group.planned);
      const maxLabel = totalChars - right.length - 1;
      doc.text(fixedRow(label.length > maxLabel ? label.slice(0, maxLabel - 3) + "..." : label + " ", right, " "), marginX, y);
      doc.setFont("courier", "normal");
      y += 16;
    }

    for (const item of group.items) {
      const qty = Number(item.qty) || 1;
      const price = item.price === "" ? null : Number(item.price);
      const sub = price != null ? price * qty : null;

      const mark = item.checked ? "[x] " : "[ ] ";
      const suffix = (qty > 1 ? ` x${qty}` : "") + " ";
      const right = " " + (sub != null ? fmtPdf(sub) : "-");

      const maxNameLen = totalChars - mark.length - suffix.length - right.length - 1;
      const name = item.name.length > maxNameLen ? item.name.slice(0, Math.max(0, maxNameLen - 3)) + "..." : item.name;
      const left = mark + name + suffix;

      ensureRoom();
      doc.text(fixedRow(left, right, "."), marginX, y);
      y += 16;
    }

    if (grouped) y += 8;
  }

  y += 6;
  doc.setLineDashPattern([1, 1.5], 0);
  doc.line(marginX, y, marginX + width, y);
  y += 22;

  const { planned, inCart } = tripTotals(trip);
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.text("IN CART", marginX, y);
  doc.text(fmtPdf(inCart), marginX + width, y, { align: "right" });
  y += 18;
  doc.text("PLANNED TOTAL", marginX, y);
  doc.text(fmtPdf(planned), marginX + width, y, { align: "right" });

  y += 30;
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text("Thanks for shopping with us <3", 160, y, { align: "center" });

  const safeName = trip.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "shopping-trip";
  doc.save(`${safeName}.pdf`);
}

// ---------- Claims (A4) ----------

const A4 = { w: 595, h: 842 };
const METHOD_LABELS = { momo: "MoMo", cash: "Cash", bank: "Bank transfer" };

function claimStatusText(claim) {
  if (!claim.paidAt) return "Unpaid";
  const method = METHOD_LABELS[claim.paidMethod];
  return `Paid ${formatDate(claim.paidAt)}${method ? ` via ${method}` : ""}${claim.paidRef ? ` (ref ${claim.paidRef})` : ""}`;
}

// One claim downloads as an itemized claim; several become a statement with a
// summary table up front and every claim itemized after it.
export function downloadClaimsPdf(claims, categories = []) {
  if (!claims.length) return;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  const right = A4.w - 48;
  const cols = { qty: right - 170, unit: right - 90, amount: right };
  let y = 56;

  const ensure = (needed = 20) => {
    if (y + needed > A4.h - 56) {
      doc.addPage();
      y = 56;
    }
  };

  const rule = (weight = 0.5, gray = 200) => {
    doc.setDrawColor(gray);
    doc.setLineWidth(weight);
    doc.line(left, y, right, y);
  };

  const clip = (text, maxWidth) => {
    if (doc.getTextWidth(text) <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && doc.getTextWidth(`${t}...`) > maxWidth) t = t.slice(0, -1);
    return `${t}...`;
  };

  const single = claims.length === 1;
  const total = claims.reduce((s, c) => s + claimTotal(c), 0);
  const unpaid = claims.filter((c) => !c.paidAt).reduce((s, c) => s + claimTotal(c), 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(22, 24, 27);
  doc.text("pokah", left, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(single ? "Expense claim" : `Claims statement - ${claims.length} claims`, left, y + 15);
  doc.text(`Generated ${formatDate(Date.now())}`, right, y, { align: "right" });
  y += 44;

  if (!single) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text("CLAIM", left, y);
    doc.text("SPENT", cols.qty - 40, y);
    doc.text("STATUS", cols.unit - 30, y);
    doc.text("AMOUNT", cols.amount, y, { align: "right" });
    y += 8;
    rule(1, 22);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const claim of claims) {
      ensure();
      doc.setTextColor(22, 24, 27);
      doc.text(clip(claim.title, cols.qty - 60 - left), left, y);
      doc.setTextColor(90);
      doc.text(formatDate(claim.spentAt), cols.qty - 40, y);
      doc.text(claim.paidAt ? "Paid" : "Unpaid", cols.unit - 30, y);
      doc.setTextColor(22, 24, 27);
      doc.text(fmtPdf(claimTotal(claim)), cols.amount, y, { align: "right" });
      y += 6;
      rule();
      y += 14;
    }
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Total", cols.unit - 30, y);
    doc.text(fmtPdf(total), cols.amount, y, { align: "right" });
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Still unpaid", cols.unit - 30, y);
    doc.text(fmtPdf(unpaid), cols.amount, y, { align: "right" });
    y += 40;
  }

  for (const claim of claims) {
    ensure(90);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(single ? 22 : 15);
    doc.setTextColor(22, 24, 27);
    doc.text(clip(claim.title, right - left - 90), left, y);
    if (claim.paidAt) {
      doc.setDrawColor(29, 92, 70);
      doc.setTextColor(29, 92, 70);
      doc.setLineWidth(1.5);
      doc.roundedRect(right - 62, y - 15, 62, 20, 3, 3);
      doc.setFontSize(11);
      doc.text("PAID", right - 31, y - 1, { align: "center" });
    }
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Spent ${formatDate(claim.spentAt)} - ${claim.items.length} item${claim.items.length === 1 ? "" : "s"} - ${claimStatusText(claim)}`, left, y);
    y += 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(110);
    doc.text("ITEM", left, y);
    doc.text("QTY", cols.qty, y, { align: "right" });
    doc.text("UNIT", cols.unit, y, { align: "right" });
    doc.text("AMOUNT", cols.amount, y, { align: "right" });
    y += 7;
    rule(1, 22);
    y += 15;

    const groups = groupByCategory(claim, categories);
    const grouped = groups.some((g) => g.category);
    for (const group of groups) {
      if (grouped) {
        ensure(30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(22, 24, 27);
        doc.text(group.category ? group.category.name : "Other", left, y);
        doc.text(fmtPdf(group.planned), cols.amount, y, { align: "right" });
        y += 15;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      for (const item of group.items) {
        ensure();
        const qty = Number(item.qty) || 1;
        const price = item.price === "" || item.price == null ? null : Number(item.price);
        doc.setTextColor(22, 24, 27);
        doc.text(clip(item.name, cols.qty - 40 - left - (grouped ? 10 : 0)), left + (grouped ? 10 : 0), y);
        doc.setTextColor(90);
        doc.text(String(qty), cols.qty, y, { align: "right" });
        doc.text(price != null ? price.toFixed(2) : "-", cols.unit, y, { align: "right" });
        doc.setTextColor(22, 24, 27);
        doc.text(price != null ? (price * qty).toFixed(2) : "-", cols.amount, y, { align: "right" });
        y += 6;
        rule(0.5, 225);
        y += 13;
      }
      if (grouped) y += 4;
    }

    ensure(50);
    y += 2;
    rule(1, 22);
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(22, 24, 27);
    doc.text("Total", cols.unit - 60, y);
    doc.text(fmtPdf(claimTotal(claim)), cols.amount, y, { align: "right" });
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text("Balance", cols.unit - 60, y);
    doc.text(fmtPdf(claim.paidAt ? 0 : claimTotal(claim)), cols.amount, y, { align: "right" });
    y += 20;

    if (claim.note && claim.note.trim()) {
      const lines = doc.splitTextToSize(`Note: ${claim.note.trim()}`, right - left - 20);
      ensure(lines.length * 13 + 20);
      doc.setFillColor(244, 242, 237);
      doc.roundedRect(left, y - 4, right - left, lines.length * 13 + 14, 4, 4, "F");
      doc.setTextColor(50);
      doc.text(lines, left + 10, y + 10);
      y += lines.length * 13 + 22;
    }
    y += 26;
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(130);
    doc.text(`Page ${p} of ${pages}`, right, A4.h - 30, { align: "right" });
    doc.text("pokah", left, A4.h - 30);
  }

  const base = single ? claims[0].title : `claims-statement-${new Date().toISOString().slice(0, 10)}`;
  const safeName = base.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "claim";
  doc.save(`${safeName}.pdf`);
}

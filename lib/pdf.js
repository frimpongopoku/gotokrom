import { jsPDF } from "jspdf";
import { formatDate, tripTotals } from "./money";

// jsPDF's built-in fonts only support WinAnsi glyphs, not the cedi sign (₵)
// that Intl's GHS formatter produces, so PDFs get their own ASCII-safe format.
function fmtPdf(n) {
  return `GHS ${(Number(n) || 0).toFixed(2)}`;
}

export function downloadTripPdf(trip) {
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

  for (const item of trip.items) {
    const qty = Number(item.qty) || 1;
    const price = item.price === "" ? null : Number(item.price);
    const sub = price != null ? price * qty : null;

    const mark = item.checked ? "[x] " : "[ ] ";
    const suffix = (qty > 1 ? ` x${qty}` : "") + " ";
    const right = " " + (sub != null ? fmtPdf(sub) : "-");

    const maxNameLen = totalChars - mark.length - suffix.length - right.length - 1;
    const name = item.name.length > maxNameLen ? item.name.slice(0, Math.max(0, maxNameLen - 3)) + "..." : item.name;
    const left = mark + name + suffix;

    const dashCount = Math.max(1, totalChars - left.length - right.length);
    const line = left + ".".repeat(dashCount) + right;

    if (y > 580) {
      doc.addPage([320, 620]);
      y = 40;
    }

    doc.text(line, marginX, y);
    y += 16;
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

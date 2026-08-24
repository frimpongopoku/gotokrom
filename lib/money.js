export function fmt(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("en-GH", { style: "currency", currency: "GHS" });
}

export function tripTotals(trip) {
  let planned = 0;
  let inCart = 0;
  for (const item of trip.items) {
    const sub = (Number(item.price) || 0) * (Number(item.qty) || 1);
    planned += sub;
    if (item.checked) inCart += sub;
  }
  return { planned, inCart };
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatRelative(ts) {
  if (!ts) return "";
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return formatDate(ts);
}

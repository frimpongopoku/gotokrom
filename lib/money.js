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

// Splits a trip's items into one group per category (alphabetical), with
// uncategorized items last. Each item belongs to exactly one group, so the
// group totals always add up to the trip total.
export function groupByCategory(trip, categories = []) {
  const byId = new Map();
  const loose = { category: null, items: [], planned: 0, inCart: 0, checked: 0 };
  for (const item of trip.items) {
    const category = item.categoryId ? categories.find((c) => c.id === item.categoryId) : null;
    let group = loose;
    if (category) {
      group = byId.get(category.id);
      if (!group) {
        group = { category, items: [], planned: 0, inCart: 0, checked: 0 };
        byId.set(category.id, group);
      }
    }
    const sub = (Number(item.price) || 0) * (Number(item.qty) || 1);
    group.items.push(item);
    group.planned += sub;
    if (item.checked) {
      group.inCart += sub;
      group.checked += 1;
    }
  }
  const groups = [...byId.values()].sort((a, b) => a.category.name.localeCompare(b.category.name));
  if (loose.items.length) groups.push(loose);
  return groups;
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

// Monthly insights, derived entirely from finished trips. "Spent" means the
// checked-off items of a finished trip, dated by when the trip was finished.

const DAY = 86400000;

export function itemKey(name) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function monthKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthStart(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function addMonths(key, n) {
  const d = monthStart(key);
  d.setMonth(d.getMonth() + n);
  return monthKey(d.getTime());
}

export function monthLabel(key, style = "long") {
  return monthStart(key).toLocaleDateString("en-US", { month: style, year: style === "long" ? "numeric" : undefined });
}

export function daysInMonth(key) {
  const d = monthStart(key);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function purchasesFrom(trips) {
  const out = [];
  for (const trip of trips) {
    if (!trip.completedAt) continue;
    for (const item of trip.items) {
      if (!item.checked) continue;
      const qty = Number(item.qty) || 1;
      const price = item.price === "" || item.price == null ? null : Number(item.price);
      out.push({
        key: itemKey(item.name),
        name: item.name,
        qty,
        price,
        sub: price != null ? price * qty : 0,
        categoryId: item.categoryId ?? null,
        at: trip.completedAt,
        tripId: trip.id,
        tripName: trip.name,
      });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

// Months from the first purchase up to the current month, oldest first.
export function availableMonths(purchases, now = Date.now()) {
  const last = monthKey(now);
  if (!purchases.length) return [last];
  const months = [];
  for (let k = monthKey(purchases[0].at); k <= last; k = addMonths(k, 1)) months.push(k);
  return months;
}

function sum(list, fn) {
  return list.reduce((s, x) => s + fn(x), 0);
}

function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Running total through the month, one step per trip.
function pace(inMonth) {
  const byTrip = new Map();
  for (const p of inMonth) {
    const t = byTrip.get(p.tripId) || { at: p.at, name: p.tripName, amount: 0 };
    t.amount += p.sub;
    byTrip.set(p.tripId, t);
  }
  let cum = 0;
  return [...byTrip.values()]
    .sort((a, b) => a.at - b.at)
    .map((t) => {
      cum += t.amount;
      return { ...t, day: new Date(t.at).getDate(), cum };
    });
}

const MAX_TAGS = 6;

function byCategory(inMonth, prevMonth, categories) {
  const totals = new Map();
  const prev = new Map();
  for (const p of inMonth) totals.set(p.categoryId, (totals.get(p.categoryId) || 0) + p.sub);
  for (const p of prevMonth) prev.set(p.categoryId, (prev.get(p.categoryId) || 0) + p.sub);
  const rows = [...totals.entries()]
    .filter(([, total]) => total > 0)
    .map(([id, total]) => ({
      id: id ?? "none",
      category: id ? categories.find((c) => c.id === id) ?? null : null,
      total,
      prev: prev.get(id) || 0,
    }))
    .sort((a, b) => (a.category ? 0 : 1) - (b.category ? 0 : 1) || b.total - a.total);
  // Beyond a handful of tags the bar stops being readable, so the tail folds into "Other".
  const named = rows.filter((r) => r.category);
  if (named.length <= MAX_TAGS) return rows;
  const kept = named.slice(0, MAX_TAGS);
  const rest = rows.filter((r) => !kept.includes(r));
  return [...kept, { id: "other", category: null, other: true, total: sum(rest, (r) => r.total), prev: sum(rest, (r) => r.prev) }];
}

function mostOften(inMonth) {
  const map = new Map();
  for (const p of inMonth) {
    const e = map.get(p.key) || { key: p.key, name: p.name, times: 0, spend: 0 };
    e.times += 1;
    e.spend += p.sub;
    map.set(p.key, e);
  }
  return [...map.values()].sort((a, b) => b.times - a.times || b.spend - a.spend).slice(0, 5);
}

// For each item bought this month: its latest price vs the purchase before that.
function priceWatch(all, inMonth) {
  const latest = new Map();
  for (const p of inMonth) if (p.price != null) latest.set(p.key, p);
  const out = [];
  for (const last of latest.values()) {
    const history = all.filter((p) => p.key === last.key && p.price != null && p.at <= last.at);
    const before = [...history].reverse().find((p) => p.at < last.at && p.tripId !== last.tripId);
    if (!before || before.price === last.price || before.price === 0) continue;
    out.push({
      key: last.key,
      name: last.name,
      from: before.price,
      to: last.price,
      pct: ((last.price - before.price) / before.price) * 100,
      history: history.slice(-6).map((p) => p.price),
    });
  }
  return out.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 6);
}

export function summarizeMonth(purchases, key, categories = []) {
  const inMonth = purchases.filter((p) => monthKey(p.at) === key);
  const prevKey = addMonths(key, -1);
  const prevMonth = purchases.filter((p) => monthKey(p.at) === prevKey);
  const total = sum(inMonth, (p) => p.sub);
  const trips = new Set(inMonth.map((p) => p.tripId)).size;
  return {
    key,
    prevKey,
    total,
    prevTotal: sum(prevMonth, (p) => p.sub),
    hasPrev: prevMonth.length > 0,
    trips,
    items: sum(inMonth, (p) => p.qty),
    avgTrip: trips ? total / trips : 0,
    pace: pace(inMonth),
    prevPace: pace(prevMonth),
    categories: byCategory(inMonth, prevMonth, categories),
    often: mostOften(inMonth),
    prices: priceWatch(purchases, inMonth),
  };
}

const MIN_HISTORY_DAYS = 45;

// Items bought on a steady rhythm that are coming up on their usual gap.
// Stays empty until there's enough history for the rhythm to mean anything.
export function dueSoon(purchases, itemBank, now = Date.now()) {
  if (!purchases.length || now - purchases[0].at < MIN_HISTORY_DAYS * DAY) return [];
  const needed = new Set(itemBank.filter((i) => i.needed).map((i) => itemKey(i.name)));
  const byKey = new Map();
  for (const p of purchases) {
    const e = byKey.get(p.key) || { key: p.key, name: p.name, days: [] };
    const day = Math.floor(p.at / DAY);
    if (e.days[e.days.length - 1] !== day) e.days.push(day);
    e.name = p.name;
    byKey.set(p.key, e);
  }
  const out = [];
  for (const e of byKey.values()) {
    if (e.days.length < 3 || needed.has(e.key)) continue;
    const gaps = e.days.slice(1).map((d, i) => d - e.days[i]);
    const every = Math.round(median(gaps));
    if (every < 3) continue;
    const since = Math.floor(now / DAY) - e.days[e.days.length - 1];
    if (since < every * 0.75) continue;
    out.push({ key: e.key, name: e.name, every, since, urgency: since / every });
  }
  return out.sort((a, b) => b.urgency - a.urgency).slice(0, 5);
}

export function describeEvery(days) {
  if (days < 10) return `every ~${days} days`;
  const weeks = Math.round(days / 7);
  return weeks < 5 ? `every ~${weeks} week${weeks === 1 ? "" : "s"}` : `every ~${Math.round(days / 30)} month${days < 45 ? "" : "s"}`;
}

export function tagMonths(purchases, categoryId, endKey, n = 6) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const key = addMonths(endKey, -i);
    out.push({
      key,
      total: sum(
        purchases.filter((p) => monthKey(p.at) === key && (p.categoryId ?? "none") === categoryId),
        (p) => p.sub
      ),
    });
  }
  return out;
}

export function tagItems(purchases, categoryId, key) {
  const map = new Map();
  for (const p of purchases) {
    if (monthKey(p.at) !== key || (p.categoryId ?? "none") !== categoryId) continue;
    const e = map.get(p.key) || { key: p.key, name: p.name, times: 0, spend: 0 };
    e.times += 1;
    e.spend += p.sub;
    map.set(p.key, e);
  }
  return [...map.values()].sort((a, b) => b.spend - a.spend || b.times - a.times);
}

export function itemDetail(purchases, key) {
  const all = purchases.filter((p) => p.key === key);
  if (!all.length) return null;
  const priced = all.filter((p) => p.price != null);
  const days = [...new Set(all.map((p) => Math.floor(p.at / DAY)))];
  const gaps = days.slice(1).map((d, i) => d - days[i]);
  const first = priced[0];
  const last = priced[priced.length - 1];
  return {
    name: all[all.length - 1].name,
    categoryId: all[all.length - 1].categoryId,
    purchases: all,
    priced,
    times: all.length,
    every: gaps.length ? Math.round(median(gaps)) : null,
    avgPrice: priced.length ? sum(priced, (p) => p.price) / priced.length : null,
    first,
    last,
    change: first && last && first.price ? ((last.price - first.price) / first.price) * 100 : null,
  };
}

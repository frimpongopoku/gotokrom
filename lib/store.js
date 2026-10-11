"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ShopContext = createContext(null);

const BLOB_ID_KEY = "our-list:blobId";
const dataKey = (id) => `our-list:data:${id}`;

function emptyData() {
  return { updatedAt: 0, itemBank: [], trips: [], categories: [], claims: [] };
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ");
}

export function ShopProvider({ children }) {
  const [blobId, setBlobId] = useState(null);
  const [data, setData] = useState(emptyData());
  const [status, setStatus] = useState("loading"); // loading | ready | offline | error
  const [justCreated, setJustCreated] = useState(false);

  const dataRef = useRef(data);
  const saveTimer = useRef(null);
  const savingRef = useRef(false);
  const blobIdRef = useRef(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const persistLocal = useCallback((id, d) => {
    try {
      localStorage.setItem(dataKey(id), JSON.stringify(d));
    } catch (err) {
      /* storage full or unavailable, ignore */
    }
  }, []);

  const pushRemote = useCallback((id, d) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      savingRef.current = true;
      try {
        const res = await fetch(`/api/blob/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d),
        });
        setStatus(res.ok ? "ready" : "offline");
      } catch (err) {
        setStatus("offline");
      } finally {
        savingRef.current = false;
      }
    }, 500);
  }, []);

  const mutate = useCallback(
    (updater) => {
      setData((prev) => {
        const next = updater(prev);
        if (next === prev) return prev;
        next.updatedAt = Date.now();
        const id = blobIdRef.current;
        if (id) {
          persistLocal(id, next);
          pushRemote(id, next);
        }
        return next;
      });
    },
    [persistLocal, pushRemote]
  );

  // Bootstrap: figure out blob id (join via ?list=, or existing, or create new)
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const url = new URL(window.location.href);
      const joinId = url.searchParams.get("list");
      let id = joinId || localStorage.getItem(BLOB_ID_KEY);

      if (joinId) {
        localStorage.setItem(BLOB_ID_KEY, joinId);
        url.searchParams.delete("list");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }

      if (id) {
        blobIdRef.current = id;
        setBlobId(id);

        const cached = localStorage.getItem(dataKey(id));
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (!cancelled) setData(parsed);
          } catch (err) {
            /* ignore corrupt cache */
          }
        }

        try {
          const res = await fetch(`/api/blob/${id}`, { cache: "no-store" });
          if (res.ok) {
            const server = await res.json();
            if (!cancelled) {
              setData((prev) => (server.updatedAt >= (prev?.updatedAt || 0) ? server : prev));
              persistLocal(id, server);
              setStatus("ready");
            }
          } else {
            if (!cancelled) setStatus(cached ? "offline" : "error");
          }
        } catch (err) {
          if (!cancelled) setStatus(cached ? "offline" : "error");
        }
      } else {
        try {
          const res = await fetch("/api/blob", { method: "POST" });
          if (res.ok) {
            const { id: newId, data: initial } = await res.json();
            localStorage.setItem(BLOB_ID_KEY, newId);
            blobIdRef.current = newId;
            if (!cancelled) {
              setBlobId(newId);
              setData(initial);
              persistLocal(newId, initial);
              setStatus("ready");
              setJustCreated(true);
            }
          } else if (!cancelled) {
            // No shared backend reachable (e.g. KV not configured yet in this env) —
            // fall back to a local-only list so the app still works standalone.
            const localId = uid();
            const initial = emptyData();
            localStorage.setItem(BLOB_ID_KEY, localId);
            blobIdRef.current = localId;
            setBlobId(localId);
            setData(initial);
            persistLocal(localId, initial);
            setStatus("offline");
          }
        } catch (err) {
          if (!cancelled) setStatus("error");
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [persistLocal]);

  // Poll for partner's changes while the tab is visible
  useEffect(() => {
    if (!blobId) return;

    let cancelled = false;

    async function poll() {
      if (document.visibilityState !== "visible" || savingRef.current) return;
      try {
        const res = await fetch(`/api/blob/${blobId}`, { cache: "no-store" });
        if (!res.ok) return;
        const server = await res.json();
        if (cancelled) return;
        if (server.updatedAt > (dataRef.current?.updatedAt || 0)) {
          setData(server);
          persistLocal(blobId, server);
        }
        setStatus("ready");
      } catch (err) {
        setStatus("offline");
      }
    }

    const interval = setInterval(poll, 5000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [blobId, persistLocal]);

  // ---------- Mutations ----------

  const upsertItemBank = useCallback((bank, name, { needed, price } = {}) => {
    const clean = normalizeName(name);
    const idx = bank.findIndex((i) => i.name.toLowerCase() === clean.toLowerCase());
    if (idx === -1) {
      return {
        bank: [
          ...bank,
          {
            id: uid(),
            name: clean,
            lastPrice: price ?? null,
            needed: needed ?? false,
            neededSince: needed ? Date.now() : null,
            createdAt: Date.now(),
          },
        ],
        entry: null,
      };
    }
    const updated = [...bank];
    const existing = updated[idx];
    const nextNeeded = needed !== undefined ? needed : existing.needed;
    updated[idx] = {
      ...existing,
      lastPrice: price !== undefined && price !== "" ? price : existing.lastPrice,
      needed: nextNeeded,
      neededSince:
        needed === undefined
          ? existing.neededSince
          : needed && !existing.needed
          ? Date.now()
          : needed
          ? existing.neededSince
          : null,
    };
    return { bank: updated, entry: updated[idx] };
  }, []);

  const addNeededItem = useCallback(
    (name) => {
      if (!name || !normalizeName(name)) return;
      mutate((prev) => {
        const { bank } = upsertItemBank(prev.itemBank, name, { needed: true });
        return { ...prev, itemBank: bank };
      });
    },
    [mutate, upsertItemBank]
  );

  const setNeeded = useCallback(
    (itemId, needed) => {
      mutate((prev) => ({
        ...prev,
        itemBank: prev.itemBank.map((i) =>
          i.id === itemId ? { ...i, needed, neededSince: needed ? Date.now() : null } : i
        ),
      }));
    },
    [mutate]
  );

  const createTrip = useCallback(
    (name, { fromNeeded } = {}) => {
      let newId = null;
      mutate((prev) => {
        newId = uid();
        const now = Date.now();
        let items = [];
        let bank = prev.itemBank;

        if (fromNeeded) {
          const needed = prev.itemBank.filter((i) => i.needed);
          items = needed.map((i) => ({
            id: uid(),
            itemBankId: i.id,
            name: i.name,
            price: i.lastPrice ?? "",
            qty: 1,
            checked: false,
          }));
          bank = prev.itemBank.map((i) => (i.needed ? { ...i, needed: false } : i));
        }

        const trip = {
          id: newId,
          name: name && normalizeName(name) ? normalizeName(name) : "Shopping trip",
          createdAt: now,
          completedAt: null,
          items,
        };

        return { ...prev, itemBank: bank, trips: [trip, ...prev.trips] };
      });
      return newId;
    },
    [mutate]
  );

  const renameTrip = useCallback(
    (tripId, name) => {
      mutate((prev) => ({
        ...prev,
        trips: prev.trips.map((t) => (t.id === tripId ? { ...t, name: normalizeName(name) || t.name } : t)),
      }));
    },
    [mutate]
  );

  const addTripItem = useCallback(
    (tripId, { name, price, qty, categoryId }) => {
      if (!name || !normalizeName(name)) return null;
      const id = uid();
      mutate((prev) => {
        const priceVal = price === "" || price === undefined ? "" : Number(price);
        const { bank, entry } = upsertItemBank(prev.itemBank, name, {
          price: priceVal === "" ? undefined : priceVal,
        });
        const itemBankId = entry ? entry.id : bank[bank.length - 1].id;
        const newItem = {
          id,
          itemBankId,
          name: normalizeName(name),
          price: priceVal,
          qty: qty && qty > 0 ? qty : 1,
          checked: false,
          categoryId: categoryId ?? null,
        };
        return {
          ...prev,
          itemBank: bank,
          trips: prev.trips.map((t) => (t.id === tripId ? { ...t, items: [...t.items, newItem] } : t)),
        };
      });
      return id;
    },
    [mutate, upsertItemBank]
  );

  const updateTripItem = useCallback(
    (tripId, itemId, patch) => {
      mutate((prev) => {
        let bank = prev.itemBank;
        if (patch.price !== undefined) {
          const trip = prev.trips.find((t) => t.id === tripId);
          const item = trip?.items.find((i) => i.id === itemId);
          if (item?.itemBankId) {
            const priceVal = patch.price === "" ? undefined : Number(patch.price);
            const res = upsertItemBank(bank, item.name, { price: priceVal });
            bank = res.bank;
          }
        }
        return {
          ...prev,
          itemBank: bank,
          trips: prev.trips.map((t) =>
            t.id === tripId
              ? { ...t, items: t.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
              : t
          ),
        };
      });
    },
    [mutate, upsertItemBank]
  );

  const toggleTripItem = useCallback(
    (tripId, itemId) => {
      mutate((prev) => ({
        ...prev,
        trips: prev.trips.map((t) =>
          t.id === tripId
            ? { ...t, items: t.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)) }
            : t
        ),
      }));
    },
    [mutate]
  );

  const removeTripItem = useCallback(
    (tripId, itemId) => {
      mutate((prev) => ({
        ...prev,
        trips: prev.trips.map((t) => (t.id === tripId ? { ...t, items: t.items.filter((i) => i.id !== itemId) } : t)),
      }));
    },
    [mutate]
  );

  // Categories live in one shared library so they can be reused across trips.
  // Returns the id of the existing category when the name already exists.
  const createCategory = useCallback(
    (name) => {
      const clean = name ? normalizeName(name) : "";
      if (!clean) return null;
      const current = dataRef.current.categories || [];
      const existing = current.find((c) => c.name.toLowerCase() === clean.toLowerCase());
      if (existing) return existing.id;
      const id = uid();
      mutate((prev) => {
        const categories = prev.categories || [];
        if (categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) return prev;
        return {
          ...prev,
          categories: [...categories, { id, name: clean, color: categories.length, createdAt: Date.now() }],
        };
      });
      return id;
    },
    [mutate]
  );

  const finishTrip = useCallback(
    (tripId) => {
      mutate((prev) => ({
        ...prev,
        trips: prev.trips.map((t) => (t.id === tripId ? { ...t, completedAt: Date.now() } : t)),
      }));
    },
    [mutate]
  );

  const reopenTrip = useCallback(
    (tripId) => {
      mutate((prev) => ({
        ...prev,
        trips: prev.trips.map((t) => (t.id === tripId ? { ...t, completedAt: null } : t)),
      }));
    },
    [mutate]
  );

  const deleteTrip = useCallback(
    (tripId) => {
      mutate((prev) => ({ ...prev, trips: prev.trips.filter((t) => t.id !== tripId) }));
    },
    [mutate]
  );

  // ---------- Claims ----------
  // A claim is a list of things one of us paid for, sent to the other to pay back.
  // It is unpaid until marked paid; there is no separate draft state.

  const claimItemFrom = (raw) => ({
    id: uid(),
    name: normalizeName(raw.name),
    price: raw.price === "" || raw.price == null ? "" : Number(raw.price),
    qty: raw.qty && raw.qty > 0 ? Number(raw.qty) : 1,
    categoryId: raw.categoryId ?? null,
    sourceItemId: raw.sourceItemId ?? null,
  });

  const updateClaimIn = (prev, claimId, fn) => ({
    ...prev,
    claims: (prev.claims || []).map((c) => (c.id === claimId ? fn(c) : c)),
  });

  const createClaim = useCallback(
    ({ title, items = [], spentAt } = {}) => {
      const id = uid();
      mutate((prev) => {
        const now = Date.now();
        const claim = {
          id,
          title: title && normalizeName(title) ? normalizeName(title) : "Claim",
          createdAt: now,
          spentAt: spentAt ?? now,
          note: "",
          items: items.filter((i) => i.name && normalizeName(i.name)).map(claimItemFrom),
          paidAt: null,
          paidMethod: null,
          paidRef: "",
        };
        return { ...prev, claims: [claim, ...(prev.claims || [])] };
      });
      return id;
    },
    [mutate]
  );

  // Turns a trip into a claim: the checked-off items if any were checked, otherwise everything.
  const createClaimFromTrip = useCallback(
    (tripId) => {
      const trip = dataRef.current.trips.find((t) => t.id === tripId);
      if (!trip) return null;
      const picked = trip.items.some((i) => i.checked) ? trip.items.filter((i) => i.checked) : trip.items;
      return createClaim({
        title: trip.name,
        spentAt: trip.completedAt || trip.createdAt,
        items: picked.map((i) => ({ ...i, sourceItemId: i.id })),
      });
    },
    [createClaim]
  );

  const updateClaim = useCallback(
    (claimId, patch) => {
      mutate((prev) =>
        updateClaimIn(prev, claimId, (c) => ({
          ...c,
          ...patch,
          title: patch.title !== undefined ? normalizeName(patch.title) || c.title : c.title,
        }))
      );
    },
    [mutate]
  );

  const addClaimItems = useCallback(
    (claimId, items) => {
      const valid = items.filter((i) => i.name && normalizeName(i.name));
      if (!valid.length) return [];
      const built = valid.map(claimItemFrom);
      mutate((prev) => {
        let bank = prev.itemBank;
        for (const item of built) {
          bank = upsertItemBank(bank, item.name, { price: item.price === "" ? undefined : item.price }).bank;
        }
        return { ...updateClaimIn(prev, claimId, (c) => ({ ...c, items: [...c.items, ...built] })), itemBank: bank };
      });
      return built.map((i) => i.id);
    },
    [mutate, upsertItemBank]
  );

  const updateClaimItem = useCallback(
    (claimId, itemId, patch) => {
      mutate((prev) => {
        let bank = prev.itemBank;
        const clean = { ...patch };
        if (clean.price !== undefined) clean.price = clean.price === "" ? "" : Number(clean.price);
        if (clean.name !== undefined) {
          clean.name = normalizeName(clean.name);
          bank = upsertItemBank(bank, clean.name, { price: clean.price === "" ? undefined : clean.price }).bank;
        }
        return {
          ...updateClaimIn(prev, claimId, (c) => ({
            ...c,
            items: c.items.map((i) => (i.id === itemId ? { ...i, ...clean } : i)),
          })),
          itemBank: bank,
        };
      });
    },
    [mutate, upsertItemBank]
  );

  const removeClaimItem = useCallback(
    (claimId, itemId) => {
      mutate((prev) => updateClaimIn(prev, claimId, (c) => ({ ...c, items: c.items.filter((i) => i.id !== itemId) })));
    },
    [mutate]
  );

  const deleteClaim = useCallback(
    (claimId) => {
      mutate((prev) => ({ ...prev, claims: (prev.claims || []).filter((c) => c.id !== claimId) }));
    },
    [mutate]
  );

  const markClaimsPaid = useCallback(
    (claimIds, { method = null, ref = "" } = {}) => {
      const ids = new Set(claimIds);
      const now = Date.now();
      mutate((prev) => ({
        ...prev,
        claims: (prev.claims || []).map((c) =>
          ids.has(c.id) && !c.paidAt ? { ...c, paidAt: now, paidMethod: method, paidRef: ref.trim() } : c
        ),
      }));
    },
    [mutate]
  );

  const markClaimUnpaid = useCallback(
    (claimId) => {
      mutate((prev) => updateClaimIn(prev, claimId, (c) => ({ ...c, paidAt: null, paidMethod: null, paidRef: "" })));
    },
    [mutate]
  );

  const value = {
    blobId,
    data,
    status,
    justCreated,
    dismissJustCreated: () => setJustCreated(false),
    addNeededItem,
    setNeeded,
    createTrip,
    renameTrip,
    createCategory,
    addTripItem,
    updateTripItem,
    toggleTripItem,
    removeTripItem,
    finishTrip,
    reopenTrip,
    deleteTrip,
    createClaim,
    createClaimFromTrip,
    updateClaim,
    addClaimItems,
    updateClaimItem,
    removeClaimItem,
    deleteClaim,
    markClaimsPaid,
    markClaimUnpaid,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}

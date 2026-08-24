"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ShopContext = createContext(null);

const BLOB_ID_KEY = "our-list:blobId";
const dataKey = (id) => `our-list:data:${id}`;

function emptyData() {
  return { updatedAt: 0, itemBank: [], trips: [] };
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
        window.history.replaceState({}, "", url.pathname + url.hash);
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
    (tripId, { name, price, qty }) => {
      if (!name || !normalizeName(name)) return;
      mutate((prev) => {
        const priceVal = price === "" || price === undefined ? "" : Number(price);
        const { bank, entry } = upsertItemBank(prev.itemBank, name, {
          price: priceVal === "" ? undefined : priceVal,
        });
        const itemBankId = entry ? entry.id : bank[bank.length - 1].id;
        const newItem = {
          id: uid(),
          itemBankId,
          name: normalizeName(name),
          price: priceVal,
          qty: qty && qty > 0 ? qty : 1,
          checked: false,
        };
        return {
          ...prev,
          itemBank: bank,
          trips: prev.trips.map((t) => (t.id === tripId ? { ...t, items: [...t.items, newItem] } : t)),
        };
      });
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
    addTripItem,
    updateTripItem,
    toggleTripItem,
    removeTripItem,
    finishTrip,
    reopenTrip,
    deleteTrip,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}

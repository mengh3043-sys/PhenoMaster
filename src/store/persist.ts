import { useEffect, useSyncExternalStore } from "react";

/**
 * Minimal global store persisted to localStorage.
 * Every page using the same store shares one value; every set() writes through to localStorage.
 * To switch to a real backend later, replace load()/save() with API calls.
 */
export function createPersistedStore<T>(key: string, initial: T, migrate?: (saved: T) => T) {
  const storageKey = `phenotype:${key}`;
  let value = initial;
  let hydrated = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  function hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as T;
        value = migrate ? migrate(saved) : saved;
        if (value !== saved) window.localStorage.setItem(storageKey, JSON.stringify(value));
        emit();
      }
    } catch { /* ignore corrupt data */ }
  }

  function set(next: T | ((prev: T) => T)) {
    hydrate();
    value = typeof next === "function" ? (next as (p: T) => T)(value) : next;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      console.warn(`[store] 无法写入 ${storageKey}，可能超出浏览器存储上限`);
    }
    emit();
  }

  function useStore() {
    const v = useSyncExternalStore(
      (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
      () => value,
      () => initial,
    );
    useEffect(hydrate, []);
    return [v, set] as const;
  }

  return { useStore, set, get: () => value, reset: () => set(initial) };
}

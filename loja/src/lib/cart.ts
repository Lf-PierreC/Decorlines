"use client";

import { useSyncExternalStore } from "react";

export type CartItem = { slug: string; qty: number };

const KEY = "decorlines-cart";
const EMPTY: CartItem[] = [];
let items: CartItem[] = EMPTY;
let loaded = false;
let drawerOpen = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    items = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    items = EMPTY;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function save(next: CartItem[]) {
  items = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useCart() {
  const cart = useSyncExternalStore(
    subscribe,
    () => {
      load();
      return items;
    },
    () => EMPTY,
  );
  return cart;
}

export function useDrawerOpen() {
  return useSyncExternalStore(
    subscribe,
    () => drawerOpen,
    () => false,
  );
}

export function setDrawer(open: boolean) {
  drawerOpen = open;
  emit();
}

export function addToCart(slug: string, qty = 1) {
  load();
  const found = items.find((i) => i.slug === slug);
  save(
    found
      ? items.map((i) => (i.slug === slug ? { ...i, qty: i.qty + qty } : i))
      : [...items, { slug, qty }],
  );
  setDrawer(true);
}

export function setQty(slug: string, qty: number) {
  save(
    qty <= 0
      ? items.filter((i) => i.slug !== slug)
      : items.map((i) => (i.slug === slug ? { ...i, qty } : i)),
  );
}

export function clearCart() {
  save(EMPTY);
}

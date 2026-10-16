"use client";

import { setDrawer, useCart } from "@/lib/cart";

export function CartButton() {
  const count = useCart().reduce((n, i) => n + i.qty, 0);
  return (
    <button
      onClick={() => setDrawer(true)}
      className="text-[0.72rem] uppercase tracking-[0.22em] hover:text-muted"
      aria-label="Abrir carrinho"
    >
      Carrinho ({count})
    </button>
  );
}

"use client";

import { setDrawer, useCart } from "@/lib/cart";

export function CartButton() {
  const count = useCart().reduce((n, i) => n + i.qty, 0);

  return (
    <button
      onClick={() => setDrawer(true)}
      className="group relative flex items-center gap-2 text-[0.74rem] font-medium uppercase tracking-[0.18em] text-[#332D28] transition-colors hover:text-[#AB5F23]"
      aria-label="Abrir carrinho de compras"
    >
      <svg
        className="h-4 w-4 transition-transform group-hover:scale-110"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.25 10.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm9 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
        />
      </svg>
      <span className="hidden sm:inline">Sacola</span>
      {count > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#AB5F23] px-1.5 text-[0.62rem] font-bold text-white shadow-sm">
          {count}
        </span>
      )}
    </button>
  );
}

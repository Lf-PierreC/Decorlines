"use client";

import Link from "next/link";
import type { CartProduct } from "@/lib/products";
import { brl } from "@/lib/format";
import { setDrawer, setQty, useCart, useDrawerOpen } from "@/lib/cart";
import { ProductVisual } from "./ProductCard";

export function CartDrawer({ products }: { products: CartProduct[] }) {
  const open = useDrawerOpen();
  const cart = useCart();

  const lines = cart.flatMap((i) => {
    const product = products.find((p) => p.slug === i.slug);
    return product ? [{ product, qty: i.qty }] : [];
  });
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);

  return (
    <>
      <div
        onClick={() => setDrawer(false)}
        className={`fixed inset-0 z-50 bg-foreground/30 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-serif text-2xl">Seu carrinho</h2>
          <button onClick={() => setDrawer(false)} className="eyebrow hover:text-foreground">
            Fechar
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {lines.length === 0 && (
            <p className="py-16 text-center text-sm text-muted">Seu carrinho está vazio.</p>
          )}
          {lines.map(({ product, qty }) => (
            <div key={product.slug} className="flex gap-4">
              <div className="w-20 shrink-0">
                <ProductVisual product={product} />
              </div>
              <div className="flex flex-1 flex-col justify-between text-sm">
                <div>
                  <p className="font-serif text-lg">{product.name}</p>
                  <p className="text-muted">{brl(product.price)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-line">
                    <button className="px-3 py-1" onClick={() => setQty(product.slug, qty - 1)}>−</button>
                    <span className="w-6 text-center">{qty}</span>
                    <button
                      className="px-3 py-1 disabled:opacity-30"
                      disabled={qty >= product.stock}
                      onClick={() => setQty(product.slug, qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button onClick={() => setQty(product.slug, 0)} className="text-xs text-muted underline">
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-line px-6 py-6">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span>{brl(subtotal)}</span>
            </div>
            <p className="mb-5 text-xs text-muted">Frete calculado no checkout.</p>
            <Link href="/checkout" onClick={() => setDrawer(false)} className="btn w-full">
              Finalizar compra
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

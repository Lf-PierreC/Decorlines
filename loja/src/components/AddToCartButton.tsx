"use client";

import { addToCart } from "@/lib/cart";

export function AddToCartButton({ slug, soldOut }: { slug: string; soldOut?: boolean }) {
  if (soldOut) {
    return (
      <button disabled className="btn w-full cursor-not-allowed opacity-40">
        Esgotado
      </button>
    );
  }
  return (
    <button onClick={() => addToCart(slug)} className="btn w-full">
      Adicionar ao carrinho
    </button>
  );
}

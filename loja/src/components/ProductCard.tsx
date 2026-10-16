import Link from "next/link";
import type { Product } from "@/lib/products";
import { brl } from "@/lib/format";

type Visual = Pick<Product, "name" | "tone" | "image">;

export function ProductVisual({ product, className = "" }: { product: Visual; className?: string }) {
  const dark = ["#3b2a20", "#2a1f19"].includes(product.tone.toLowerCase());
  return (
    <div
      className={`relative aspect-[4/5] overflow-hidden ${className}`}
      style={{ background: product.tone }}
    >
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center font-serif text-7xl italic opacity-40"
          style={{ color: dark ? "#fff" : "#3b2a20" }}
        >
          {product.name[0]}
        </span>
      )}
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock === 0;
  return (
    <Link href={`/produto/${product.slug}`} className="group block">
      <div className="relative overflow-hidden">
        <ProductVisual
          product={product}
          className={`transition-transform duration-700 group-hover:scale-105 ${soldOut ? "opacity-60" : ""}`}
        />
        {soldOut && (
          <span className="eyebrow absolute left-3 top-3 bg-white px-3 py-1">Esgotado</span>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow">{product.category}</p>
          <h3 className="mt-1 font-serif text-xl">{product.name}</h3>
        </div>
        <p className="text-sm text-muted">{brl(product.price)}</p>
      </div>
    </Link>
  );
}

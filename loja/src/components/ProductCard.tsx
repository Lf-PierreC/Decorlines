import Link from "next/link";
import type { Product } from "@/lib/products";
import { brl } from "@/lib/format";

type Visual = Pick<Product, "name" | "tone" | "image">;

export function ProductVisual({ product, className = "" }: { product: Visual; className?: string }) {
  const dark = ["#3b2a20", "#2a1f19", "#0f0e0d"].includes(product.tone.toLowerCase());
  return (
    <div
      className={`relative aspect-[4/5] overflow-hidden ${className}`}
      style={{ background: product.tone }}
    >
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center font-serif text-8xl italic opacity-35"
          style={{ color: dark ? "#fff" : "#111111" }}
        >
          {product.name[0]}
        </span>
      )}
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock === 0;
  const pixPrice = product.price * 0.95;

  return (
    <Link href={`/produto/${product.slug}`} className="group block">
      <div className="relative overflow-hidden border border-line/80 bg-surface transition-all duration-300 group-hover:border-[#AB5F23]/40 group-hover:shadow-lg group-hover:shadow-[#AB5F23]/5">
        <ProductVisual
          product={product}
          className={soldOut ? "opacity-50 grayscale" : ""}
        />

        {/* Badges superiores */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
          {soldOut ? (
            <span className="bg-black/80 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wider text-white backdrop-blur">
              Esgotado
            </span>
          ) : (
            <span className="bg-white/90 px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-wider text-[#AB5F23] border border-[#AB5F23]/20 backdrop-blur">
              5% OFF no Pix
            </span>
          )}
        </div>

        {/* Indicador de tom / cor da peça */}
        <div
          className="absolute right-3 bottom-3 h-3.5 w-3.5 rounded-full border border-black/10 shadow-sm"
          style={{ backgroundColor: product.tone }}
          title={`Cor da peça: ${product.tone}`}
        />
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted">
            {product.category}
          </p>
          <span className="text-[0.68rem] text-muted">Pronta entrega</span>
        </div>

        <h3 className="font-serif text-xl tracking-tight text-[#111111] group-hover:text-[#AB5F23] transition-colors">
          {product.name}
        </h3>

        <div className="mt-1 flex items-baseline gap-2">
          <p className="font-sans text-sm font-bold text-[#111111]">
            {brl(product.price)}
          </p>
          <span className="text-xs text-muted">
            ou {brl(pixPrice)} no Pix
          </span>
        </div>
      </div>
    </Link>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct } from "@/lib/products";
import { brl } from "@/lib/format";
import { ProductVisual } from "@/components/ProductCard";
import { AddToCartButton } from "@/components/AddToCartButton";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return { title: product ? `${product.name} — Decorlines` : "Produto" };
}

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2">
      <ProductVisual product={product} />
      <div className="md:sticky md:top-32 md:self-start">
        <p className="eyebrow">{product.category}</p>
        <h1 className="mt-3 font-serif text-5xl">{product.name}</h1>
        <p className="mt-4 text-xl">{brl(product.price)}</p>
        <p className="mt-1 text-sm text-muted">
          ou {brl(product.price * 0.95)} no Pix (5% off)
        </p>
        <p className="mt-8 leading-relaxed text-muted">{product.description}</p>
        {product.details.length > 0 && (
          <ul className="mt-8 space-y-2 border-t border-line pt-6 text-sm">
            {product.details.map((d) => <li key={d}>{d}</li>)}
          </ul>
        )}
        {product.stock > 0 && product.stock <= 3 && (
          <p className="mt-6 text-sm text-muted">Últimas {product.stock} unidades</p>
        )}
        <div className="mt-8">
          <AddToCartButton slug={product.slug} soldOut={product.stock === 0} />
        </div>
      </div>
    </section>
  );
}

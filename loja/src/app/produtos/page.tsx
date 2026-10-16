import { getProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const metadata = { title: "Loja — Decorlines" };

export default function ProdutosPage() {
  const products = getProducts();
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <p className="eyebrow">Coleção</p>
      <h1 className="mt-3 font-serif text-5xl">Todas as peças</h1>
      <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </section>
  );
}

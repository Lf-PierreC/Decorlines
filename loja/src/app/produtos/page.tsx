import Link from "next/link";
import { getProducts, getCategories } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const metadata = { title: "Catálogo de Peças 3D — Decorlines" };

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const allProducts = getProducts();
  const categories = getCategories();

  const filtered = categoria
    ? allProducts.filter((p) => p.category.toLowerCase() === categoria.toLowerCase())
    : allProducts;

  return (
    <section className="mx-auto max-w-7xl px-6 py-14">
      {/* Cabeçalho do Catálogo */}
      <div className="border-b border-line pb-8">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-[#AB5F23] transition-colors">
            Início
          </Link>
          <span>/</span>
          <span className="text-[#111111] font-medium">Catálogo</span>
        </div>

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow text-[#AB5F23]">Coleção Autoral 2026</p>
            <h1 className="mt-2 font-serif text-4xl text-[#111111] sm:text-5xl">Todas as Peças</h1>
          </div>
          <p className="text-sm text-muted">
            {filtered.length} {filtered.length === 1 ? "peça disponível" : "peças disponíveis"}
          </p>
        </div>

        {/* Filtros rápidos por categoria */}
        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/produtos"
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all border ${
              !categoria
                ? "bg-[#111111] text-white border-[#111111]"
                : "bg-surface text-[#332D28] border-line hover:border-[#AB5F23]/50"
            }`}
          >
            Todos ({allProducts.length})
          </Link>
          {categories.map((c) => {
            const isSelected = categoria?.toLowerCase() === c.toLowerCase();
            const count = allProducts.filter((p) => p.category.toLowerCase() === c.toLowerCase()).length;
            return (
              <Link
                key={c}
                href={`/produtos?categoria=${encodeURIComponent(c)}`}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all border ${
                  isSelected
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "bg-surface text-[#332D28] border-line hover:border-[#AB5F23]/50"
                }`}
              >
                {c} ({count})
              </Link>
            );
          })}
        </div>
      </div>

      {/* Grid de Produtos */}
      <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}

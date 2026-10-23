import { notFound } from "next/navigation";
import Link from "next/link";
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

  const pixPrice = product.price * 0.95;
  const installmentPrice = product.price / 3;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-[#AB5F23] transition-colors">
          Início
        </Link>
        <span>/</span>
        <Link href="/produtos" className="hover:text-[#AB5F23] transition-colors">
          Catálogo
        </Link>
        <span>/</span>
        <span className="text-[#111111] font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Visual do Produto */}
        <div className="lg:col-span-7">
          <div className="border border-line bg-surface p-4 sm:p-8 shadow-sm">
            <ProductVisual product={product} className="shadow-inner" />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted px-2">
            <span>Impressão 3D em camadas de alta resolução</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: product.tone }} />
              Tom: <strong className="text-[#111111] uppercase">{product.tone}</strong>
            </span>
          </div>
        </div>

        {/* Detalhes e Compra */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-[#AB5F23]">{product.category}</p>
          <h1 className="mt-2 font-serif text-4xl text-[#111111] sm:text-5xl">{product.name}</h1>

          {/* Bloco de Preço */}
          <div className="mt-6 border-b border-line pb-6">
            <div className="flex items-baseline gap-3">
              <p className="font-sans text-3xl font-bold text-[#111111]">{brl(product.price)}</p>
              <span className="text-xs text-muted">em até 3x de {brl(installmentPrice)} sem juros</span>
            </div>

            <div className="mt-3 inline-flex items-center gap-2 rounded-sm border border-[#AB5F23]/25 bg-[#FBF5EE] px-3 py-1.5 text-xs text-[#914D18]">
              <span className="font-bold">⚡ Pix: {brl(pixPrice)}</span>
              <span>(5% de desconto automático)</span>
            </div>
          </div>

          {/* Descrição */}
          <p className="mt-6 text-sm leading-relaxed text-[#5A5149]">{product.description}</p>

          {/* Especificações e Medidas */}
          {product.details.length > 0 && (
            <div className="mt-6 border-y border-line py-5">
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted mb-3">
                Especificações Técnicas
              </p>
              <ul className="space-y-2 text-xs text-[#332D28]">
                {product.details.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <span className="text-[#AB5F23]">•</span>
                    <span>{d}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-muted">
                  <span className="text-[#AB5F23]">•</span>
                  <span>Peso estimado: {(product.weightKg * 1000).toFixed(0)} g</span>
                </li>
              </ul>
            </div>
          )}

          {/* Alerta de Estoque Baixo */}
          {product.stock > 0 && product.stock <= 4 && (
            <p className="mt-4 text-xs font-semibold text-[#AB5F23]">
              ⚡ Apenas {product.stock} {product.stock === 1 ? "unidade disponível" : "unidades disponíveis"} em estoque!
            </p>
          )}

          {/* Botão Adicionar à Sacola */}
          <div className="mt-6">
            <AddToCartButton slug={product.slug} soldOut={product.stock === 0} />
          </div>

          {/* Benefícios Rápidos */}
          <div className="mt-8 space-y-2.5 rounded-sm border border-line bg-surface/50 p-4 text-xs text-muted">
            <div className="flex items-center gap-2">
              <span>🚚</span>
              <span>Cálculo de frete em tempo real no checkout (Melhor Envio)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🛡️</span>
              <span>Pagamento seguro via InfinitePay com garantia total</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🌱</span>
              <span>Produzido em biopolímero biodegradável sustentável</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

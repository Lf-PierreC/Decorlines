import Link from "next/link";
import { getProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export default function Home() {
  const featured = getProducts().slice(0, 3);

  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-32">
        <div className="fade-up">
          <p className="eyebrow">Decoração impressa em 3D</p>
          <h1 className="mt-6 font-serif text-5xl leading-[1.05] md:text-7xl">
            Formas simples,
            <br />
            <span className="italic">presença única.</span>
          </h1>
          <p className="mt-8 max-w-md leading-relaxed text-muted">
            Peças autorais criadas camada por camada. Vasos, luminárias e esculturas
            em tons naturais para uma casa serena e elegante.
          </p>
          <div className="mt-10 flex gap-4">
            <Link href="/produtos" className="btn">Ver coleção</Link>
            <Link href="/#sobre" className="btn btn-outline">Nossa história</Link>
          </div>
        </div>
        <div className="fade-up grid grid-cols-2 gap-4" style={{ animationDelay: "0.15s" }}>
          <div className="aspect-[3/4] bg-surface" />
          <div className="mt-12 aspect-[3/4] bg-accent" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-serif text-4xl">Destaques</h2>
          <Link href="/produtos" className="eyebrow border-b border-muted pb-1 hover:text-foreground">
            Ver tudo
          </Link>
        </div>
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      <section id="sobre" className="mx-auto mt-32 max-w-3xl scroll-mt-24 px-6 text-center">
        <p className="eyebrow">Sobre nós</p>
        <p className="mt-6 font-serif text-3xl leading-snug md:text-4xl">
          Somos uma pequena marca de família. Cada peça é projetada, impressa e
          embalada à mão, com atenção a cada detalhe.
        </p>
      </section>

      <section className="mx-auto mt-32 grid max-w-7xl gap-10 border-y border-line px-6 py-14 text-center md:grid-cols-3">
        {[
          ["Pix com 5% off", "Pagamento seguro direto no site."],
          ["Envio para todo o Brasil", "Embalagem protegida e rastreio."],
          ["Feito sob encomenda", "Escolha cores e tamanhos personalizados."],
        ].map(([t, d]) => (
          <div key={t}>
            <p className="font-serif text-2xl">{t}</p>
            <p className="mt-2 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}

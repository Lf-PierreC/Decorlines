import Link from "next/link";
import { getProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { LogoIcon } from "@/components/Logo";

export default function Home() {
  const allProducts = getProducts();
  const featured = allProducts.slice(0, 6);

  return (
    <>
      {/* 1. HERO SECTION ARQUITETÔNICA */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-white via-surface/40 to-surface/80">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-12 md:py-28">
          {/* Coluna Texto */}
          <div className="fade-up md:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#AB5F23]/25 bg-[#FBF5EE] px-3.5 py-1 text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-[#914D18]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#AB5F23] animate-pulse" />
              Design Impresso em 3D • Produção Autoral
            </div>

            <h1 className="mt-6 font-serif text-5xl leading-[1.08] text-[#111111] sm:text-6xl lg:text-7xl">
              Linhas arquitetônicas,
              <br />
              <span className="italic text-[#AB5F23]">presença contemporânea.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#5A5149] sm:text-lg">
              Vasos esculturais, luminárias e objetos de arte criados camada por camada
              em nosso estúdio. A união entre a precisão geométrica da tecnologia 3D
              e a sensibilidade dos tons e texturas contemporâneas.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/produtos" className="btn !py-3.5 !px-8">
                Explorar Catálogo
              </Link>
              <Link href="/#sobre" className="btn btn-outline !py-3.5 !px-8">
                Conhecer o Estúdio
              </Link>
            </div>

            {/* Micro selos de confiança */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-line/80 pt-6 text-xs text-muted">
              <div>
                <p className="font-semibold text-[#111111]">Biopolímero PLA</p>
                <p className="text-[0.7rem] text-muted">Origem vegetal sustentável</p>
              </div>
              <div>
                <p className="font-semibold text-[#111111]">5% OFF no Pix</p>
                <p className="text-[0.7rem] text-muted">Aprovação imediata</p>
              </div>
              <div>
                <p className="font-semibold text-[#111111]">Rastreio Total</p>
                <p className="text-[0.7rem] text-muted">Correios e Jadlog</p>
              </div>
            </div>
          </div>

          {/* Coluna Visual Hero com Composição da Marca */}
          <div className="fade-up md:col-span-5" style={{ animationDelay: "0.15s" }}>
            <div className="relative mx-auto max-w-md">
              {/* Moldura de fundo arquitetônica */}
              <div className="aspect-[4/5] rounded-sm border border-line bg-surface p-6 shadow-xl shadow-black/5 relative overflow-hidden">
                {/* Linhas decorativas sutis em tom cobre */}
                <div className="absolute inset-0 pattern-lines opacity-60" />
                
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-line pb-4">
                    <div className="flex items-center gap-2">
                      <LogoIcon className="h-6 w-6 text-[#111111]" />
                      <span className="text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-muted">
                        Atelier Decorlines
                      </span>
                    </div>
                    <span className="text-[0.62rem] font-semibold text-[#AB5F23] bg-[#FBF5EE] px-2 py-0.5 border border-[#AB5F23]/20">
                      Edição 2026
                    </span>
                  </div>

                  <div className="my-auto py-8 text-center">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white border border-line shadow-sm">
                      <LogoIcon className="h-14 w-14 text-[#111111]" />
                    </div>
                    <p className="font-serif text-2xl text-[#111111]">Vaso Aura Estriado</p>
                    <p className="mt-1 text-xs text-muted">Textura canelada contínua • Acabamento fosco</p>
                    <p className="mt-3 font-sans text-sm font-bold text-[#AB5F23]">R$ 149,00</p>
                  </div>

                  <div className="border-t border-line pt-3 flex items-center justify-between text-[0.68rem] text-muted">
                    <span>Camadas de 0.2mm</span>
                    <span className="font-medium text-[#111111]">100% Produção Própria</span>
                  </div>
                </div>
              </div>

              {/* Card flutuante sobreposto */}
              <div className="absolute -bottom-5 -left-5 hidden sm:block border border-line bg-white p-4 shadow-lg">
                <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted">Processo 3D</p>
                <p className="mt-0.5 font-serif text-sm text-[#111111]">Precisão em cada linha</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="h-1.5 w-8 rounded-full bg-[#AB5F23]" />
                  <span className="h-1.5 w-4 rounded-full bg-[#AB5F23]/40" />
                  <span className="h-1.5 w-2 rounded-full bg-[#AB5F23]/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIAS EM DESTAQUE */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { name: "Vasos & Cachepots", desc: "Formas esculturais", link: "/produtos" },
            { name: "Iluminação", desc: "Luz difusa quente", link: "/produtos" },
            { name: "Esculturas", desc: "Arte geométrica", link: "/produtos" },
            { name: "Organizadores", desc: "Bandejas e suportes", link: "/produtos" },
          ].map((cat, i) => (
            <Link
              key={cat.name}
              href={cat.link}
              className="group border border-line bg-surface/50 p-5 transition-all hover:border-[#AB5F23]/50 hover:bg-white hover:shadow-sm"
            >
              <span className="text-[0.62rem] font-bold text-[#AB5F23]">0{i + 1}</span>
              <p className="mt-2 font-serif text-lg text-[#111111] group-hover:text-[#AB5F23] transition-colors">
                {cat.name}
              </p>
              <p className="text-xs text-muted">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. VITRINE DE PRODUTOS EM DESTAQUE */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="eyebrow text-[#AB5F23]">Coleção Autoral</p>
            <h2 className="mt-1 font-serif text-4xl text-[#111111] sm:text-5xl">Peças em destaque</h2>
          </div>
          <Link
            href="/produtos"
            className="group flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#111111] hover:text-[#AB5F23] transition-colors"
          >
            <span>Ver todo o catálogo</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* 4. OS 4 PILARES DA DECORLINES */}
      <section className="border-y border-line bg-surface/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-[#AB5F23]">Por que Decorlines</p>
            <h2 className="mt-2 font-serif text-3xl text-[#111111] sm:text-4xl">
              A união entre tecnologia de ponta e cuidado artesanal
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-4">
            {[
              {
                num: "01",
                title: "Linhas & Camadas 3D",
                desc: "A fabricação aditiva deposita microcamadas precisas, criando um efeito visual e tátil exclusivo em cada peça.",
              },
              {
                num: "02",
                title: "PLA Biodegradável",
                desc: "Utilizamos filamentos premium de origem vegetal (amido de milho), recicláveis e ambientalmente responsáveis.",
              },
              {
                num: "03",
                title: "Tons e Texturas Quentes",
                desc: "Paleta selecionada de tons areia, cerâmica crua, terracota e preto escultural que combinam com qualquer ambiente.",
              },
              {
                num: "04",
                title: "Acabamento Manual",
                desc: "Cada objeto passa por inspeção minuciosa, pós-processamento à mão e embalagem protetora individual.",
              },
            ].map((pillar) => (
              <div key={pillar.title} className="border border-line bg-white p-6 shadow-sm">
                <span className="font-mono text-xs font-bold text-[#AB5F23]">{pillar.num}</span>
                <h3 className="mt-3 font-serif text-xl text-[#111111]">{pillar.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SEÇÃO SOBRE NÓS / ESTÚDIO */}
      <section id="sobre" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-24 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#FBF5EE] border border-[#AB5F23]/25">
          <LogoIcon className="h-8 w-8 text-[#111111]" />
        </div>
        <p className="eyebrow text-[#AB5F23]">Nossa História</p>
        <h2 className="mt-3 font-serif text-3xl leading-snug text-[#111111] sm:text-4xl md:text-5xl">
          Feito à mão, impresso com tecnologia,
          <br className="hidden sm:inline" />
          pensado para lares contemporâneos.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#5A5149]">
          A Decorlines nasceu da paixão pelo design de formas limpas e pela precisão da
          impressão 3D. Criamos objetos decorativos que unem a leveza das formas esculturais
          à solidez da fabricação moderna. Cada peça que sai da nossa impressora é finalizada
          com carinho para compor o seu espaço de forma memorável.
        </p>
        <div className="mt-8">
          <Link href="/produtos" className="btn !py-3 !px-7">
            Conhecer Todas as Peças
          </Link>
        </div>
      </section>

      {/* 6. VANTAGENS DE COMPRA DIRETA */}
      <section className="border-t border-line bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 text-center md:grid-cols-4">
          <div className="p-4">
            <p className="font-serif text-xl text-[#111111]">Pix com 5% OFF</p>
            <p className="mt-1 text-xs text-muted">Desconto automático aplicado no checkout seguro.</p>
          </div>
          <div className="p-4">
            <p className="font-serif text-xl text-[#111111]">Envio Todo Brasil</p>
            <p className="mt-1 text-xs text-muted">Cálculo em tempo real e rastreio passo a passo.</p>
          </div>
          <div className="p-4">
            <p className="font-serif text-xl text-[#111111]">Até 3x Sem Juros</p>
            <p className="mt-1 text-xs text-muted">Pagamento protegido no cartão de crédito.</p>
          </div>
          <div className="p-4">
            <p className="font-serif text-xl text-[#111111]">Embalagem Segura</p>
            <p className="mt-1 text-xs text-muted">Proteção anti-impacto pensada para peças 3D.</p>
          </div>
        </div>
      </section>
    </>
  );
}

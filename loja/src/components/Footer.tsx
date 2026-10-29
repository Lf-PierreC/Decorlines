import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-28 border-t border-line bg-surface/90">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-12">
        {/* Coluna Marca & Manifesto */}
        <div className="md:col-span-5">
          <Logo className="h-8 w-auto" />
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-[#5A5149]">
            Design contemporâneo em linhas precisas. Objetos decorativos, vasos e luminárias
            impressos em 3D em nosso estúdio próprio com materiais sustentáveis de alta performance.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#AB5F23]" />
            <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[#914D18]">
              Produzido no Brasil
            </span>
          </div>
        </div>

        {/* Coluna Navegação */}
        <div className="text-xs text-muted md:col-span-2">
          <p className="eyebrow mb-3.5 text-[#111111]">Navegação</p>
          <ul className="space-y-2.5">
            <li>
              <Link href="/" className="hover:text-[#AB5F23] transition-colors">
                Início
              </Link>
            </li>
            <li>
              <Link href="/produtos" className="hover:text-[#AB5F23] transition-colors">
                Catálogo Completo
              </Link>
            </li>
            <li>
              <Link href="/#sobre" className="hover:text-[#AB5F23] transition-colors">
                O Estúdio
              </Link>
            </li>
            <li>
              <Link href="/conta" className="hover:text-[#AB5F23] transition-colors">
                Meus Pedidos & Rastreio
              </Link>
            </li>
          </ul>
        </div>

        {/* Coluna Atendimento & Contato */}
        <div className="text-xs text-muted md:col-span-2">
          <p className="eyebrow mb-3.5 text-[#111111]">Atendimento</p>
          <p className="text-[#332D28] font-medium">decorlinesbrasil@gmail.com</p>
          <p className="mt-1">Segunda a Sexta, das 9h às 18h</p>
          <p className="mt-2 text-[0.7rem]">Mogi das Cruzes / SP</p>
        </div>

        {/* Coluna Pagamento & Segurança */}
        <div className="text-xs text-muted md:col-span-3">
          <p className="eyebrow mb-3.5 text-[#111111]">Pagamento & Envio</p>
          <div className="space-y-1.5 text-xs text-[#5A5149]">
            <p className="flex items-center gap-1.5">
              <span className="font-semibold text-[#111111]">⚡ </span>Pix: 5% de desconto automático
            </p>
            <p className="flex items-center gap-1.5">
              <span className="font-semibold text-[#111111]">💳 </span>Cartão: até 3x sem juros
            </p>
            <p className="flex items-center gap-1.5">
              <span className="font-semibold text-[#111111]">🚚 </span>Frete: via Melhor Envio (Correios & Jadlog)
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-line/80 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-[0.72rem] text-muted">
          <p>© {new Date().getFullYear()} Decorlines. Todos os direitos reservados.</p>
          <p className="text-[0.68rem] tracking-wider uppercase text-muted/80">
            Impressão 3D • Design • Arquitetura
          </p>
        </div>
      </div>
    </footer>
  );
}

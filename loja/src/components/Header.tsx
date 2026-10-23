import Link from "next/link";
import { getUser } from "@/lib/auth";
import { CartButton } from "./CartButton";
import { Logo } from "./Logo";

export async function Header() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-white/95 backdrop-blur-md">
      {/* Barra de anúncio superior sutil e moderna */}
      <div className="border-b border-line/60 bg-surface px-4 py-2 text-center text-[0.68rem] font-medium tracking-[0.14em] text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#AB5F23]" />
          <span>Coleção 2026 em Impressão 3D Autoral</span>
          <span className="hidden sm:inline text-line">•</span>
          <span className="hidden sm:inline">5% de desconto via Pix</span>
          <span className="hidden md:inline text-line">•</span>
          <span className="hidden md:inline">Envio seguro para todo o Brasil</span>
        </span>
      </div>

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Navegação esquerda */}
        <nav className="flex flex-1 items-center gap-6 text-[0.74rem] font-medium uppercase tracking-[0.18em] text-[#332D28] sm:gap-8">
          <Link href="/" className="transition-colors hover:text-[#AB5F23]">
            Início
          </Link>
          <Link href="/produtos" className="transition-colors hover:text-[#AB5F23]">
            Catálogo
          </Link>
          <Link href="/#sobre" className="hidden sm:block transition-colors hover:text-[#AB5F23]">
            Sobre
          </Link>
        </nav>

        {/* Logo Oficial Centralizada */}
        <div className="flex shrink-0 items-center justify-center py-2">
          <Logo className="h-8 md:h-9 w-auto" />
        </div>

        {/* Navegação direita e Ações */}
        <div className="flex flex-1 items-center justify-end gap-5 text-[0.74rem] font-medium uppercase tracking-[0.18em] text-[#332D28] sm:gap-7">
          {user?.role === "admin" && (
            <Link
              href="/admin/pedidos"
              className="badge-copper !text-[0.65rem] transition-colors hover:bg-[#AB5F23] hover:text-white"
            >
              Painel Admin
            </Link>
          )}

          {user ? (
            <Link
              href="/conta"
              className="hidden sm:block transition-colors hover:text-[#AB5F23]"
            >
              Minha Conta
            </Link>
          ) : (
            <Link
              href="/conta/entrar"
              className="transition-colors hover:text-[#AB5F23]"
            >
              Entrar
            </Link>
          )}

          <CartButton />
        </div>
      </div>
    </header>
  );
}

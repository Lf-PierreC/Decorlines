import Link from "next/link";
import { getUser } from "@/lib/auth";
import { CartButton } from "./CartButton";

export async function Header() {
  const user = await getUser();
  const link = "hover:text-muted";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <nav className="flex flex-1 gap-6 text-[0.72rem] uppercase tracking-[0.22em] sm:gap-8">
          <Link href="/" className={link}>Home</Link>
          <Link href="/produtos" className={link}>Catálogo</Link>
          <Link href="/#sobre" className={`hidden sm:block ${link}`}>Sobre</Link>
        </nav>
        <Link href="/" className="font-serif text-3xl tracking-wide">
          Decorlines
        </Link>
        <div className="flex flex-1 items-center justify-end gap-6 text-[0.72rem] uppercase tracking-[0.22em] sm:gap-8">
          {user?.role === "admin" && <Link href="/admin/pedidos" className={link}>Admin</Link>}
          {user ? (
            <Link href="/conta" className={link}>Meus pedidos</Link>
          ) : (
            <Link href="/conta/entrar" className={link}>Entrar</Link>
          )}
          <CartButton />
        </div>
      </div>
    </header>
  );
}

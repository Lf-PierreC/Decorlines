import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Painel — Decorlines" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow">Painel administrativo</p>
          <nav className="mt-3 flex gap-8 font-serif text-2xl">
            <Link href="/admin/pedidos" className="hover:text-muted">Pedidos</Link>
            <Link href="/admin/produtos" className="hover:text-muted">Produtos</Link>
          </nav>
        </div>
        <Link href="/" className="eyebrow border-b border-muted pb-1 hover:text-foreground">
          Ver loja
        </Link>
      </div>
      <div className="pt-10">{children}</div>
    </div>
  );
}

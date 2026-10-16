import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getProducts } from "@/lib/products";
import { brl } from "@/lib/format";
import { ProductVisual } from "@/components/ProductCard";
import { ConfirmButton } from "@/components/ConfirmButton";
import { removeProduct } from "../actions";

export default async function AdminProdutos() {
  await requireAdmin();
  const products = getProducts({ includeInactive: true });

  return (
    <>
      <div className="flex items-end justify-between">
        <h1 className="font-serif text-4xl">Produtos</h1>
        <Link href="/admin/produtos/novo" className="btn">Novo produto</Link>
      </div>

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {products.map((p) => (
          <li key={p.id} className="flex items-center gap-5 py-4">
            <div className="w-16 shrink-0"><ProductVisual product={p} /></div>
            <div className="flex-1">
              <p className="font-serif text-xl">{p.name}</p>
              <p className="text-xs text-muted">{p.category}</p>
            </div>
            <div className="hidden w-28 text-sm sm:block">{brl(p.price)}</div>
            <div className={`hidden w-28 text-sm sm:block ${p.stock === 0 ? "text-red-700" : ""}`}>
              {p.stock === 0 ? "Esgotado" : `${p.stock} em estoque`}
            </div>
            <div className="w-16 text-xs text-muted">{p.active ? "Ativo" : "Oculto"}</div>
            <div className="flex items-center gap-4">
              <Link href={`/admin/produtos/${p.id}`} className="text-xs underline">Editar</Link>
              <form action={removeProduct}>
                <input type="hidden" name="id" value={p.id} />
                <ConfirmButton message={`Excluir "${p.name}"? Esta ação não pode ser desfeita.`}>
                  Excluir
                </ConfirmButton>
              </form>
            </div>
          </li>
        ))}
        {products.length === 0 && (
          <li className="py-10 text-center text-muted">Nenhum produto cadastrado.</li>
        )}
      </ul>
    </>
  );
}

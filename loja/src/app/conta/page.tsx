import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { listOrders, STATUS_LABEL } from "@/lib/orders";
import { brl } from "@/lib/format";
import { logout } from "./actions";

export const metadata = { title: "Minha conta — Decorlines" };

export default async function ContaPage() {
  const user = await getUser();
  if (!user) redirect("/conta/entrar");
  const orders = listOrders(user.id);

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Minha conta</p>
          <h1 className="mt-3 font-serif text-5xl">Olá, {user.name.split(" ")[0]}</h1>
          <p className="mt-2 text-sm text-muted">{user.email}</p>
        </div>
        <form action={logout}>
          <button className="btn btn-outline">Sair</button>
        </form>
      </div>

      <h2 className="mt-16 font-serif text-3xl">Meus pedidos</h2>

      {orders.length === 0 ? (
        <div className="mt-8 border border-line p-10 text-center">
          <p className="text-muted">Você ainda não fez nenhum pedido.</p>
          <Link href="/produtos" className="btn mt-6">Ver catálogo</Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-6">
          {orders.map((o) => (
            <li key={o.code} className="border border-line p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-serif text-xl">Pedido {o.code}</p>
                  <p className="text-xs text-muted">
                    {new Date(o.created_at + "Z").toLocaleDateString("pt-BR")} ·{" "}
                    {o.payment === "pix" ? "Pix" : "Cartão"}
                  </p>
                </div>
                <span className="eyebrow border border-line px-3 py-1">
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </div>
              <ul className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
                {o.items.map((i) => (
                  <li key={i.slug} className="flex justify-between">
                    <span>{i.name} × {i.qty}</span>
                    <span>{brl(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex justify-between border-t border-line pt-4 font-serif text-xl">
                <span>Total</span>
                <span>{brl(o.total)}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

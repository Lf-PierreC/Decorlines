import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getOrderByCode, listOrders, saveOrderPaymentMeta, setOrderStatus, STATUS_LABEL } from "@/lib/orders";
import { listAddresses, listCards } from "@/lib/profile";
import { checkInfinitePayStatus } from "@/lib/payments";
import { brl } from "@/lib/format";
import { OrderTrackingBox } from "@/components/OrderTrackingBox";
import { PixPaymentPanel } from "@/components/PixPaymentPanel";
import { ProfileManager } from "@/components/ProfileManager";
import { logout } from "./actions";

export const metadata = { title: "Minha conta — Decorlines" };

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{
    order_nsu?: string;
    transaction_nsu?: string;
    slug?: string;
    receipt_url?: string;
  }>;
}) {
  const user = await getUser();
  if (!user) redirect("/conta/entrar");

  // Se o cliente acabou de voltar do Checkout da InfinitePay com os parâmetros de confirmação:
  const sp = await searchParams;
  if (sp?.order_nsu) {
    const returnedOrder = getOrderByCode(sp.order_nsu);
    if (returnedOrder && returnedOrder.user_id === user.id && returnedOrder.status === "pending") {
      const check = await checkInfinitePayStatus({
        orderCode: returnedOrder.code,
        transactionNsu: sp.transaction_nsu,
        slug: sp.slug,
      });
      if (check === "paid" || sp.transaction_nsu) {
        setOrderStatus(returnedOrder.code, "paid");
        if (returnedOrder.payment_meta) {
          saveOrderPaymentMeta(returnedOrder.code, {
            ...returnedOrder.payment_meta,
            invoiceSlug: sp.slug || returnedOrder.payment_meta.invoiceSlug,
            transactionNsu: sp.transaction_nsu || returnedOrder.payment_meta.transactionNsu,
            receiptUrl: sp.receipt_url || returnedOrder.payment_meta.receiptUrl,
          });
        }
      }
    }
  }

  const orders = listOrders(user.id);
  const addresses = listAddresses(user.id);
  const cards = listCards(user.id);

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
        <div>
          <p className="eyebrow">Minha conta</p>
          <h1 className="mt-3 font-serif text-5xl">Olá, {user.name.split(" ")[0]}</h1>
          <p className="mt-2 text-sm text-muted">{user.email}</p>
        </div>
        <form action={logout}>
          <button className="btn btn-outline">Sair</button>
        </form>
      </div>


      {/* SEÇÃO: MEUS ENDEREÇOS E MEUS CARTÕES */}
      <ProfileManager userName={user.name} addresses={addresses} cards={cards} />

      {/* SEÇÃO: MEUS PEDIDOS E RASTREIO */}
      <div className="mt-12">
        <p className="eyebrow">Histórico e rastreamento</p>
        <h2 className="mt-1 font-serif text-3xl">Meus pedidos</h2>

        {orders.length === 0 ? (
          <div className="mt-6 border border-line p-10 text-center">
            <p className="text-muted">Você ainda não fez nenhum pedido.</p>
            <Link href="/produtos" className="btn mt-6">Ver catálogo</Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-6">
            {orders.map((o) => (
              <li key={o.code} className="border border-line p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-serif text-xl">Pedido {o.code}</p>
                    <p className="text-xs text-muted">
                      {new Date(o.created_at + "Z").toLocaleDateString("pt-BR")} ·{" "}
                      {o.payment === "pix"
                        ? "Pix"
                        : o.customer?.cartao_usado
                          ? `Cartão (${o.customer.cartao_usado})`
                          : "Cartão"}
                    </p>
                  </div>
                  <span className="eyebrow border border-line px-3 py-1">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </div>

                <OrderTrackingBox
                  orderCode={o.code}
                  status={o.status}
                  trackingCode={o.tracking_code}
                  carrier={o.customer?.frete_metodo}
                />

                {o.status === "pending" && o.payment === "pix" && o.payment_meta && (
                  <div className="mt-4">
                    <PixPaymentPanel
                      orderCode={o.code}
                      total={o.total}
                      initialStatus={o.status}
                      paymentMeta={o.payment_meta}
                      compact
                    />
                  </div>
                )}

                <ul className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
                  {o.items.map((i) => (
                    <li key={i.slug} className="flex justify-between">
                      <span>{i.name} × {i.qty}</span>
                      <span>{brl(i.price * i.qty)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between text-muted">
                    <span>Frete {o.customer?.frete_metodo ? `(${o.customer.frete_metodo})` : ""}</span>
                    <span>{brl(o.shipping)}</span>
                  </li>
                  {o.discount > 0 && (
                    <li className="flex justify-between text-muted">
                      <span>Desconto Pix</span>
                      <span>−{brl(o.discount)}</span>
                    </li>
                  )}
                </ul>
                <p className="mt-4 flex justify-between border-t border-line pt-4 font-serif text-xl">
                  <span>Total</span>
                  <span>{brl(o.total)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

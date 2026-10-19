import { requireAdmin } from "@/lib/auth";
import { listAllOrders, STATUS_LABEL } from "@/lib/orders";
import { brl } from "@/lib/format";
import { updateOrderStatus } from "../actions";

export default async function AdminPedidos() {
  await requireAdmin();
  const orders = listAllOrders();
  const pending = orders.filter((o) => o.status === "pending" || o.status === "paid").length;

  return (
    <>
      <div className="flex items-end justify-between">
        <h1 className="font-serif text-4xl">Pedidos</h1>
        <p className="text-sm text-muted">
          {orders.length} no total · {pending} para tratar
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 border border-line p-10 text-center text-muted">Nenhum pedido ainda.</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {orders.map((o) => {
            const c = o.customer;
            return (
              <li key={o.code} className="border border-line p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-serif text-xl">Pedido {o.code}</p>
                    <p className="text-xs text-muted">
                      {new Date(o.created_at + "Z").toLocaleString("pt-BR")} ·{" "}
                      {o.payment === "pix" ? "Pix" : "Cartão"}
                    </p>
                  </div>
                  <form action={updateOrderStatus} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="code" value={o.code} />
                    <input
                      name="trackingCode"
                      defaultValue={o.tracking_code ?? ""}
                      placeholder="Código de rastreio (ex: AB123456789BR)"
                      className="w-64 border border-line bg-white px-3 py-2 text-sm"
                    />
                    <select
                      name="status"
                      defaultValue={o.status}
                      className="border border-line bg-white px-3 py-2 text-sm"
                    >
                      {Object.entries(STATUS_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    <button className="btn !px-4 !py-2">Salvar</button>
                  </form>
                </div>

                <div className="mt-5 grid gap-6 border-t border-line pt-5 text-sm md:grid-cols-2">
                  <div>
                    <p className="eyebrow mb-2">Cliente</p>
                    {c ? (
                      <>
                        <p>{c.nome}</p>
                        <p className="text-muted">{c.email} · {c.telefone}</p>
                        <p className="text-muted">CPF {c.cpf}</p>
                        <p className="mt-2">
                          {c.endereco}, {c.numero}
                          {c.complemento ? ` — ${c.complemento}` : ""}
                        </p>
                        <p className="text-muted">
                          {c.bairro} · {c.cidade}/{c.uf} · CEP {c.cep}
                        </p>
                        {c.frete_metodo && (
                          <p className="mt-2 text-xs font-medium text-foreground">
                            Envio: {c.frete_metodo}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted">Sem dados de entrega registrados.</p>
                    )}
                    {o.account_name && (
                      <p className="mt-2 text-xs text-muted">Conta: {o.account_name}</p>
                    )}
                  </div>
                  <div>
                    <p className="eyebrow mb-2">Itens</p>
                    <ul className="space-y-1">
                      {o.items.map((i) => (
                        <li key={i.slug} className="flex justify-between">
                          <span>{i.name} × {i.qty}</span>
                          <span>{brl(i.price * i.qty)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 space-y-1 border-t border-line pt-3 text-muted">
                      <p className="flex justify-between">
                        <span>Frete {c?.frete_metodo ? `(${c.frete_metodo})` : ""}</span>
                        <span>{brl(o.shipping)}</span>
                      </p>
                      {o.discount > 0 && (
                        <p className="flex justify-between"><span>Desconto Pix</span><span>−{brl(o.discount)}</span></p>
                      )}
                      <p className="flex justify-between font-serif text-xl text-foreground">
                        <span>Total</span><span>{brl(o.total)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

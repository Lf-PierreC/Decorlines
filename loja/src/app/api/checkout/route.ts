import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createOrder } from "@/lib/orders";

const clip = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);

/**
 * ROTA DE CHECKOUT (pagamento simulado).
 * Aqui entrarão, nesta ordem:
 *  1. Cálculo de frete (Kangu / Melhor Envio)
 *  2. Cobrança na InfinitePay (Pix ou cartão)
 * Preços e estoque são sempre conferidos no servidor.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const items = Array.isArray(body.items)
    ? body.items.map((i: { slug: unknown; qty: unknown }) => ({ slug: String(i.slug), qty: Number(i.qty) }))
    : [];
  const payment = body.payment === "card" ? "card" : "pix";

  const c = body.customer ?? {};
  const customer = {
    nome: clip(c.nome),
    email: clip(c.email),
    cpf: clip(c.cpf, 20),
    telefone: clip(c.telefone, 30),
    cep: clip(c.cep, 12),
    endereco: clip(c.endereco),
    numero: clip(c.numero, 20),
    complemento: clip(c.complemento),
    bairro: clip(c.bairro),
    cidade: clip(c.cidade),
    uf: clip(c.uf, 2).toUpperCase(),
  };

  const user = await getUser();
  const result = createOrder({ userId: user?.id ?? null, items, payment, customer });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  // TODO: InfinitePay -> criar cobrança
  return NextResponse.json({
    orderId: result.code,
    total: result.total,
    loggedIn: !!user,
    simulated: true,
  });
}

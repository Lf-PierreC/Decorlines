import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createOrder, saveOrderPaymentMeta } from "@/lib/orders";
import { createCardCharge, createPixCharge } from "@/lib/payments";
import { addAddress, addCard, listAddresses, listCards } from "@/lib/profile";
import { calculateShipping } from "@/lib/shipping";

const clip = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);

/**
 * ROTA DE CHECKOUT.
 * 1. Exige que o cliente esteja autenticado
 * 2. Recalcula e valida o frete no Melhor Envio para o CEP informado
 * 3. Salva endereço/cartão no perfil se solicitado
 * 4. Cria o pedido e gera a cobrança Pix (QR Code + Copia e Cola) ou Cartão
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Entre na sua conta para finalizar o pedido." },
      { status: 401 },
    );
  }

  const body = await req.json();
  const items = Array.isArray(body.items)
    ? body.items.map((i: { slug: unknown; qty: unknown }) => ({ slug: String(i.slug), qty: Number(i.qty) }))
    : [];
  const payment = body.payment === "card" ? "card" : "pix";
  const shippingId = Number(body.shippingId);
  const installments = Math.min(3, Math.max(1, Number(body.installments) || 1));

  const c = body.customer ?? {};
  const cep = clip(c.cep, 12).replace(/\D/g, "").slice(0, 8);

  const quote = await calculateShipping(cep, items);
  if (!quote.ok) {
    return NextResponse.json({ error: quote.error }, { status: 400 });
  }
  const chosenShipping = quote.options.find((o) => o.id === shippingId) ?? quote.options[0];
  if (!chosenShipping) {
    return NextResponse.json({ error: "Selecione uma opção de frete válida." }, { status: 400 });
  }

  const nome = clip(c.nome) || user.name;
  const email = clip(c.email) || user.email;
  const cpf = clip(c.cpf, 20);
  const endereco = clip(c.endereco);
  const numero = clip(c.numero, 20);
  const complemento = clip(c.complemento);
  const bairro = clip(c.bairro);
  const cidade = clip(c.cidade);
  const uf = clip(c.uf, 2).toUpperCase();

  const existingAddresses = listAddresses(user.id);
  if ((body.saveAddress || existingAddresses.length === 0) && cep.length === 8 && endereco && numero) {
    addAddress(user.id, {
      label: clip(c.addressLabel, 40) || "Principal",
      recipient: nome,
      cep,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
    });
  }

  let cartaoUsado = "";
  if (payment === "card") {
    const selectedCardId = Number(body.selectedCardId);
    const userCards = listCards(user.id);
    const existingCard = userCards.find((card) => card.id === selectedCardId);

    if (existingCard) {
      cartaoUsado = `${existingCard.brand} •••• ${existingCard.last4} (${installments}x)`;
    } else {
      const cardDigits = String(c.cardNumber ?? "").replace(/\D/g, "");
      const holderName = clip(c.cardHolder) || nome;
      const expiry = clip(c.cardExpiry, 5);
      if (cardDigits.length < 13) {
        return NextResponse.json({ error: "Informe um número de cartão válido." }, { status: 400 });
      }
      if (body.saveCard || userCards.length === 0) {
        const saved = addCard(user.id, {
          label: clip(c.cardLabel, 40),
          holderName,
          cardNumberDigits: cardDigits,
          expiry: expiry || "12/29",
        });
        cartaoUsado = `${saved.brand} •••• ${saved.last4} (${installments}x)`;
      } else {
        cartaoUsado = `final ${cardDigits.slice(-4)} (${installments}x)`;
      }
    }
  }

  const customer: Record<string, string> = {
    nome,
    email,
    cpf,
    telefone: clip(c.telefone, 30),
    cep,
    endereco,
    numero,
    complemento,
    bairro,
    cidade,
    uf,
    frete_metodo: `${chosenShipping.label} (${chosenShipping.deliveryDays} ${chosenShipping.deliveryDays === 1 ? "dia útil" : "dias úteis"})`,
    ...(cartaoUsado ? { cartao_usado: cartaoUsado } : {}),
  };

  const result = createOrder({
    userId: user.id,
    items,
    payment,
    shippingPrice: chosenShipping.price,
    customer,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  if (payment === "pix") {
    const paymentMeta = await createPixCharge({
      orderCode: result.code,
      total: result.total,
      customer: { nome, email, cpf },
    });
    saveOrderPaymentMeta(result.code, paymentMeta);
    return NextResponse.json({
      orderId: result.code,
      total: result.total,
      payment: "pix",
      status: "pending",
      paymentMeta,
    });
  } else {
    const cardResult = await createCardCharge({
      orderCode: result.code,
      total: result.total,
      installments,
      cardSummary: cartaoUsado,
      customer: { nome, email, cpf },
    });
    const newStatus = cardResult.approved ? "paid" : "pending";
    saveOrderPaymentMeta(result.code, cardResult.meta, newStatus);
    return NextResponse.json({
      orderId: result.code,
      total: result.total,
      payment: "card",
      status: newStatus,
      paymentMeta: cardResult.meta,
    });
  }
}

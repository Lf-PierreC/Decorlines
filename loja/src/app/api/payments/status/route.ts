import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getOrderByCode, setOrderStatus } from "@/lib/orders";
import { checkInfinitePayStatus, checkMercadoPagoStatus } from "@/lib/payments";

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const code = String(searchParams.get("code") ?? "").trim();
  const order = getOrderByCode(code);

  if (!order || (order.user_id !== user.id && user.role !== "admin")) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  let currentStatus = order.status;

  // 1. Se estiver pendente e for InfinitePay, consulta na API oficial da InfinitePay
  if (currentStatus === "pending" && order.payment_meta?.provider === "infinitepay") {
    const ipStatus = await checkInfinitePayStatus({
      orderCode: order.code,
      transactionNsu: order.payment_meta.transactionNsu,
      slug: order.payment_meta.invoiceSlug,
    });
    if (ipStatus === "paid") {
      setOrderStatus(order.code, "paid");
      currentStatus = "paid";
    }
  }

  // 2. Se estiver pendente e for Mercado Pago, consulta na API deles
  if (
    currentStatus === "pending" &&
    order.payment_meta?.provider === "mercadopago" &&
    order.payment_meta.gatewayPaymentId
  ) {
    const mpStatus = await checkMercadoPagoStatus(order.payment_meta.gatewayPaymentId);
    if (mpStatus === "paid") {
      setOrderStatus(order.code, "paid");
      currentStatus = "paid";
    }
  }

  return NextResponse.json({
    code: order.code,
    status: currentStatus,
    paymentMeta: order.payment_meta,
  });
}

/**
 * Permite confirmar o pagamento Pix em modo Sandbox (enquanto a InfiniteTag ainda não foi colocada no .env.local)
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json();
  const code = String(body.code ?? "").trim();
  const order = getOrderByCode(code);

  if (!order || (order.user_id !== user.id && user.role !== "admin")) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  if (order.payment_meta?.sandbox || user.role === "admin") {
    setOrderStatus(order.code, "paid");
    return NextResponse.json({ ok: true, status: "paid" });
  }

  return NextResponse.json({ error: "Apenas pedidos em modo Sandbox podem ser simulados." }, { status: 400 });
}

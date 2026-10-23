import { NextResponse } from "next/server";
import { getOrderByCode, saveOrderPaymentMeta, setOrderStatus } from "@/lib/orders";
import { checkMercadoPagoStatus } from "@/lib/payments";

/**
 * Webhook oficial para receber notificações automáticas de pagamento aprovado:
 * - InfinitePay (envia { order_nsu: "DL-...", invoice_slug, transaction_nsu, paid_amount, receipt_url })
 * - Mercado Pago (envia { type: "payment", data: { id } })
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Notificação oficial da InfinitePay
    if (body.order_nsu) {
      const order = getOrderByCode(String(body.order_nsu));
      if (order) {
        const isPaid =
          body.paid === true ||
          (typeof body.paid_amount === "number" && body.paid_amount > 0) ||
          Boolean(body.transaction_nsu) ||
          body.status === "approved" ||
          body.status === "paid";

        if (isPaid && order.status === "pending") {
          setOrderStatus(order.code, "paid");
          if (order.payment_meta) {
            saveOrderPaymentMeta(order.code, {
              ...order.payment_meta,
              invoiceSlug: body.invoice_slug || order.payment_meta.invoiceSlug,
              transactionNsu: body.transaction_nsu || order.payment_meta.transactionNsu,
              receiptUrl: body.receipt_url || order.payment_meta.receiptUrl,
            });
          }
        }
      }
      return NextResponse.json({ success: true, received: true });
    }

    // 2. Notificação do Mercado Pago (opcional)
    const paymentId = body?.data?.id || body?.id;
    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
    if (paymentId && mpToken) {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(String(paymentId))}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${mpToken}`,
        },
        cache: "no-store",
      });
      if (res.ok) {
        const payment = await res.json();
        const code = payment?.external_reference;
        const status = await checkMercadoPagoStatus(String(paymentId));
        if (code && status === "paid") {
          setOrderStatus(String(code), "paid");
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }
}

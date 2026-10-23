import "server-only";
import { createHash, randomUUID } from "node:crypto";

export type PaymentMeta = {
  provider: "infinitepay" | "mercadopago" | "sandbox";
  gatewayPaymentId?: string;
  invoiceSlug?: string;
  transactionNsu?: string;
  receiptUrl?: string;
  pixCode?: string;
  pixQrDataUrl?: string;
  pixExpiresAt?: string;
  checkoutUrl?: string;
  installments?: number;
  cardSummary?: string;
  sandbox: boolean;
};

/**
 * Gera um QR Code visual em SVG determinístico para o modo Sandbox
 * (enquanto a INFINITEPAY_HANDLE dos seus pais ainda não foi preenchida no .env.local).
 */
function buildSandboxQrSvgDataUrl(seed: string): string {
  const hash = createHash("sha256").update(seed).digest();
  const size = 21;
  const cells: string[] = [];

  function isFinder(r: number, c: number) {
    const inTL = r < 7 && c < 7;
    const inTR = r < 7 && c >= size - 7;
    const inBL = r >= size - 7 && c < 7;
    return inTL || inTR || inBL;
  }

  function finderBit(r: number, c: number) {
    const lr = r >= size - 7 ? r - (size - 7) : r;
    const lc = c >= size - 7 ? c - (size - 7) : c;
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
    return false;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let dark = false;
      if (isFinder(r, c)) {
        dark = finderBit(r, c);
      } else {
        const idx = (r * size + c) % (hash.length * 8);
        const byte = hash[Math.floor(idx / 8)];
        dark = ((byte >> (idx % 8)) & 1) === 1;
      }
      if (dark) {
        cells.push(`<rect x="${c + 2}" y="${r + 2}" width="1" height="1" fill="#2a1f19"/>`);
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size + 4} ${size + 4}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/>${cells.join("")}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildSandboxPixCode(orderCode: string, total: number): string {
  const val = total.toFixed(2);
  return `00020126580014BR.GOV.BCB.PIX0136decorlines-pix-${orderCode.toLowerCase()}520400005303986540${val.length}${val}5802BR5910DECORLINES6009SAO PAULO62140510${orderCode}6304ABCD`;
}

/**
 * Cria um link/fatura oficial na API de Checkout Integrado da InfinitePay
 * Endpoint oficial: POST https://api.infinitepay.io/invoices/public/checkout/links
 */
async function createInfinitePayCheckoutLink(input: {
  handle: string;
  orderCode: string;
  total: number;
  customer: { nome: string; email: string; cpf: string; telefone?: string };
}): Promise<{ checkoutUrl: string; invoiceSlug?: string }> {
  const cleanHandle = input.handle.replace(/^[@$]/, "").trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const priceInCents = Math.round(input.total * 100);

  // Tenta criar o link via API oficial da InfinitePay
  try {
    const res = await fetch("https://api.infinitepay.io/invoices/public/checkout/links", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        handle: cleanHandle,
        order_nsu: input.orderCode,
        redirect_url: `${siteUrl}/conta`,
        webhook_url: `${siteUrl}/api/payments/webhook`,
        customer: {
          name: input.customer.nome,
          email: input.customer.email,
        },
        items: [
          {
            quantity: 1,
            price: priceInCents,
            description: `Pedido ${input.orderCode} - Decorlines`,
          },
        ],
      }),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.url) {
        const slugMatch = String(data.url).split("/").pop()?.split("?")[0];
        return {
          checkoutUrl: String(data.url),
          invoiceSlug: slugMatch || undefined,
        };
      }
    }
  } catch {
    // Fallback para a URL direta da InfinitePay caso a API esteja oscilando
  }

  const itemsParam = JSON.stringify([
    {
      name: `Pedido ${input.orderCode} - Decorlines`,
      price: priceInCents,
      quantity: 1,
    },
  ]);
  const fallbackUrl = `https://checkout.infinitepay.io/${encodeURIComponent(cleanHandle)}?items=${encodeURIComponent(itemsParam)}&order_nsu=${encodeURIComponent(input.orderCode)}&customer_name=${encodeURIComponent(input.customer.nome)}&customer_email=${encodeURIComponent(input.customer.email)}&redirect_url=${encodeURIComponent(`${siteUrl}/conta`)}`;

  return { checkoutUrl: fallbackUrl };
}

/**
 * Cria uma cobrança Pix priorizando a InfinitePay (INFINITEPAY_HANDLE).
 * Se não estiver configurada ainda, opera em modo Sandbox local para testes.
 */
export async function createPixCharge(input: {
  orderCode: string;
  total: number;
  customer: { nome: string; email: string; cpf: string };
}): Promise<PaymentMeta> {
  const infiniteHandle = process.env.INFINITEPAY_HANDLE?.trim().replace(/^[@$]/, "");
  const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();

  // 1. PRIORIDADE 1: InfinitePay (Taxa 0,00% no Pix e cadastro com CPF)
  if (infiniteHandle) {
    const { checkoutUrl, invoiceSlug } = await createInfinitePayCheckoutLink({
      handle: infiniteHandle,
      orderCode: input.orderCode,
      total: input.total,
      customer: input.customer,
    });

    const pixCode = buildSandboxPixCode(input.orderCode, input.total);
    return {
      provider: "infinitepay",
      invoiceSlug,
      pixCode,
      pixQrDataUrl: buildSandboxQrSvgDataUrl(checkoutUrl),
      pixExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      checkoutUrl,
      sandbox: false,
    };
  }

  // 2. Opcional: Se um dia quiserem Mercado Pago, também suporta
  if (mpToken) {
    try {
      const [firstName, ...rest] = input.customer.nome.trim().split(/\s+/);
      const lastName = rest.join(" ") || "Cliente";
      const cpfDigits = input.customer.cpf.replace(/\D/g, "");

      const res = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${mpToken}`,
          "X-Idempotency-Key": `${input.orderCode}-${randomUUID()}`,
        },
        body: JSON.stringify({
          transaction_amount: Number(input.total.toFixed(2)),
          description: `Pedido ${input.orderCode} - Decorlines`,
          payment_method_id: "pix",
          external_reference: input.orderCode,
          payer: {
            email: input.customer.email,
            first_name: firstName,
            last_name: lastName,
            ...(cpfDigits.length === 11
              ? { identification: { type: "CPF", number: cpfDigits } }
              : {}),
          },
        }),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const tx = data?.point_of_interaction?.transaction_data;
        if (tx?.qr_code) {
          return {
            provider: "mercadopago",
            gatewayPaymentId: String(data.id),
            pixCode: tx.qr_code,
            pixQrDataUrl: tx.qr_code_base64
              ? `data:image/png;base64,${tx.qr_code_base64}`
              : buildSandboxQrSvgDataUrl(tx.qr_code),
            pixExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            sandbox: false,
          };
        }
      }
    } catch {
      // Fallback para sandbox
    }
  }

  // 3. Modo Sandbox (pronto para testes locais antes de colocar a INFINITEPAY_HANDLE no .env.local)
  const pixCode = buildSandboxPixCode(input.orderCode, input.total);
  return {
    provider: "sandbox",
    gatewayPaymentId: `sim_pix_${input.orderCode}`,
    pixCode,
    pixQrDataUrl: buildSandboxQrSvgDataUrl(pixCode),
    pixExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    sandbox: true,
  };
}

/**
 * Processa cobrança por Cartão de Crédito via InfinitePay (ou Sandbox enquanto sem chave).
 */
export async function createCardCharge(input: {
  orderCode: string;
  total: number;
  installments: number;
  cardSummary: string;
  customer: { nome: string; email: string; cpf: string };
}): Promise<{ approved: boolean; meta: PaymentMeta }> {
  const infiniteHandle = process.env.INFINITEPAY_HANDLE?.trim().replace(/^[@$]/, "");

  if (infiniteHandle) {
    const { checkoutUrl, invoiceSlug } = await createInfinitePayCheckoutLink({
      handle: infiniteHandle,
      orderCode: input.orderCode,
      total: input.total,
      customer: input.customer,
    });

    return {
      approved: false,
      meta: {
        provider: "infinitepay",
        invoiceSlug,
        installments: input.installments,
        cardSummary: input.cardSummary,
        checkoutUrl,
        sandbox: false,
      },
    };
  }

  // Modo Sandbox: aprova o pagamento com cartão na hora para você testar todo o fluxo
  return {
    approved: true,
    meta: {
      provider: "sandbox",
      gatewayPaymentId: `sim_card_${input.orderCode}`,
      installments: input.installments,
      cardSummary: input.cardSummary,
      sandbox: true,
    },
  };
}

/**
 * Consulta na API pública da InfinitePay se um pedido já foi pago.
 * Endpoint oficial: POST https://api.infinitepay.io/invoices/public/checkout/payment_check
 */
export async function checkInfinitePayStatus(input: {
  orderCode: string;
  transactionNsu?: string;
  slug?: string;
}): Promise<"paid" | "pending"> {
  const infiniteHandle = process.env.INFINITEPAY_HANDLE?.trim().replace(/^[@$]/, "");
  if (!infiniteHandle) return "pending";

  try {
    const res = await fetch("https://api.infinitepay.io/invoices/public/checkout/payment_check", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        handle: infiniteHandle,
        order_nsu: input.orderCode,
        ...(input.transactionNsu ? { transaction_nsu: input.transactionNsu } : {}),
        ...(input.slug ? { slug: input.slug } : {}),
      }),
      cache: "no-store",
    });

    if (!res.ok) return "pending";
    const data = await res.json();
    if (data?.paid === true || data?.success === true && data?.paid) {
      return "paid";
    }
    return "pending";
  } catch {
    return "pending";
  }
}

/**
 * Consulta no Mercado Pago se um pagamento Pix já foi pago (caso usem Mercado Pago no futuro).
 */
export async function checkMercadoPagoStatus(gatewayPaymentId: string): Promise<"paid" | "pending" | "canceled"> {
  const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!mpToken || !gatewayPaymentId || gatewayPaymentId.startsWith("sim_")) {
    return "pending";
  }
  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(gatewayPaymentId)}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${mpToken}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return "pending";
    const data = await res.json();
    if (data.status === "approved") return "paid";
    if (data.status === "cancelled" || data.status === "rejected") return "canceled";
    return "pending";
  } catch {
    return "pending";
  }
}

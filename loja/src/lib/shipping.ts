import "server-only";
import { getProduct } from "./products";

export type ShippingOption = {
  id: number;
  company: string;
  name: string;
  label: string;
  price: number;
  deliveryDays: number;
};

type MelhorEnvioService = {
  id: number;
  name: string;
  price?: string;
  custom_price?: string;
  delivery_time?: number;
  custom_delivery_time?: number;
  error?: string;
  company?: { name?: string };
};

export function cleanCep(cep: string): string {
  return String(cep ?? "").replace(/\D/g, "").slice(0, 8);
}

/**
 * Calcula opções de frete em tempo real na API v2 do Melhor Envio
 * usando o peso real e o valor segurado de cada peça do carrinho.
 */
export async function calculateShipping(
  destinationCep: string,
  items: { slug: string; qty: number }[],
): Promise<{ ok: true; options: ShippingOption[] } | { ok: false; error: string }> {
  const toCep = cleanCep(destinationCep);
  if (toCep.length !== 8) {
    return { ok: false, error: "Informe um CEP válido com 8 dígitos." };
  }
  if (!items.length) {
    return { ok: false, error: "Carrinho vazio." };
  }

  const token = process.env.MELHOR_ENVIO_TOKEN;
  const fromCep = cleanCep(process.env.MELHOR_ENVIO_CEP_ORIGEM ?? "08810230");
  const baseUrl = process.env.MELHOR_ENVIO_URL ?? "https://www.melhorenvio.com.br";

  const productsPayload = [];
  for (const item of items) {
    const p = getProduct(item.slug);
    if (!p || item.qty < 1) continue;
    productsPayload.push({
      id: p.slug,
      width: 16,
      height: 22,
      length: 16,
      weight: Math.max(0.1, Number(p.weightKg) || 0.3),
      insurance_value: Number(p.price) || 50,
      quantity: item.qty,
    });
  }

  if (!productsPayload.length) {
    return { ok: false, error: "Nenhum produto válido para cotação." };
  }

  if (!token) {
    return {
      ok: true,
      options: [
        { id: 1, company: "Correios", name: "PAC", label: "Correios PAC", price: 19.9, deliveryDays: 6 },
        { id: 2, company: "Correios", name: "SEDEX", label: "Correios SEDEX", price: 27.9, deliveryDays: 2 },
      ],
    };
  }

  try {
    const res = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Decorlines E-commerce (contato@decorlines.com.br)",
      },
      body: JSON.stringify({
        from: { postal_code: fromCep },
        to: { postal_code: toCep },
        products: productsPayload,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, error: "Não foi possível consultar o frete no momento." };
    }

    const data = (await res.json()) as MelhorEnvioService[];
    if (!Array.isArray(data)) {
      return { ok: false, error: "Resposta inválida da transportadora." };
    }

    const options: ShippingOption[] = [];
    for (const s of data) {
      if (s.error) continue;
      const rawPrice = Number(s.custom_price ?? s.price);
      const days = Number(s.custom_delivery_time ?? s.delivery_time);
      if (!Number.isFinite(rawPrice) || rawPrice <= 0 || !Number.isFinite(days)) continue;

      const company = s.company?.name ?? "Transportadora";
      options.push({
        id: s.id,
        company,
        name: s.name,
        label: `${company} ${s.name}`,
        price: Number(rawPrice.toFixed(2)),
        deliveryDays: days,
      });
    }

    options.sort((a, b) => a.price - b.price);

    if (options.length === 0) {
      return { ok: false, error: "Nenhuma transportadora disponível para este CEP." };
    }

    return { ok: true, options };
  } catch {
    return { ok: false, error: "Falha de conexão ao consultar o Melhor Envio." };
  }
}

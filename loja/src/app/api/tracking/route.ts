import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

type TrackingEvent = {
  date: string;
  title: string;
  location: string;
};

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();
  const orderCode = String(body.code ?? "").trim();

  const row = db
    .prepare("SELECT code, user_id, status, tracking_code, customer, created_at FROM orders WHERE code = ?")
    .get(orderCode) as unknown as
    | {
        code: string;
        user_id: number | null;
        status: string;
        tracking_code: string | null;
        customer: string | null;
        created_at: string;
      }
    | undefined;

  if (!row || (row.user_id !== user.id && user.role !== "admin")) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const customer = row.customer ? (JSON.parse(row.customer) as Record<string, string>) : null;
  const trackingCode = row.tracking_code?.trim() || "";
  const carrier = customer?.frete_metodo ?? "Transportadora";
  const dest = customer?.cidade ? `${customer.cidade}/${customer.uf}` : "endereço do cliente";

  // Tenta consultar na API do Melhor Envio caso seja um ID de etiqueta do Melhor Envio
  const token = process.env.MELHOR_ENVIO_TOKEN;
  const baseUrl = process.env.MELHOR_ENVIO_URL ?? "https://www.melhorenvio.com.br";
  if (token && trackingCode) {
    try {
      const res = await fetch(`${baseUrl}/api/v2/me/shipment/tracking`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "Decorlines E-commerce (contato@decorlines.com.br)",
        },
        body: JSON.stringify({ orders: [trackingCode] }),
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as Record<
          string,
          { status?: string; tracking?: string; melhorenvio_tracking?: string }
        >;
        const info = data?.[trackingCode];
        if (info?.status) {
          return NextResponse.json({
            trackingCode: info.tracking || trackingCode,
            externalUrl: `https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(info.tracking || trackingCode)}`,
            carrier,
            events: [
              {
                date: new Date().toLocaleString("pt-BR"),
                title: `Status Melhor Envio: ${info.status}`,
                location: dest,
              },
            ],
          });
        }
      }
    } catch {
      // Continua para o histórico de eventos do pedido
    }
  }

  const createdDate = new Date(row.created_at + "Z").toLocaleString("pt-BR");
  const events: TrackingEvent[] = [
    {
      date: createdDate,
      title: "Pedido recebido pela Decorlines",
      location: "Mogi das Cruzes/SP",
    },
  ];

  if (row.status === "paid" || row.status === "shipped" || row.status === "delivered") {
    events.unshift({
      date: createdDate,
      title: "Pagamento confirmado · Peça em produção/embalagem",
      location: "Ateliê Decorlines · Mogi das Cruzes/SP",
    });
  }

  if (row.status === "shipped" || row.status === "delivered") {
    events.unshift({
      date: "Atualizado recentemente",
      title: `Objeto postado e em trânsito via ${carrier}`,
      location: `De Mogi das Cruzes/SP para ${dest}`,
    });
  }

  if (row.status === "delivered") {
    events.unshift({
      date: "Concluído",
      title: "Objeto entregue ao destinatário",
      location: dest,
    });
  }

  return NextResponse.json({
    trackingCode,
    externalUrl: trackingCode
      ? `https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(trackingCode)}`
      : null,
    carrier,
    events,
  });
}

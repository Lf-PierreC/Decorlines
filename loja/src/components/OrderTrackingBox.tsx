"use client";

import { useState } from "react";

type TrackingEvent = {
  date: string;
  title: string;
  location: string;
};

const STEPS = [
  { key: "pending", label: "Pedido recebido" },
  { key: "paid", label: "Em preparação" },
  { key: "shipped", label: "Em rota" },
  { key: "delivered", label: "Entregue" },
] as const;

function stepIndex(status: string): number {
  if (status === "delivered") return 3;
  if (status === "shipped") return 2;
  if (status === "paid") return 1;
  return 0;
}

export function OrderTrackingBox({
  orderCode,
  status,
  trackingCode,
  carrier,
}: {
  orderCode: string;
  status: string;
  trackingCode: string | null;
  carrier?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<TrackingEvent[] | null>(null);
  const [externalUrl, setExternalUrl] = useState<string | null>(null);

  if (status === "canceled") {
    return (
      <div className="mt-4 border border-red-200 bg-red-50/40 px-4 py-3 text-xs text-red-800">
        Este pedido foi cancelado.
      </div>
    );
  }

  const currentIdx = stepIndex(status);

  async function toggleTracking() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (events) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: orderCode }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
        setExternalUrl(data.externalUrl ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5 border-t border-line pt-5">
      {/* Barra visual de progresso do pedido */}
      <div className="grid grid-cols-4 gap-2">
        {STEPS.map((step, idx) => {
          const active = idx <= currentIdx;
          return (
            <div key={step.key} className="text-center">
              <div
                className={`h-1.5 w-full transition-colors ${
                  active ? "bg-accent" : "bg-line"
                }`}
              />
              <p
                className={`mt-2 text-[0.68rem] uppercase tracking-[0.14em] ${
                  active ? "font-medium text-foreground" : "text-muted"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-surface px-4 py-3 text-xs">
        <div>
          {trackingCode ? (
            <p>
              <span className="text-muted">Código de rastreio:</span>{" "}
              <strong className="font-mono tracking-wider text-foreground">{trackingCode}</strong>
              {carrier ? <span className="text-muted"> · {carrier}</span> : null}
            </p>
          ) : (
            <p className="text-muted">
              {status === "pending"
                ? "Aguardando confirmação do pagamento para iniciar o envio."
                : "Sua peça está sendo preparada. O código de rastreio aparecerá aqui assim que for postada."}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={toggleTracking}
          className="underline hover:text-muted"
        >
          {open ? "Ocultar rota" : "Acompanhar pedido em rota"}
        </button>
      </div>

      {open && (
        <div className="mt-3 border border-line p-4 text-xs">
          {loading ? (
            <p className="text-muted">Consultando atualizações de rota...</p>
          ) : (
            <>
              <ol className="space-y-3">
                {(events ?? []).map((ev, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        i === 0 ? "bg-accent" : "bg-line"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-foreground">{ev.title}</p>
                      <p className="text-muted">
                        {ev.location} · {ev.date}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              {externalUrl && (
                <div className="mt-4 border-t border-line pt-3">
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block underline hover:text-muted"
                  >
                    Abrir rastreamento detalhado na transportadora (Melhor Rastreio) ↗
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

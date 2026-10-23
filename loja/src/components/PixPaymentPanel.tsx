"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentMeta } from "@/lib/payments";
import { brl } from "@/lib/format";

export function PixPaymentPanel({
  orderCode,
  total,
  initialStatus,
  paymentMeta,
  compact = false,
}: {
  orderCode: string;
  total: number;
  initialStatus: string;
  paymentMeta: PaymentMeta;
  compact?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Consulta automática a cada 4s enquanto estiver aguardando pagamento
  useEffect(() => {
    if (status !== "pending") return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status?code=${encodeURIComponent(orderCode)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status && data.status !== "pending") {
          setStatus(data.status);
          router.refresh();
        }
      } catch {
        // Ignora falhas de rede temporárias
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [orderCode, status, router]);

  async function copyPixCode() {
    if (!paymentMeta.pixCode) return;
    try {
      await navigator.clipboard.writeText(paymentMeta.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  }

  async function simulateApproval() {
    setSimulating(true);
    try {
      const res = await fetch("/api/payments/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: orderCode }),
      });
      if (res.ok) {
        setStatus("paid");
        router.refresh();
      }
    } finally {
      setSimulating(false);
    }
  }

  if (status === "paid" || status === "shipped" || status === "delivered") {
    return (
      <div className="border border-line bg-surface p-6 text-center">
        <p className="eyebrow">Pagamento confirmado</p>
        <p className="mt-2 font-serif text-3xl">Tudo certo com o seu pedido!</p>
        <p className="mt-2 text-sm text-muted">
          O pagamento de {brl(total)} foi aprovado e sua peça já entrou em preparação.
        </p>
      </div>
    );
  }

  return (
    <div className={`border border-line bg-surface/60 ${compact ? "p-5" : "p-8"}`}>
      <div className="flex flex-col items-center text-center">
        <p className="eyebrow">Pagamento via Pix (5% de desconto aplicado)</p>
        <p className="mt-2 font-serif text-3xl">{brl(total)}</p>
        <p className="mt-1 max-w-md text-xs text-muted">
          Escaneie o QR Code abaixo no aplicativo do seu banco ou copie o código Pix Copia e Cola.
          A confirmação é automática em segundos.
        </p>

        {paymentMeta.pixQrDataUrl && (
          <div className="mt-6 border border-line bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={paymentMeta.pixQrDataUrl}
              alt="QR Code Pix"
              className="h-48 w-48 object-contain"
            />
          </div>
        )}

        {paymentMeta.pixCode && (
          <div className="mt-5 w-full max-w-md">
            <div className="flex items-center gap-2 border border-line bg-white p-2">
              <input
                readOnly
                value={paymentMeta.pixCode}
                className="w-full bg-transparent px-2 font-mono text-xs text-muted outline-none"
              />
              <button
                type="button"
                onClick={copyPixCode}
                className="btn !px-4 !py-2 shrink-0"
              >
                {copied ? "Copiado!" : "Copiar código"}
              </button>
            </div>
          </div>
        )}

        {paymentMeta.checkoutUrl && (
          <div className="mt-4">
            <a
              href={paymentMeta.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              Abrir Checkout Seguro InfinitePay ↗
            </a>
          </div>
        )}

        {paymentMeta.sandbox && (
          <div className="mt-6 w-full max-w-md border border-dashed border-line bg-white/80 p-4 text-xs">
            <p className="text-muted">
              <strong>Modo de Teste (Sandbox):</strong> Assim que você colocar a{" "}
              <strong>InfiniteTag</strong> dos seus pais (<code>INFINITEPAY_HANDLE</code>) no
              arquivo <code>.env.local</code>, o checkout e o Pix passarão a cair direto na conta
              real deles na <em>InfinitePay</em> (com taxa 0% no Pix).
            </p>
            <button
              type="button"
              disabled={simulating}
              onClick={simulateApproval}
              className="btn btn-outline mt-3 w-full !py-2"
            >
              {simulating ? "Confirmando..." : "Simular pagamento Pix aprovado agora"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

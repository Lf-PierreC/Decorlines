"use client";

import { useState } from "react";
import Link from "next/link";
import { clearCart, useCart } from "@/lib/cart";
import type { CartProduct } from "@/lib/products";
import { brl } from "@/lib/format";

type Result = { orderId: string; total: number; loggedIn: boolean };

export function CheckoutForm({
  user,
  products,
}: {
  user: { name: string; email: string } | null;
  products: CartProduct[];
}) {
  const cart = useCart();
  const [payment, setPayment] = useState<"pix" | "card">("pix");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const lines = cart.flatMap((i) => {
    const product = products.find((p) => p.slug === i.slug);
    return product ? [{ product, qty: i.qty }] : [];
  });
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const shipping = lines.length ? 19.9 : 0;
  const discount = payment === "pix" ? subtotal * 0.05 : 0;
  const total = subtotal + shipping - discount;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const customer = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines.map((l) => ({ slug: l.product.slug, qty: l.qty })), payment, customer }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        clearCart();
      } else {
        setError(data.error ?? "Não foi possível finalizar o pedido.");
      }
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <section className="mx-auto max-w-xl px-6 py-32 text-center">
        <p className="eyebrow">Pedido {result.orderId}</p>
        <h1 className="mt-4 font-serif text-5xl">Obrigado!</h1>
        <p className="mt-6 text-muted">
          Recebemos seu pedido de {brl(result.total)}. (Modo de demonstração — o pagamento real
          será ativado na integração com a InfinitePay.)
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {result.loggedIn && <Link href="/conta" className="btn">Ver meus pedidos</Link>}
          <Link href="/produtos" className="btn btn-outline">Continuar comprando</Link>
        </div>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-6 py-32 text-center">
        <h1 className="font-serif text-4xl">Seu carrinho está vazio</h1>
        <Link href="/produtos" className="btn mt-10">Ver catálogo</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="font-serif text-5xl">Finalizar compra</h1>
      {!user && (
        <p className="mt-4 text-sm text-muted">
          Para acompanhar seus pedidos,{" "}
          <Link href="/conta/entrar" className="text-foreground underline">entre</Link> ou{" "}
          <Link href="/conta/cadastro" className="text-foreground underline">crie uma conta</Link>{" "}
          antes de pagar.
        </p>
      )}
      <div className="mt-12 grid gap-16 lg:grid-cols-[1fr_380px]">
        <form onSubmit={submit} className="space-y-12">
          <fieldset className="space-y-4">
            <legend className="eyebrow mb-4">Identificação</legend>
            <input name="nome" className="input" required placeholder="Nome completo" autoComplete="name" defaultValue={user?.name} />
            <input name="email" className="input" required type="email" placeholder="E-mail" autoComplete="email" defaultValue={user?.email} />
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="cpf" className="input" required placeholder="CPF" inputMode="numeric" />
              <input name="telefone" className="input" required placeholder="Telefone / WhatsApp" autoComplete="tel" />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="eyebrow mb-4">Entrega</legend>
            <input name="cep" className="input" required placeholder="CEP" inputMode="numeric" autoComplete="postal-code" />
            <input name="endereco" className="input" required placeholder="Endereço" autoComplete="address-line1" />
            <div className="grid gap-4 sm:grid-cols-3">
              <input name="numero" className="input" required placeholder="Número" />
              <input name="complemento" className="input" placeholder="Complemento" />
              <input name="bairro" className="input" required placeholder="Bairro" />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
              <input name="cidade" className="input" required placeholder="Cidade" />
              <input name="uf" className="input" required placeholder="UF" maxLength={2} />
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-4">Pagamento</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["pix", "Pix", "5% de desconto"],
                  ["card", "Cartão de crédito", "Até 3x sem juros"],
                ] as const
              ).map(([v, t, d]) => (
                <label
                  key={v}
                  className={`cursor-pointer border p-5 transition-colors ${
                    payment === v ? "border-accent" : "border-line"
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={payment === v}
                    onChange={() => setPayment(v)}
                  />
                  <p className="font-serif text-xl">{t}</p>
                  <p className="text-sm text-muted">{d}</p>
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

          <button disabled={loading} className="btn w-full disabled:opacity-50">
            {loading ? "Processando..." : `Pagar ${brl(total)}`}
          </button>
        </form>

        <aside className="h-fit bg-surface p-8">
          <h2 className="font-serif text-2xl">Resumo</h2>
          <ul className="mt-6 space-y-3 text-sm">
            {lines.map(({ product, qty }) => (
              <li key={product.slug} className="flex justify-between">
                <span>{product.name} × {qty}</span>
                <span>{brl(product.price * qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 border-t border-line pt-6 text-sm">
            <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{brl(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Frete</span><span>{brl(shipping)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between"><span className="text-muted">Desconto Pix</span><span>−{brl(discount)}</span></div>
            )}
            <div className="flex justify-between pt-2 font-serif text-xl"><span>Total</span><span>{brl(total)}</span></div>
          </div>
        </aside>
      </div>
    </section>
  );
}

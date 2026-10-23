"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearCart, useCart } from "@/lib/cart";
import type { CartProduct } from "@/lib/products";
import type { SavedAddress, SavedCard } from "@/lib/profile";
import type { PaymentMeta } from "@/lib/payments";
import { brl } from "@/lib/format";
import { PixPaymentPanel } from "./PixPaymentPanel";

type Result = {
  orderId: string;
  total: number;
  payment: "pix" | "card";
  status: string;
  paymentMeta: PaymentMeta;
};

type ShippingOption = {
  id: number;
  company: string;
  name: string;
  label: string;
  price: number;
  deliveryDays: number;
};

export function CheckoutForm({
  user,
  savedCustomer,
  savedAddresses,
  savedCards,
  products,
}: {
  user: { name: string; email: string };
  savedCustomer: Record<string, string> | null;
  savedAddresses: SavedAddress[];
  savedCards: SavedCard[];
  products: CartProduct[];
}) {
  const cart = useCart();
  const [payment, setPayment] = useState<"pix" | "card">("pix");
  const [installments, setInstallments] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const defaultAddr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">(
    defaultAddr ? defaultAddr.id : "new",
  );
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  const [cep, setCep] = useState(defaultAddr?.cep ?? savedCustomer?.cep ?? "");
  const [endereco, setEndereco] = useState(defaultAddr?.endereco ?? savedCustomer?.endereco ?? "");
  const [numero, setNumero] = useState(defaultAddr?.numero ?? savedCustomer?.numero ?? "");
  const [complemento, setComplemento] = useState(
    defaultAddr?.complemento ?? savedCustomer?.complemento ?? "",
  );
  const [bairro, setBairro] = useState(defaultAddr?.bairro ?? savedCustomer?.bairro ?? "");
  const [cidade, setCidade] = useState(defaultAddr?.cidade ?? savedCustomer?.cidade ?? "");
  const [uf, setUf] = useState(defaultAddr?.uf ?? savedCustomer?.uf ?? "");

  const defaultCard = savedCards.find((c) => c.isDefault) ?? savedCards[0] ?? null;
  const [selectedCardId, setSelectedCardId] = useState<number | "new">(
    defaultCard ? defaultCard.id : "new",
  );
  const [saveNewCard, setSaveNewCard] = useState(true);

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingId, setShippingId] = useState<number | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  function selectAddress(id: number | "new") {
    setSelectedAddressId(id);
    if (id === "new") {
      setCep("");
      setEndereco("");
      setNumero("");
      setComplemento("");
      setBairro("");
      setCidade("");
      setUf("");
      return;
    }
    const addr = savedAddresses.find((a) => a.id === id);
    if (addr) {
      setCep(addr.cep);
      setEndereco(addr.endereco);
      setNumero(addr.numero);
      setComplemento(addr.complemento);
      setBairro(addr.bairro);
      setCidade(addr.cidade);
      setUf(addr.uf);
    }
  }

  const lines = cart.flatMap((i) => {
    const product = products.find((p) => p.slug === i.slug);
    return product ? [{ product, qty: i.qty }] : [];
  });

  const cleanCepDigits = cep.replace(/\D/g, "").slice(0, 8);
  const cartKey = lines.map((l) => `${l.product.slug}:${l.qty}`).join(",");

  useEffect(() => {
    if (cleanCepDigits.length !== 8 || lines.length === 0) {
      setShippingOptions([]);
      setShippingId(null);
      setShippingError(null);
      return;
    }

    let cancelled = false;
    async function quote() {
      setShippingLoading(true);
      setShippingError(null);
      try {
        const res = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cep: cleanCepDigits,
            items: lines.map((l) => ({ slug: l.product.slug, qty: l.qty })),
          }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (selectedAddressId === "new" && data.address) {
          if (data.address.endereco) setEndereco(data.address.endereco);
          if (data.address.bairro) setBairro(data.address.bairro);
          if (data.address.cidade) setCidade(data.address.cidade);
          if (data.address.uf) setUf(data.address.uf);
        }

        if (res.ok && Array.isArray(data.options) && data.options.length > 0) {
          setShippingOptions(data.options);
          setShippingId((prev) =>
            data.options.some((o: ShippingOption) => o.id === prev) ? prev : data.options[0].id,
          );
        } else {
          setShippingOptions([]);
          setShippingId(null);
          setShippingError(data.error ?? "Não foi possível calcular o frete para este CEP.");
        }
      } catch {
        if (!cancelled) {
          setShippingOptions([]);
          setShippingId(null);
          setShippingError("Erro ao consultar o frete.");
        }
      } finally {
        if (!cancelled) setShippingLoading(false);
      }
    }

    quote();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanCepDigits, cartKey]);

  const selectedShipping = shippingOptions.find((o) => o.id === shippingId) ?? null;
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const shipping = selectedShipping ? selectedShipping.price : 0;
  const discount = payment === "pix" ? subtotal * 0.05 : 0;
  const total = subtotal + shipping - discount;
  const cardTotal = subtotal + shipping;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedShipping) {
      setError("Informe um CEP válido e escolha uma opção de frete.");
      return;
    }
    setError(null);
    setLoading(true);
    const customer = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ slug: l.product.slug, qty: l.qty })),
          payment,
          installments,
          shippingId: selectedShipping.id,
          saveAddress: selectedAddressId === "new" && saveNewAddress,
          selectedCardId: payment === "card" && selectedCardId !== "new" ? selectedCardId : null,
          saveCard: payment === "card" && selectedCardId === "new" && saveNewCard,
          customer,
        }),
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
      <section className="mx-auto max-w-2xl px-6 py-20">
        <div className="mb-8 text-center">
          <p className="eyebrow">Pedido {result.orderId}</p>
          <h1 className="mt-3 font-serif text-5xl">
            {result.payment === "pix" ? "Finalize o pagamento via Pix" : "Pedido confirmado!"}
          </h1>
        </div>

        {result.payment === "pix" && result.paymentMeta ? (
          <PixPaymentPanel
            orderCode={result.orderId}
            total={result.total}
            initialStatus={result.status}
            paymentMeta={result.paymentMeta}
          />
        ) : (
          <div className="border border-line bg-surface p-8 text-center">
            <p className="eyebrow">
              {result.status === "paid" ? "Pagamento aprovado" : "Aguardando conclusão"}
            </p>
            <p className="mt-2 font-serif text-3xl">
              {brl(result.total)}{" "}
              {result.paymentMeta?.installments && result.paymentMeta.installments > 1
                ? `em ${result.paymentMeta.installments}x sem juros`
                : ""}
            </p>
            {result.paymentMeta?.cardSummary && (
              <p className="mt-2 text-sm text-muted">Cartão: {result.paymentMeta.cardSummary}</p>
            )}
            <p className="mt-4 text-sm text-muted">
              Sua peça já entrou na fila de preparação. Acompanhe cada etapa e o rastreio de entrega
              em Meus Pedidos.
            </p>
            {result.paymentMeta?.checkoutUrl && (
              <div className="mt-6">
                <a
                  href={result.paymentMeta.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  Concluir pagamento na InfinitePay ↗
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/conta" className="btn">Acompanhar pedido em Minha Conta</Link>
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
      <p className="eyebrow">Conectado como {user.email}</p>
      <h1 className="mt-2 font-serif text-5xl">Finalizar compra</h1>
      <div className="mt-12 grid gap-16 lg:grid-cols-[1fr_380px]">
        <form onSubmit={submit} className="space-y-12">
          <fieldset className="space-y-4">
            <legend className="eyebrow mb-4">Identificação</legend>
            <input
              name="nome"
              className="input"
              required
              placeholder="Nome completo"
              autoComplete="name"
              defaultValue={savedCustomer?.nome || user.name}
            />
            <input
              name="email"
              className="input"
              required
              type="email"
              placeholder="E-mail"
              autoComplete="email"
              defaultValue={savedCustomer?.email || user.email}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="cpf"
                className="input"
                required
                placeholder="CPF"
                inputMode="numeric"
                defaultValue={savedCustomer?.cpf}
              />
              <input
                name="telefone"
                className="input"
                required
                placeholder="Telefone / WhatsApp"
                autoComplete="tel"
                defaultValue={savedCustomer?.telefone}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <div className="flex items-center justify-between">
              <legend className="eyebrow">Entrega</legend>
              <Link href="/conta" className="text-xs text-muted underline hover:text-foreground">
                Gerenciar endereços no perfil
              </Link>
            </div>

            {savedAddresses.length > 0 && (
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    onClick={() => selectAddress(addr.id)}
                    className={`cursor-pointer border p-4 text-sm transition-colors ${
                      selectedAddressId === addr.id ? "border-accent bg-surface/60" : "border-line"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-lg">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="eyebrow text-[0.6rem]">Principal</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {addr.endereco}, {addr.numero} · {addr.cidade}/{addr.uf}
                    </p>
                    <p className="text-xs text-muted">CEP {addr.cep}</p>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => selectAddress("new")}
                  className={`border p-4 text-left text-sm transition-colors ${
                    selectedAddressId === "new" ? "border-accent bg-surface/60" : "border-line"
                  }`}
                >
                  <p className="font-serif text-lg">+ Outro endereço</p>
                  <p className="mt-1 text-xs text-muted">Cadastrar um novo local de entrega</p>
                </button>
              </div>
            )}

            {selectedAddressId === "new" && (
              <input
                name="addressLabel"
                className="input"
                placeholder="Apelido deste endereço (ex: Casa, Trabalho)"
              />
            )}

            <div>
              <input
                name="cep"
                className="input"
                required
                placeholder="CEP (somente números, ex: 01310100)"
                inputMode="numeric"
                autoComplete="postal-code"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                maxLength={9}
              />
              {shippingLoading && (
                <p className="mt-2 text-xs text-muted">Buscando endereço e calculando frete no Melhor Envio...</p>
              )}
              {shippingError && (
                <p className="mt-2 text-xs text-red-700">{shippingError}</p>
              )}
            </div>

            {shippingOptions.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="eyebrow">Escolha a forma de envio (Melhor Envio)</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {shippingOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-center justify-between border p-4 transition-colors ${
                        shippingId === opt.id ? "border-accent bg-surface/60" : "border-line"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shippingOption"
                        className="sr-only"
                        checked={shippingId === opt.id}
                        onChange={() => setShippingId(opt.id)}
                      />
                      <div>
                        <p className="font-serif text-lg">{opt.label}</p>
                        <p className="text-xs text-muted">
                          Entrega em até {opt.deliveryDays} {opt.deliveryDays === 1 ? "dia útil" : "dias úteis"}
                        </p>
                      </div>
                      <span className="text-sm font-medium">{brl(opt.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <input
              name="endereco"
              className="input"
              required
              placeholder="Endereço (rua, avenida...)"
              autoComplete="address-line1"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <input
                name="numero"
                className="input"
                required
                placeholder="Número"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
              <input
                name="complemento"
                className="input"
                placeholder="Complemento"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
              />
              <input
                name="bairro"
                className="input"
                required
                placeholder="Bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
              <input
                name="cidade"
                className="input"
                required
                placeholder="Cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
              <input
                name="uf"
                className="input"
                required
                placeholder="UF"
                maxLength={2}
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
              />
            </div>

            {selectedAddressId === "new" && (
              <label className="flex items-center gap-2 pt-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={saveNewAddress}
                  onChange={(e) => setSaveNewAddress(e.target.checked)}
                />
                Salvar este endereço no meu perfil para próximas compras
              </label>
            )}
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="eyebrow mb-4">Pagamento</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["pix", "Pix", "5% de desconto · Aprovação imediata"],
                  ["card", "Cartão de crédito", "Até 3x sem juros"],
                ] as const
              ).map(([v, t, d]) => (
                <label
                  key={v}
                  className={`cursor-pointer border p-5 transition-colors ${
                    payment === v ? "border-accent bg-surface/60" : "border-line"
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

            {payment === "card" && (
              <div className="space-y-4 border border-line p-5">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Escolha o cartão</p>
                  <Link href="/conta" className="text-xs text-muted underline hover:text-foreground">
                    Gerenciar cartões no perfil
                  </Link>
                </div>

                {savedCards.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {savedCards.map((c) => (
                      <label
                        key={c.id}
                        onClick={() => setSelectedCardId(c.id)}
                        className={`cursor-pointer border p-4 text-sm transition-colors ${
                          selectedCardId === c.id ? "border-accent bg-surface/60" : "border-line"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-lg">{c.label}</span>
                          {c.isDefault && <span className="eyebrow text-[0.6rem]">Principal</span>}
                        </div>
                        <p className="mt-1 font-mono text-xs">
                          {c.brand} •••• {c.last4}
                        </p>
                        <p className="text-xs text-muted">Validade {c.expiry}</p>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedCardId("new")}
                      className={`border p-4 text-left text-sm transition-colors ${
                        selectedCardId === "new" ? "border-accent bg-surface/60" : "border-line"
                      }`}
                    >
                      <p className="font-serif text-lg">+ Outro cartão</p>
                      <p className="mt-1 text-xs text-muted">Usar ou salvar um novo cartão</p>
                    </button>
                  </div>
                )}

                {selectedCardId === "new" ? (
                  <div className="space-y-4 pt-2">
                    <input
                      name="cardLabel"
                      className="input"
                      placeholder="Apelido do cartão (ex: Nubank, Inter)"
                    />
                    <input
                      name="cardHolder"
                      className="input"
                      required
                      placeholder="Nome impresso no cartão"
                      defaultValue={user.name}
                    />
                    <input
                      name="cardNumber"
                      className="input"
                      required
                      placeholder="Número do cartão"
                      inputMode="numeric"
                      maxLength={19}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        name="cardExpiry"
                        className="input"
                        required
                        placeholder="Validade (MM/AA)"
                        maxLength={5}
                      />
                      <input
                        name="cardCvv"
                        className="input"
                        required
                        placeholder="CVV"
                        inputMode="numeric"
                        maxLength={4}
                      />
                    </div>
                    <label className="flex items-center gap-2 pt-1 text-xs text-muted">
                      <input
                        type="checkbox"
                        checked={saveNewCard}
                        onChange={(e) => setSaveNewCard(e.target.checked)}
                      />
                      Salvar este cartão no meu perfil para próximas compras
                    </label>
                  </div>
                ) : (
                  <div className="max-w-xs pt-2">
                    <input
                      name="cardCvv"
                      className="input"
                      required
                      placeholder="Confirme o CVV do cartão selecionado"
                      inputMode="numeric"
                      maxLength={4}
                    />
                  </div>
                )}

                <div className="pt-3">
                  <label className="eyebrow block">Parcelamento sem juros</label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="mt-2 w-full border border-line bg-white px-3 py-3 text-sm"
                  >
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n}x de {brl(cardTotal / n)} sem juros
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </fieldset>

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

          <button disabled={loading || !selectedShipping} className="btn w-full disabled:opacity-50">
            {loading
              ? "Processando pagamento..."
              : selectedShipping
                ? payment === "pix"
                  ? `Gerar QR Code Pix · ${brl(total)}`
                  : `Pagar com cartão · ${installments}x de ${brl(total / installments)}`
                : "Informe o CEP para calcular o frete"}
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
            <div className="flex justify-between">
              <span className="text-muted">
                Frete {selectedShipping ? `(${selectedShipping.label})` : ""}
              </span>
              <span>{selectedShipping ? brl(shipping) : "A calcular"}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between"><span className="text-muted">Desconto Pix (5%)</span><span>−{brl(discount)}</span></div>
            )}
            <div className="flex justify-between pt-2 font-serif text-xl"><span>Total</span><span>{brl(total)}</span></div>
          </div>
        </aside>
      </div>
    </section>
  );
}

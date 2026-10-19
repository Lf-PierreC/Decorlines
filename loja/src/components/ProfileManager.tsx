"use client";

import { useActionState, useEffect, useState } from "react";
import type { SavedAddress, SavedCard } from "@/lib/profile";
import {
  makeDefaultAddressAction,
  makeDefaultCardAction,
  removeAddressAction,
  removeCardAction,
  saveAddressAction,
  saveCardAction,
  type FormState,
} from "@/app/conta/actions";

const initial: FormState = {};

export function ProfileManager({
  userName,
  addresses,
  cards,
}: {
  userName: string;
  addresses: SavedAddress[];
  cards: SavedCard[];
}) {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);

  const [addrState, addrAction, addrPending] = useActionState(saveAddressAction, initial);
  const [cardState, cardAction, cardPending] = useActionState(saveCardAction, initial);

  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  useEffect(() => {
    if (addrState.ok) {
      setShowAddressForm(false);
      setCep("");
      setEndereco("");
      setBairro("");
      setCidade("");
      setUf("");
    }
  }, [addrState]);

  useEffect(() => {
    if (cardState.ok) {
      setShowCardForm(false);
    }
  }, [cardState]);

  useEffect(() => {
    const digits = cep.replace(/\D/g, "").slice(0, 8);
    if (digits.length !== 8) return;
    let cancelled = false;
    fetch(`/api/cep?cep=${digits}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.address) return;
        if (d.address.endereco) setEndereco(d.address.endereco);
        if (d.address.bairro) setBairro(d.address.bairro);
        if (d.address.cidade) setCidade(d.address.cidade);
        if (d.address.uf) setUf(d.address.uf);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cep]);

  return (
    <div className="mt-16 grid gap-12 md:grid-cols-2">
      {/* MEUS ENDEREÇOS */}
      <div>
        <div className="flex items-end justify-between border-b border-line pb-3">
          <div>
            <p className="eyebrow">Entrega</p>
            <h2 className="mt-1 font-serif text-3xl">Meus endereços</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowAddressForm((v) => !v)}
            className="text-xs uppercase tracking-[0.18em] underline hover:text-muted"
          >
            {showAddressForm ? "Cancelar" : "+ Novo endereço"}
          </button>
        </div>

        {showAddressForm && (
          <form action={addrAction} className="mt-6 space-y-4 border border-line bg-surface/50 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="label"
                className="input"
                placeholder="Identificação (ex: Casa, Trabalho)"
                required
              />
              <input
                name="recipient"
                className="input"
                placeholder="Nome de quem vai receber"
                defaultValue={userName}
                required
              />
            </div>
            <input
              name="cep"
              className="input"
              placeholder="CEP (8 números)"
              inputMode="numeric"
              maxLength={9}
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              required
            />
            <input
              name="endereco"
              className="input"
              placeholder="Rua / Avenida"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              required
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <input name="numero" className="input" placeholder="Número" required />
              <input name="complemento" className="input" placeholder="Complemento" />
              <input
                name="bairro"
                className="input"
                placeholder="Bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_80px]">
              <input
                name="cidade"
                className="input"
                placeholder="Cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                required
              />
              <input
                name="uf"
                className="input"
                placeholder="UF"
                maxLength={2}
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                required
              />
            </div>
            <label className="flex items-center gap-2 pt-2 text-xs text-muted">
              <input type="checkbox" name="isDefault" defaultChecked={addresses.length === 0} />
              Definir como endereço principal
            </label>
            {addrState.error && <p className="text-xs text-red-700">{addrState.error}</p>}
            <button disabled={addrPending} className="btn w-full">
              {addrPending ? "Salvando..." : "Salvar endereço"}
            </button>
          </form>
        )}

        <ul className="mt-6 space-y-4">
          {addresses.length === 0 && !showAddressForm && (
            <li className="border border-line p-6 text-sm text-muted">
              Nenhum endereço salvo. Cadastre seus endereços (Casa, Trabalho, etc.) para agilizar o checkout.
            </li>
          )}
          {addresses.map((a) => (
            <li key={a.id} className="border border-line p-5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-serif text-xl">{a.label}</p>
                  {a.isDefault && (
                    <span className="eyebrow border border-line bg-surface px-2 py-0.5">
                      Principal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {!a.isDefault && (
                    <form action={makeDefaultAddressAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="text-muted underline hover:text-foreground">
                        Tornar principal
                      </button>
                    </form>
                  )}
                  <form action={removeAddressAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-red-700 underline">Remover</button>
                  </form>
                </div>
              </div>
              <p className="mt-2 text-muted">{a.recipient}</p>
              <p className="mt-1">
                {a.endereco}, {a.numero}
                {a.complemento ? ` — ${a.complemento}` : ""}
              </p>
              <p className="text-muted">
                {a.bairro} · {a.cidade}/{a.uf} · CEP {a.cep}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* MEUS CARTÕES */}
      <div>
        <div className="flex items-end justify-between border-b border-line pb-3">
          <div>
            <p className="eyebrow">Pagamento</p>
            <h2 className="mt-1 font-serif text-3xl">Meus cartões</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowCardForm((v) => !v)}
            className="text-xs uppercase tracking-[0.18em] underline hover:text-muted"
          >
            {showCardForm ? "Cancelar" : "+ Novo cartão"}
          </button>
        </div>

        {showCardForm && (
          <form action={cardAction} className="mt-6 space-y-4 border border-line bg-surface/50 p-5">
            <input
              name="label"
              className="input"
              placeholder="Apelido do cartão (ex: Nubank, Principal)"
            />
            <input
              name="holderName"
              className="input"
              placeholder="Nome impresso no cartão"
              defaultValue={userName}
              required
            />
            <input
              name="cardNumber"
              className="input"
              placeholder="Número do cartão (somente números)"
              inputMode="numeric"
              maxLength={19}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="expiry"
                className="input"
                placeholder="Validade (MM/AA, ex: 08/29)"
                maxLength={5}
                required
              />
              <input
                name="cvv"
                className="input"
                placeholder="CVV (3 ou 4 dígitos)"
                inputMode="numeric"
                maxLength={4}
                required
              />
            </div>
            <label className="flex items-center gap-2 pt-2 text-xs text-muted">
              <input type="checkbox" name="isDefault" defaultChecked={cards.length === 0} />
              Definir como cartão principal
            </label>
            <p className="text-[0.7rem] text-muted">
              Por segurança, guardamos apenas os 4 últimos dígitos e o token criptografado. O CVV nunca é armazenado.
            </p>
            {cardState.error && <p className="text-xs text-red-700">{cardState.error}</p>}
            <button disabled={cardPending} className="btn w-full">
              {cardPending ? "Salvando..." : "Salvar cartão"}
            </button>
          </form>
        )}

        <ul className="mt-6 space-y-4">
          {cards.length === 0 && !showCardForm && (
            <li className="border border-line p-6 text-sm text-muted">
              Nenhum cartão salvo. Cadastre seus cartões para finalizar compras com 1 clique.
            </li>
          )}
          {cards.map((c) => (
            <li key={c.id} className="border border-line p-5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-serif text-xl">{c.label}</p>
                  {c.isDefault && (
                    <span className="eyebrow border border-line bg-surface px-2 py-0.5">
                      Principal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {!c.isDefault && (
                    <form action={makeDefaultCardAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-muted underline hover:text-foreground">
                        Tornar principal
                      </button>
                    </form>
                  )}
                  <form action={removeCardAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="text-red-700 underline">Remover</button>
                  </form>
                </div>
              </div>
              <p className="mt-2 font-mono text-sm">
                {c.brand} •••• {c.last4}
              </p>
              <p className="mt-1 text-xs text-muted">
                {c.holderName} · Validade {c.expiry}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

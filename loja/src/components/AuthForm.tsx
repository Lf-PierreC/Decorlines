"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type FormState } from "@/app/conta/actions";

const initial: FormState = {};

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action, pending] = useActionState(mode === "login" ? login : register, initial);
  const isLogin = mode === "login";
  const fromCheckout = next === "/checkout";
  const switchHref = isLogin
    ? `/conta/cadastro${fromCheckout ? "?next=/checkout" : ""}`
    : `/conta/entrar${fromCheckout ? "?next=/checkout" : ""}`;

  return (
    <section className="mx-auto max-w-md px-6 py-24">
      <p className="eyebrow">{isLogin ? "Bem-vindo de volta" : "Crie sua conta"}</p>
      <h1 className="mt-3 font-serif text-5xl">{isLogin ? "Entrar" : "Cadastro"}</h1>

      {fromCheckout && (
        <div className="mt-6 border border-line bg-surface p-4 text-sm text-muted">
          Identifique-se ou crie sua conta rápida para finalizar seu pedido e acompanhar a entrega.
          Seus itens continuam salvos no carrinho.
        </div>
      )}

      <form action={action} className="mt-10 space-y-5">
        {fromCheckout && <input type="hidden" name="next" value="/checkout" />}
        {!isLogin && (
          <input name="name" className="input" required placeholder="Nome completo" autoComplete="name" />
        )}
        <input name="email" type="email" className="input" required placeholder="E-mail" autoComplete="email" />
        <input
          name="password"
          type="password"
          className="input"
          required
          minLength={isLogin ? undefined : 8}
          placeholder={isLogin ? "Senha" : "Senha (mínimo 8 caracteres)"}
          autoComplete={isLogin ? "current-password" : "new-password"}
        />
        {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
        <button disabled={pending} className="btn w-full disabled:opacity-50">
          {pending
            ? "Aguarde..."
            : isLogin
              ? fromCheckout
                ? "Entrar e ir para o checkout"
                : "Entrar"
              : fromCheckout
                ? "Criar conta e ir para o checkout"
                : "Criar conta"}
        </button>
      </form>

      <p className="mt-8 text-sm text-muted">
        {isLogin ? "Ainda não tem conta? " : "Já tem conta? "}
        <Link href={switchHref} className="text-foreground underline">
          {isLogin ? "Cadastre-se" : "Entrar"}
        </Link>
      </p>
    </section>
  );
}

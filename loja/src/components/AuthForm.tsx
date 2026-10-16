"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type FormState } from "@/app/conta/actions";

const initial: FormState = {};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action, pending] = useActionState(mode === "login" ? login : register, initial);
  const isLogin = mode === "login";

  return (
    <section className="mx-auto max-w-md px-6 py-24">
      <p className="eyebrow">{isLogin ? "Bem-vindo de volta" : "Crie sua conta"}</p>
      <h1 className="mt-3 font-serif text-5xl">{isLogin ? "Entrar" : "Cadastro"}</h1>

      <form action={action} className="mt-12 space-y-5">
        {!isLogin && (
          <input name="name" className="input" required placeholder="Nome completo" autoComplete="name" />
        )}
        <input name="email" type="email" className="input" required placeholder="E-mail" autoComplete="email" />
        {!isLogin && (
          <input name="celular" className="input" required placeholder="Celular" autoComplete="celular" />
        )}
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
          {pending ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <p className="mt-8 text-sm text-muted">
        {isLogin ? "Ainda não tem conta? " : "Já tem conta? "}
        <Link href={isLogin ? "/conta/cadastro" : "/conta/entrar"} className="text-foreground underline">
          {isLogin ? "Cadastre-se" : "Entrar"}
        </Link>
      </p>
    </section>
  );
}

"use server";

import { redirect } from "next/navigation";
import { db, ensureAdmin } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

export type FormState = { error?: string };

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (name.length < 2) return { error: "Informe seu nome." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "E-mail inválido." };
  if (password.length < 8) return { error: "A senha deve ter pelo menos 8 caracteres." };

  const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email);
  if (exists) return { error: "Este e-mail já está cadastrado." };

  const res = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name, email, hashPassword(password));
  ensureAdmin(db); // o primeiro usuário cadastrado vira administrador
  await createSession(Number(res.lastInsertRowid));
  redirect("/conta");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  const user = db
    .prepare("SELECT id, password_hash FROM users WHERE email = ?")
    .get(email) as { id: number; password_hash: string } | undefined;

  // Mesma mensagem para e-mail inexistente ou senha errada (não revela quem tem conta).
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "E-mail ou senha incorretos." };
  }
  await createSession(user.id);
  redirect("/conta");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

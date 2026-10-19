"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, ensureAdmin } from "@/lib/db";
import { createSession, destroySession, getUser, hashPassword, verifyPassword } from "@/lib/auth";
import {
  addAddress,
  addCard,
  deleteAddress,
  deleteCard,
  setDefaultAddress,
  setDefaultCard,
} from "@/lib/profile";

export type FormState = { error?: string; ok?: boolean };

function safeNext(value: FormDataEntryValue | null): string {
  const next = String(value ?? "").trim();
  if (next === "/checkout" || next === "/conta") return next;
  return "/conta";
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const dest = safeNext(form.get("next"));

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
  redirect(dest);
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const dest = safeNext(form.get("next"));

  const user = db
    .prepare("SELECT id, password_hash FROM users WHERE email = ?")
    .get(email) as { id: number; password_hash: string } | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "E-mail ou senha incorretos." };
  }
  await createSession(user.id);
  redirect(dest);
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function saveAddressAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Faça login novamente." };

  const label = String(form.get("label") ?? "").trim() || "Casa";
  const recipient = String(form.get("recipient") ?? "").trim() || user.name;
  const cep = String(form.get("cep") ?? "").replace(/\D/g, "").slice(0, 8);
  const endereco = String(form.get("endereco") ?? "").trim();
  const numero = String(form.get("numero") ?? "").trim();
  const complemento = String(form.get("complemento") ?? "").trim();
  const bairro = String(form.get("bairro") ?? "").trim();
  const cidade = String(form.get("cidade") ?? "").trim();
  const uf = String(form.get("uf") ?? "").trim().toUpperCase();
  const isDefault = form.get("isDefault") === "on";

  if (cep.length !== 8) return { error: "Informe um CEP válido com 8 dígitos." };
  if (!endereco || !numero || !bairro || !cidade || uf.length !== 2) {
    return { error: "Preencha todos os campos obrigatórios do endereço." };
  }

  addAddress(user.id, {
    label,
    recipient,
    cep,
    endereco,
    numero,
    complemento,
    bairro,
    cidade,
    uf,
    isDefault,
  });

  revalidatePath("/conta");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function removeAddressAction(form: FormData) {
  const user = await getUser();
  if (!user) return;
  deleteAddress(user.id, Number(form.get("id")));
  revalidatePath("/conta");
  revalidatePath("/checkout");
}

export async function makeDefaultAddressAction(form: FormData) {
  const user = await getUser();
  if (!user) return;
  setDefaultAddress(user.id, Number(form.get("id")));
  revalidatePath("/conta");
  revalidatePath("/checkout");
}

export async function saveCardAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Faça login novamente." };

  const label = String(form.get("label") ?? "").trim();
  const holderName = String(form.get("holderName") ?? "").trim();
  const cardNumberDigits = String(form.get("cardNumber") ?? "").replace(/\D/g, "");
  const expiry = String(form.get("expiry") ?? "").trim();
  const cvv = String(form.get("cvv") ?? "").replace(/\D/g, "");
  const isDefault = form.get("isDefault") === "on";

  if (holderName.length < 3) return { error: "Informe o nome impresso no cartão." };
  if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
    return { error: "Número do cartão inválido." };
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
    return { error: "Validade inválida. Use o formato MM/AA (ex: 08/29)." };
  }
  if (cvv.length < 3 || cvv.length > 4) {
    return { error: "CVV inválido." };
  }

  addCard(user.id, {
    label,
    holderName,
    cardNumberDigits,
    expiry,
    isDefault,
  });

  revalidatePath("/conta");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function removeCardAction(form: FormData) {
  const user = await getUser();
  if (!user) return;
  deleteCard(user.id, Number(form.get("id")));
  revalidatePath("/conta");
  revalidatePath("/checkout");
}

export async function makeDefaultCardAction(form: FormData) {
  const user = await getUser();
  if (!user) return;
  setDefaultCard(user.id, Number(form.get("id")));
  revalidatePath("/conta");
  revalidatePath("/checkout");
}

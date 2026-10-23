"use server";

import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { DATA_DIR } from "@/lib/db";
import { uploadToSupabaseStorage } from "@/lib/supabase";
import {
  createProduct,
  deleteProduct,
  getProductById,
  updateProduct,
  type ProductInput,
} from "@/lib/products";
import { setOrderStatus as setStatus } from "@/lib/orders";

export type FormState = { error?: string };

const MAX_BYTES = 5 * 1024 * 1024;

/** Confere o tipo real do arquivo pelos primeiros bytes (não confia no nome/extensão). */
function detectImage(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "png";
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP")
    return "webp";
  return null;
}

async function saveImage(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error("A foto deve ter no máximo 5 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectImage(buf);
  if (!ext) throw new Error("Formato de foto inválido. Use JPG, PNG ou WebP.");
  const name = `${randomBytes(16).toString("hex")}.${ext}`;

  // 1. Tenta subir diretamente para o Bucket 'produtos' no Supabase Storage
  const cloudUrl = await uploadToSupabaseStorage(name, buf, ext);
  if (cloudUrl) return cloudUrl;

  // 2. Fallback local caso esteja offline ou sem permissão no bucket ainda
  const dir = path.join(DATA_DIR, "uploads");
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}

function num(v: FormDataEntryValue | null) {
  return Number(String(v ?? "").replace(",", "."));
}

export async function saveProduct(id: number | null, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();

  const name = String(form.get("name") ?? "").trim();
  const category = String(form.get("category") ?? "").trim();
  const price = num(form.get("price"));
  const stock = num(form.get("stock"));
  const weightKg = num(form.get("weight"));
  const tone = String(form.get("tone") ?? "#e9dfd5");

  if (name.length < 2) return { error: "Informe o nome do produto." };
  if (!category) return { error: "Informe a categoria." };
  if (!Number.isFinite(price) || price <= 0) return { error: "Preço inválido." };
  if (!Number.isInteger(stock) || stock < 0) return { error: "Estoque deve ser um número inteiro (0 ou mais)." };
  if (!Number.isFinite(weightKg) || weightKg <= 0) return { error: "Informe o peso em kg (ex.: 0,3)." };
  if (!/^#[0-9a-fA-F]{6}$/.test(tone)) return { error: "Cor inválida." };

  const existing = id ? getProductById(id) : undefined;
  if (id && !existing) return { error: "Produto não encontrado." };

  let image = existing?.image ?? null;
  const file = form.get("image");
  try {
    if (file instanceof File && file.size > 0) image = await saveImage(file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar a foto." };
  }
  if (form.get("removeImage") === "on" && !(file instanceof File && file.size > 0)) image = null;

  const data: ProductInput = {
    name,
    category,
    price,
    stock,
    weightKg,
    tone,
    image,
    description: String(form.get("description") ?? "").trim(),
    details: String(form.get("details") ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    active: form.get("active") === "on",
  };

  if (id) updateProduct(id, data);
  else createProduct(data);

  revalidatePath("/", "layout");
  redirect("/admin/produtos");
}

export async function removeProduct(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (Number.isInteger(id)) deleteProduct(id);
  revalidatePath("/", "layout");
}

export async function updateOrderStatus(form: FormData) {
  await requireAdmin();
  setStatus(
    String(form.get("code") ?? ""),
    String(form.get("status") ?? ""),
    String(form.get("trackingCode") ?? ""),
  );
  revalidatePath("/admin/pedidos");
  revalidatePath("/conta");
}

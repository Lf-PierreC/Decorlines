import "server-only";
import { db } from "./db";

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  tone: string;
  image: string | null;
  description: string;
  details: string[];
  weightKg: number;
  stock: number;
  active: boolean;
};

/** Dados mínimos que o carrinho/checkout (navegador) precisam conhecer. */
export type CartProduct = Pick<Product, "slug" | "name" | "price" | "tone" | "image" | "stock">;

export type ProductInput = Omit<Product, "id" | "slug">;

type Row = {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  tone: string;
  image: string | null;
  description: string;
  details: string;
  weight_kg: number;
  stock: number;
  active: number;
};

function fromRow(r: Row): Product {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    price: r.price,
    tone: r.tone,
    image: r.image,
    description: r.description,
    details: JSON.parse(r.details) as string[],
    weightKg: r.weight_kg,
    stock: r.stock,
    active: r.active === 1,
  };
}

/** Vitrine: apenas produtos ativos. Admin: todos. */
export function getProducts(opts: { includeInactive?: boolean } = {}): Product[] {
  const where = opts.includeInactive ? "" : "WHERE active = 1";
  const rows = db.prepare(`SELECT * FROM products ${where} ORDER BY id DESC`).all() as unknown as Row[];
  return rows.map(fromRow);
}

export function getProduct(slug: string): Product | undefined {
  const r = db.prepare("SELECT * FROM products WHERE slug = ? AND active = 1").get(slug) as unknown as Row | undefined;
  return r ? fromRow(r) : undefined;
}

export function getProductById(id: number): Product | undefined {
  const r = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as unknown as Row | undefined;
  return r ? fromRow(r) : undefined;
}

export function getCategories(): string[] {
  const rows = db
    .prepare("SELECT DISTINCT category FROM products WHERE active = 1 ORDER BY category")
    .all() as { category: string }[];
  return rows.map((r) => r.category);
}

export function toCartProduct(p: Product): CartProduct {
  return { slug: p.slug, name: p.name, price: p.price, tone: p.tone, image: p.image, stock: p.stock };
}

function slugify(text: string) {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "produto"
  );
}

function uniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (db.prepare("SELECT 1 FROM products WHERE slug = ?").get(slug)) slug = `${base}-${n++}`;
  return slug;
}

export function createProduct(p: ProductInput) {
  db.prepare(
    `INSERT INTO products (slug, name, category, price, tone, image, description, details, weight_kg, stock, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    uniqueSlug(p.name),
    p.name,
    p.category,
    p.price,
    p.tone,
    p.image,
    p.description,
    JSON.stringify(p.details),
    p.weightKg,
    p.stock,
    p.active ? 1 : 0,
  );
}

export function updateProduct(id: number, p: ProductInput) {
  db.prepare(
    `UPDATE products SET name = ?, category = ?, price = ?, tone = ?, image = ?, description = ?,
       details = ?, weight_kg = ?, stock = ?, active = ? WHERE id = ?`,
  ).run(
    p.name,
    p.category,
    p.price,
    p.tone,
    p.image,
    p.description,
    JSON.stringify(p.details),
    p.weightKg,
    p.stock,
    p.active ? 1 : 0,
    id,
  );
}

export function deleteProduct(id: number) {
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
}

import "server-only";
import { db } from "./db";

export type OrderItem = { slug: string; name: string; qty: number; price: number };
export type Customer = Record<string, string>;
export type Order = {
  code: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  payment: string;
  status: string;
  created_at: string;
  customer: Customer | null;
  account_name?: string | null;
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
};

const SHIPPING = 19.9; // TODO: Kangu

type RawOrder = Omit<Order, "items" | "customer"> & { items: string; customer: string | null };

function parse(r: RawOrder): Order {
  return {
    ...r,
    items: JSON.parse(r.items) as OrderItem[],
    customer: r.customer ? (JSON.parse(r.customer) as Customer) : null,
  };
}

/**
 * Cria o pedido recalculando tudo no servidor (preço e estoque vêm do banco)
 * e baixa o estoque na mesma transação.
 */
export function createOrder(input: {
  userId: number | null;
  items: { slug: string; qty: number }[];
  payment: "pix" | "card";
  customer: Customer | null;
}): { ok: true; code: string; total: number } | { ok: false; error: string } {
  if (input.items.length === 0) return { ok: false, error: "Carrinho vazio" };

  db.exec("BEGIN IMMEDIATE");
  try {
    const lines: OrderItem[] = [];
    let subtotal = 0;
    for (const i of input.items) {
      if (!Number.isInteger(i.qty) || i.qty < 1 || i.qty > 99) throw new Error("Item inválido");
      const p = db
        .prepare("SELECT slug, name, price, stock FROM products WHERE slug = ? AND active = 1")
        .get(i.slug) as unknown as { slug: string; name: string; price: number; stock: number } | undefined;
      if (!p) throw new Error("Um dos produtos não está mais disponível.");
      if (p.stock < i.qty) throw new Error(`Estoque insuficiente para "${p.name}" (restam ${p.stock}).`);
      db.prepare("UPDATE products SET stock = stock - ? WHERE slug = ?").run(i.qty, p.slug);
      lines.push({ slug: p.slug, name: p.name, qty: i.qty, price: p.price });
      subtotal += p.price * i.qty;
    }

    const discount = input.payment === "pix" ? subtotal * 0.05 : 0;
    const total = subtotal + SHIPPING - discount;
    const code = `DL-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

    db.prepare(
      `INSERT INTO orders (code, user_id, items, subtotal, shipping, discount, total, payment, customer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      code,
      input.userId,
      JSON.stringify(lines),
      subtotal,
      SHIPPING,
      discount,
      total,
      input.payment,
      input.customer ? JSON.stringify(input.customer) : null,
    );
    db.exec("COMMIT");
    return { ok: true, code, total };
  } catch (e) {
    db.exec("ROLLBACK");
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao criar pedido" };
  }
}

export function listOrders(userId: number): Order[] {
  const rows = db
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC")
    .all(userId) as unknown as RawOrder[];
  return rows.map(parse);
}

export function listAllOrders(): Order[] {
  const rows = db
    .prepare(
      `SELECT o.*, u.name AS account_name FROM orders o
       LEFT JOIN users u ON u.id = o.user_id ORDER BY o.id DESC`,
    )
    .all() as unknown as RawOrder[];
  return rows.map(parse);
}

/** Troca o status; ao cancelar, devolve os itens ao estoque. */
export function setOrderStatus(code: string, status: string) {
  if (!(status in STATUS_LABEL)) return;
  db.exec("BEGIN IMMEDIATE");
  try {
    const row = db.prepare("SELECT status, items FROM orders WHERE code = ?").get(code) as unknown as
      | { status: string; items: string }
      | undefined;
    if (!row || row.status === status) {
      db.exec("COMMIT");
      return;
    }
    if (status === "canceled" && row.status !== "canceled") {
      for (const i of JSON.parse(row.items) as OrderItem[]) {
        db.prepare("UPDATE products SET stock = stock + ? WHERE slug = ?").run(i.qty, i.slug);
      }
    }
    db.prepare("UPDATE orders SET status = ? WHERE code = ?").run(status, code);
    db.exec("COMMIT");
  } catch {
    db.exec("ROLLBACK");
  }
}

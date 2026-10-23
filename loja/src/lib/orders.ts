import "server-only";
import { db } from "./db";
import type { PaymentMeta } from "./payments";

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
  tracking_code: string | null;
  payment_meta: PaymentMeta | null;
  created_at: string;
  customer: Customer | null;
  account_name?: string | null;
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago · Em preparação",
  shipped: "Em rota de entrega",
  delivered: "Entregue",
  canceled: "Cancelado",
};

type RawOrder = Omit<Order, "items" | "customer" | "payment_meta"> & {
  items: string;
  customer: string | null;
  tracking_code?: string | null;
  payment_meta?: string | null;
};

function parse(r: RawOrder): Order {
  return {
    ...r,
    tracking_code: r.tracking_code ?? null,
    payment_meta: r.payment_meta ? (JSON.parse(r.payment_meta) as PaymentMeta) : null,
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
  shippingPrice: number;
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

    const shipping = Number(input.shippingPrice.toFixed(2));
    const discount = input.payment === "pix" ? subtotal * 0.05 : 0;
    const total = Number((subtotal + shipping - discount).toFixed(2));
    const code = `DL-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

    db.prepare(
      `INSERT INTO orders (code, user_id, items, subtotal, shipping, discount, total, payment, customer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      code,
      input.userId,
      JSON.stringify(lines),
      subtotal,
      shipping,
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

export function saveOrderPaymentMeta(code: string, meta: PaymentMeta, newStatus?: string) {
  if (newStatus) {
    db.prepare("UPDATE orders SET payment_meta = ?, status = ? WHERE code = ?").run(
      JSON.stringify(meta),
      newStatus,
      code,
    );
  } else {
    db.prepare("UPDATE orders SET payment_meta = ? WHERE code = ?").run(JSON.stringify(meta), code);
  }
}

export function getOrderByCode(code: string): (Order & { user_id: number | null }) | undefined {
  const row = db.prepare("SELECT * FROM orders WHERE code = ?").get(code) as unknown as
    | (RawOrder & { user_id: number | null })
    | undefined;
  return row ? { ...parse(row), user_id: row.user_id } : undefined;
}

export function listOrders(userId: number): Order[] {
  const rows = db
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC")
    .all(userId) as unknown as RawOrder[];
  return rows.map(parse);
}

export function getLastCustomerData(userId: number): Customer | null {
  const row = db
    .prepare("SELECT customer FROM orders WHERE user_id = ? AND customer IS NOT NULL ORDER BY id DESC LIMIT 1")
    .get(userId) as unknown as { customer: string } | undefined;
  if (!row?.customer) return null;
  try {
    return JSON.parse(row.customer) as Customer;
  } catch {
    return null;
  }
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

/** Troca o status e código de rastreio; ao cancelar, devolve os itens ao estoque. */
export function setOrderStatus(code: string, status: string, trackingCode?: string) {
  if (!(status in STATUS_LABEL)) return;
  db.exec("BEGIN IMMEDIATE");
  try {
    const row = db.prepare("SELECT status, items, tracking_code FROM orders WHERE code = ?").get(code) as unknown as
      | { status: string; items: string; tracking_code: string | null }
      | undefined;
    if (!row) {
      db.exec("COMMIT");
      return;
    }
    if (status === "canceled" && row.status !== "canceled") {
      for (const i of JSON.parse(row.items) as OrderItem[]) {
        db.prepare("UPDATE products SET stock = stock + ? WHERE slug = ?").run(i.qty, i.slug);
      }
    }
    const nextTracking = trackingCode !== undefined ? trackingCode.trim() || null : row.tracking_code;
    const finalStatus = nextTracking && status === "paid" && row.status === "paid" ? "shipped" : status;
    db.prepare("UPDATE orders SET status = ?, tracking_code = ? WHERE code = ?").run(
      finalStatus,
      nextTracking,
      code,
    );
    db.exec("COMMIT");
  } catch {
    db.exec("ROLLBACK");
  }
}

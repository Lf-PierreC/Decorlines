import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { SEED_PRODUCTS } from "./seed-products";
import { syncLocalDatabaseToSupabase } from "./supabase";

/**
 * Banco local (SQLite) em ./data/loja.db.
 * Ao publicar em hospedagem serverless (Vercel), trocar por um banco hospedado
 * (Postgres/Supabase) e as fotos por um storage (Supabase Storage/Cloudinary).
 */
const g = globalThis as unknown as { __db?: DatabaseSync };

export const DATA_DIR = path.join(process.cwd(), "data");

function columns(db: DatabaseSync, table: string) {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
}

function addColumnIfMissing(db: DatabaseSync, table: string, col: string, ddl: string) {
  if (columns(db, table).includes(col)) return;
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`);
  } catch {
    // Outro worker paralelo já adicionou a coluna
  }
}

/** O primeiro usuário cadastrado vira administrador (se ainda não houver nenhum). */
export function ensureAdmin(db: DatabaseSync) {
  db.exec(`UPDATE users SET role = 'admin'
           WHERE id = (SELECT MIN(id) FROM users)
           AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')`);
}

function migrate(db: DatabaseSync) {
  db.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      user_id INTEGER REFERENCES users(id),
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      shipping REAL NOT NULL,
      discount REAL NOT NULL,
      total REAL NOT NULL,
      payment TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      tone TEXT NOT NULL DEFAULT '#e9dfd5',
      image TEXT,
      description TEXT NOT NULL DEFAULT '',
      details TEXT NOT NULL DEFAULT '[]',
      weight_kg REAL NOT NULL DEFAULT 0.3,
      stock INTEGER NOT NULL DEFAULT 10,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      recipient TEXT NOT NULL,
      cep TEXT NOT NULL,
      endereco TEXT NOT NULL,
      numero TEXT NOT NULL,
      complemento TEXT NOT NULL DEFAULT '',
      bairro TEXT NOT NULL,
      cidade TEXT NOT NULL,
      uf TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      brand TEXT NOT NULL,
      holder_name TEXT NOT NULL,
      last4 TEXT NOT NULL,
      expiry TEXT NOT NULL,
      token TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  addColumnIfMissing(db, "users", "role", "TEXT NOT NULL DEFAULT 'customer'");
  addColumnIfMissing(db, "orders", "customer", "TEXT");
  addColumnIfMissing(db, "orders", "tracking_code", "TEXT");
  addColumnIfMissing(db, "orders", "payment_meta", "TEXT");
  ensureAdmin(db);

  const { n } = db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number };
  if (n === 0) {
    const ins = db.prepare(
      `INSERT INTO products (slug, name, category, price, tone, description, details, weight_kg)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const p of SEED_PRODUCTS) {
      ins.run(p.slug, p.name, p.category, p.price, p.tone, p.description, JSON.stringify(p.details), p.weightKg);
    }
  }
}

function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, "loja.db"));
  migrate(db);
  void syncLocalDatabaseToSupabase(db);
  return db;
}

export const db = (g.__db ??= open());

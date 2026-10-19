import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";

export type SavedAddress = {
  id: number;
  label: string;
  recipient: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  isDefault: boolean;
};

export type SavedCard = {
  id: number;
  label: string;
  brand: string;
  holderName: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
};

type AddressRow = {
  id: number;
  label: string;
  recipient: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  is_default: number;
};

type CardRow = {
  id: number;
  label: string;
  brand: string;
  holder_name: string;
  last4: string;
  expiry: string;
  is_default: number;
};

export function listAddresses(userId: number): SavedAddress[] {
  const rows = db
    .prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC")
    .all(userId) as unknown as AddressRow[];
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    recipient: r.recipient,
    cep: r.cep,
    endereco: r.endereco,
    numero: r.numero,
    complemento: r.complemento,
    bairro: r.bairro,
    cidade: r.cidade,
    uf: r.uf,
    isDefault: r.is_default === 1,
  }));
}

export function addAddress(
  userId: number,
  input: Omit<SavedAddress, "id" | "isDefault"> & { isDefault?: boolean },
): SavedAddress {
  const existingCount = (
    db.prepare("SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?").get(userId) as { n: number }
  ).n;
  const makeDefault = input.isDefault || existingCount === 0;

  if (makeDefault) {
    db.prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?").run(userId);
  }

  const res = db
    .prepare(
      `INSERT INTO addresses (user_id, label, recipient, cep, endereco, numero, complemento, bairro, cidade, uf, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      userId,
      input.label,
      input.recipient,
      input.cep,
      input.endereco,
      input.numero,
      input.complemento,
      input.bairro,
      input.cidade,
      input.uf.toUpperCase(),
      makeDefault ? 1 : 0,
    );

  return {
    id: Number(res.lastInsertRowid),
    ...input,
    uf: input.uf.toUpperCase(),
    isDefault: makeDefault,
  };
}

export function setDefaultAddress(userId: number, addressId: number) {
  db.prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?").run(userId);
  db.prepare("UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?").run(addressId, userId);
}

export function deleteAddress(userId: number, addressId: number) {
  db.prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?").run(addressId, userId);
  const hasDefault = db
    .prepare("SELECT 1 FROM addresses WHERE user_id = ? AND is_default = 1")
    .get(userId);
  if (!hasDefault) {
    db.prepare(
      "UPDATE addresses SET is_default = 1 WHERE id = (SELECT id FROM addresses WHERE user_id = ? ORDER BY id DESC LIMIT 1)",
    ).run(userId);
  }
}

export function detectCardBrand(digits: string): string {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|650|6516|6550)/.test(digits)) return "Elo";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^(606282|3841)/.test(digits)) return "Hipercard";
  return "Cartão";
}

export function listCards(userId: number): SavedCard[] {
  const rows = db
    .prepare("SELECT * FROM cards WHERE user_id = ? ORDER BY is_default DESC, id DESC")
    .all(userId) as unknown as CardRow[];
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    brand: r.brand,
    holderName: r.holder_name,
    last4: r.last4,
    expiry: r.expiry,
    isDefault: r.is_default === 1,
  }));
}

export function addCard(
  userId: number,
  input: {
    label: string;
    holderName: string;
    cardNumberDigits: string;
    expiry: string;
    isDefault?: boolean;
  },
): SavedCard {
  const existingCount = (
    db.prepare("SELECT COUNT(*) AS n FROM cards WHERE user_id = ?").get(userId) as { n: number }
  ).n;
  const makeDefault = input.isDefault || existingCount === 0;

  if (makeDefault) {
    db.prepare("UPDATE cards SET is_default = 0 WHERE user_id = ?").run(userId);
  }

  const brand = detectCardBrand(input.cardNumberDigits);
  const last4 = input.cardNumberDigits.slice(-4);
  const token = `tok_${randomBytes(12).toString("hex")}`;
  const label = input.label.trim() || `${brand} final ${last4}`;

  const res = db
    .prepare(
      `INSERT INTO cards (user_id, label, brand, holder_name, last4, expiry, token, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(userId, label, brand, input.holderName.toUpperCase(), last4, input.expiry, token, makeDefault ? 1 : 0);

  return {
    id: Number(res.lastInsertRowid),
    label,
    brand,
    holderName: input.holderName.toUpperCase(),
    last4,
    expiry: input.expiry,
    isDefault: makeDefault,
  };
}

export function setDefaultCard(userId: number, cardId: number) {
  db.prepare("UPDATE cards SET is_default = 0 WHERE user_id = ?").run(userId);
  db.prepare("UPDATE cards SET is_default = 1 WHERE id = ? AND user_id = ?").run(cardId, userId);
}

export function deleteCard(userId: number, cardId: number) {
  db.prepare("DELETE FROM cards WHERE id = ? AND user_id = ?").run(cardId, userId);
  const hasDefault = db.prepare("SELECT 1 FROM cards WHERE user_id = ? AND is_default = 1").get(userId);
  if (!hasDefault) {
    db.prepare(
      "UPDATE cards SET is_default = 1 WHERE id = (SELECT id FROM cards WHERE user_id = ? ORDER BY id DESC LIMIT 1)",
    ).run(userId);
  }
}

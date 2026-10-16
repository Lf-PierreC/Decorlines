import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { db } from "./db";

const COOKIE = "dl_session";
const DAYS = 30;

export type User = { id: number; name: string; email: string; role: "admin" | "customer" };

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const test = scryptSync(password, salt, 64);
  return timingSafeEqual(test, Buffer.from(hash, "hex"));
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expires = Date.now() + DAYS * 864e5;
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
    sha(token),
    userId,
    expires,
  );
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha(token));
  jar.delete(COOKIE);
}

export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(sha(token), Date.now()) as unknown as User | undefined;
  return row ?? null;
}

/**
 * Garante que quem acessa é administrador. Deve ser chamado em TODA página
 * e TODA server action do admin (a verificação nunca pode ficar só no menu).
 */
export async function requireAdmin(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/conta/entrar");
  if (user.role !== "admin") notFound();
  return user;
}

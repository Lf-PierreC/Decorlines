import "server-only";

function getSupabaseConfig() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");

  const key = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ""
  ).trim();

  return { url, key, enabled: Boolean(url && key) };
}

function buildHeaders(key: string, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    ...extra,
  };
  if (key.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

/**
 * Executa uma chamada REST no PostgREST do Supabase em background/servidor.
 * Nunca interrompe o fluxo caso a internet oscile ou o RLS ainda esteja bloqueado.
 */
export async function supabaseRest<T = unknown>(
  pathWithQuery: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    prefer?: string;
  } = {},
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const { url, key, enabled } = getSupabaseConfig();
  if (!enabled) return { ok: false, status: 0, data: null };

  try {
    const res = await fetch(`${url}/rest/v1/${pathWithQuery.replace(/^\/+/, "")}`, {
      method: options.method ?? "GET",
      headers: buildHeaders(key, options.prefer ? { Prefer: options.prefer } : undefined),
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });

    const text = await res.text();
    let data: T | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = null;
      }
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

/**
 * Faz upload de uma imagem de produto diretamente para o Bucket público 'produtos' no Supabase Storage.
 * Retorna a URL pública da imagem no CDN do Supabase, ou null caso o bucket ainda não esteja liberado.
 */
export async function uploadToSupabaseStorage(
  fileName: string,
  buffer: Buffer,
  ext: "jpg" | "png" | "webp",
): Promise<string | null> {
  const { url, key, enabled } = getSupabaseConfig();
  if (!enabled) return null;

  const mime = ext === "jpg" ? "image/jpeg" : ext === "png" ? "image/png" : "image/webp";

  try {
    const headers: Record<string, string> = {
      apikey: key,
      "Content-Type": mime,
      "x-upsert": "true",
    };
    if (key.startsWith("eyJ")) {
      headers.Authorization = `Bearer ${key}`;
    }

    const res = await fetch(`${url}/storage/v1/object/produtos/${encodeURIComponent(fileName)}`, {
      method: "POST",
      headers,
      body: new Uint8Array(buffer),
      cache: "no-store",
    });

    if (res.ok) {
      return `${url}/storage/v1/object/public/produtos/${encodeURIComponent(fileName)}`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sincroniza em background os registros locais existentes (usuários, produtos, endereços, cartões e pedidos)
 * com o banco PostgreSQL do Supabase.
 */
export async function syncLocalDatabaseToSupabase(localDb: {
  prepare: (sql: string) => { all: () => unknown[] };
}) {
  const { enabled } = getSupabaseConfig();
  if (!enabled) return;

  try {
    const users = localDb.prepare("SELECT id, name, email, password_hash, role FROM users").all();
    if (users.length > 0) {
      await supabaseRest("users?on_conflict=email", {
        method: "POST",
        prefer: "resolution=merge-duplicates",
        body: users,
      });
    }

    const products = (
      localDb
        .prepare(
          "SELECT id, slug, name, category, price, tone, image, description, details, weight_kg, stock, active FROM products",
        )
        .all() as Array<{
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
      }>
    ).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      price: p.price,
      tone: p.tone,
      image: p.image,
      description: p.description,
      details: JSON.parse(p.details || "[]"),
      weight_kg: p.weight_kg,
      stock: p.stock,
      active: p.active === 1,
    }));

    if (products.length > 0) {
      await supabaseRest("products?on_conflict=slug", {
        method: "POST",
        prefer: "resolution=merge-duplicates",
        body: products,
      });
    }
  } catch {
    // Ignora falhas silenciosamente em background
  }
}


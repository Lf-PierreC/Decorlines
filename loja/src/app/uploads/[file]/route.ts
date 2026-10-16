import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/lib/db";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Serve as fotos enviadas pelo admin (guardadas em ./data/uploads). */
export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // Nome estrito: impede qualquer tentativa de acessar outros arquivos (path traversal).
  const m = /^[a-f0-9]{32}\.(jpg|png|webp)$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });

  try {
    const buf = await fs.promises.readFile(path.join(DATA_DIR, "uploads", file));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": TYPES[m[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

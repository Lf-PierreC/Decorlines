import { NextResponse } from "next/server";
import { calculateShipping, cleanCep } from "@/lib/shipping";

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

async function lookupAddress(cep: string) {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { cache: "force-cache" });
    if (!res.ok) return null;
    const data = (await res.json()) as ViaCepResponse;
    if (data.erro) return null;
    return {
      endereco: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      cidade: data.localidade ?? "",
      uf: data.uf ?? "",
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const cep = cleanCep(body.cep ?? "");
  const items = Array.isArray(body.items)
    ? body.items.map((i: { slug: unknown; qty: unknown }) => ({
        slug: String(i.slug),
        qty: Number(i.qty),
      }))
    : [];

  if (cep.length !== 8) {
    return NextResponse.json({ error: "CEP inválido. Digite os 8 números." }, { status: 400 });
  }

  const [address, quote] = await Promise.all([lookupAddress(cep), calculateShipping(cep, items)]);

  if (!quote.ok) {
    return NextResponse.json({ address, error: quote.error }, { status: 400 });
  }

  return NextResponse.json({
    address,
    options: quote.options,
  });
}

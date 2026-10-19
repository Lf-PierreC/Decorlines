import { NextResponse } from "next/server";
import { cleanCep } from "@/lib/shipping";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cep = cleanCep(searchParams.get("cep") ?? "");
  if (cep.length !== 8) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
  }
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { cache: "force-cache" });
    if (!res.ok) return NextResponse.json({ address: null });
    const data = await res.json();
    if (data.erro) return NextResponse.json({ address: null });
    return NextResponse.json({
      address: {
        endereco: data.logradouro ?? "",
        bairro: data.bairro ?? "",
        cidade: data.localidade ?? "",
        uf: data.uf ?? "",
      },
    });
  } catch {
    return NextResponse.json({ address: null });
  }
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveProduct, type FormState } from "@/app/admin/actions";

type Initial = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  weightKg: number;
  tone: string;
  image: string | null;
  description: string;
  details: string[];
  active: boolean;
};

const initial: FormState = {};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function ProductForm({ product }: { product?: Initial }) {
  const [state, action, pending] = useActionState(saveProduct.bind(null, product?.id ?? null), initial);

  return (
    <form action={action} className="max-w-2xl space-y-8">
      <Field label="Nome">
        <input name="name" className="input" required defaultValue={product?.name} />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Categoria" hint="Ex.: Vasos, Luminárias, Esculturas, Mesa">
          <input name="category" className="input" required defaultValue={product?.category} />
        </Field>
        <Field label="Preço (R$)">
          <input name="price" className="input" required inputMode="decimal" defaultValue={product?.price} />
        </Field>
        <Field label="Estoque (unidades)">
          <input name="stock" className="input" required inputMode="numeric" defaultValue={product?.stock ?? 1} />
        </Field>
        <Field label="Peso (kg)" hint="Usado no cálculo do frete. Ex.: 0,3">
          <input name="weight" className="input" required inputMode="decimal" defaultValue={product?.weightKg ?? 0.3} />
        </Field>
      </div>

      <Field label="Descrição">
        <textarea name="description" rows={4} className="input" defaultValue={product?.description} />
      </Field>
      <Field label="Detalhes" hint="Um por linha. Ex.: Altura: 22 cm">
        <textarea name="details" rows={5} className="input" defaultValue={product?.details.join("\n")} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Foto" hint="JPG, PNG ou WebP, até 5 MB. Formato vertical (4:5) fica melhor.">
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm" />
        </Field>
        <Field label="Cor de fundo (sem foto)">
          <input name="tone" type="color" defaultValue={product?.tone ?? "#e9dfd5"} className="mt-2 block h-10 w-20" />
        </Field>
      </div>

      {product?.image && (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt="" className="h-24 w-20 object-cover" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="removeImage" /> Remover foto atual
          </label>
        </div>
      )}

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="active" defaultChecked={product?.active ?? true} />
        Exibir na loja (desmarque para ocultar sem excluir)
      </label>

      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}

      <div className="flex gap-4">
        <button disabled={pending} className="btn disabled:opacity-50">
          {pending ? "Salvando..." : "Salvar produto"}
        </button>
        <Link href="/admin/produtos" className="btn btn-outline">Cancelar</Link>
      </div>
    </form>
  );
}

import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getProductById } from "@/lib/products";
import { ProductForm } from "@/components/ProductForm";

export default async function EditarProduto({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const product = getProductById(Number(id));
  if (!product) notFound();

  return (
    <>
      <h1 className="mb-10 font-serif text-4xl">Editar produto</h1>
      <ProductForm product={product} />
    </>
  );
}

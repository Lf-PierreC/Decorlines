import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "@/components/ProductForm";

export default async function NovoProduto() {
  await requireAdmin();
  return (
    <>
      <h1 className="mb-10 font-serif text-4xl">Novo produto</h1>
      <ProductForm />
    </>
  );
}

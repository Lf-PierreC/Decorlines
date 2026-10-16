import { getUser } from "@/lib/auth";
import { getProducts, toCartProduct } from "@/lib/products";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata = { title: "Finalizar compra — Decorlines" };

export default async function CheckoutPage() {
  const user = await getUser();
  const products = getProducts().map(toCartProduct);
  return (
    <CheckoutForm
      user={user ? { name: user.name, email: user.email } : null}
      products={products}
    />
  );
}

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getProducts, toCartProduct } from "@/lib/products";
import { getLastCustomerData } from "@/lib/orders";
import { listAddresses, listCards } from "@/lib/profile";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata = { title: "Finalizar compra — Decorlines" };

export default async function CheckoutPage() {
  const user = await getUser();
  if (!user) {
    redirect("/conta/entrar?next=/checkout");
  }
  const products = getProducts().map(toCartProduct);
  const savedCustomer = getLastCustomerData(user.id);
  const savedAddresses = listAddresses(user.id);
  const savedCards = listCards(user.id);

  return (
    <CheckoutForm
      user={{ name: user.name, email: user.email }}
      savedCustomer={savedCustomer}
      savedAddresses={savedAddresses}
      savedCards={savedCards}
      products={products}
    />
  );
}

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Cadastro — Decorlines" };

export default async function CadastroPage() {
  if (await getUser()) redirect("/conta");
  return <AuthForm mode="register" />;
}

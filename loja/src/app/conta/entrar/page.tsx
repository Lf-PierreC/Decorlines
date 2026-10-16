import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Entrar — Decorlines" };

export default async function EntrarPage() {
  if (await getUser()) redirect("/conta");
  return <AuthForm mode="login" />;
}

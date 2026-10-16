import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { getProducts, toCartProduct } from "@/lib/products";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const serif = Cormorant_Garamond({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Decorlines — Decoração impressa em 3D",
  description:
    "Vasos, luminárias e esculturas decorativas impressas em 3D. Design minimalista, feito com cuidado.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const cartProducts = getProducts().map(toCartProduct);
  return (
    <html lang="pt-BR" className={`${inter.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer products={cartProducts} />
      </body>
    </html>
  );
}

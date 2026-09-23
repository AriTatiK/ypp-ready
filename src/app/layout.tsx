import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "YPPReady — Prepare. Practice. Perform.",
  description:
    "An independent bilingual preparation platform for Young Professional Programs at international development organizations.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [lang, user] = await Promise.all([getLang(), getCurrentUser()]);
  const dict = getDictionary(lang);

  return (
    <html lang={lang} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-paper"
        >
          {lang === "fr" ? "Aller au contenu principal" : "Skip to main content"}
        </a>
        <Header />
        <main id="main-content" className={`flex-1 ${user ? "pb-20 lg:pb-0" : ""}`}>
          {children}
        </main>
        <Footer dict={dict} />
        {user && <MobileNav dict={dict} />}
      </body>
    </html>
  );
}

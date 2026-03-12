import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/i18n/locale-context";
import { getLocale } from "@/i18n";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YouEngage — Internal Audit Workflow",
  description: "Internal Audit Workflow Management System",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <LocaleProvider initialLocale={locale}>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </LocaleProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { PageNotFound } from "@/components/PageNotFound";
import { WanasWordmark } from "@/components/WanasWordmark";
import { defaultLocale } from "@/lib/i18n/config";
import "./globals.css";

export const metadata: Metadata = { title: "الصفحة غير موجودة | WANAS" };

export default function GlobalNotFound() {
  return (
    <html lang={defaultLocale} dir="rtl">
      <body>
        <header className="locale-header"><WanasWordmark locale={defaultLocale} /></header>
        <PageNotFound locale={defaultLocale} />
      </body>
    </html>
  );
}

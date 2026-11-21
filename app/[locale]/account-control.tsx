"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import type { Locale } from "@/lib/i18n/config";

export default function AccountControl({ locale }: { locale: Locale }) {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  if (!isSignedIn) return null;

  return (
    <button type="button" onClick={() => void signOut({ redirectUrl: `/${locale}` })}>
      {locale === "ar" ? "تسجيل الخروج" : "Sign out"}
    </button>
  );
}

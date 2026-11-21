"use client";

import { HandleSSOCallback, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { isLocale } from "@/lib/i18n/config";
import { safeReturnTo } from "@/lib/i18n/return-to";

function GoogleCallback() {
  const { locale: value } = useParams<{ locale: string }>();
  const locale = isLocale(value) ? value : "ar";
  const ar = locale === "ar";
  const returnTo = safeReturnTo(useSearchParams().get("returnTo"), locale);
  const restart = `/${locale}/sign-in?${new URLSearchParams({ returnTo, error: "google" })}`;
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) window.location.replace(returnTo);
  }, [isSignedIn, returnTo]);

  return (
    <main className="shell sign-in-shell">
      <h1>{ar ? "تسجيل الدخول باستخدام Google" : "Google sign-in"}</h1>
      {isSignedIn ? (
        <Link href={returnTo}>{ar ? "متابعة" : "Continue"}</Link>
      ) : (
        <>
          <HandleSSOCallback
            navigateToApp={({ session, decorateUrl }) => {
              window.location.replace(session.status === "active" ? decorateUrl(returnTo) : restart);
            }}
            navigateToSignIn={() => window.location.replace(restart)}
            navigateToSignUp={() => window.location.replace(restart)}
          />
          <Link href={restart}>{ar ? "العودة إلى تسجيل الدخول" : "Back to sign-in"}</Link>
        </>
      )}
    </main>
  );
}

export default function GoogleCallbackPage() {
  return <Suspense><GoogleCallback /></Suspense>;
}

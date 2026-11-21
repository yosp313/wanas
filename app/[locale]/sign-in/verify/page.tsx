"use client";

import { useAuth, useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { RouteLoading } from "@/components/RouteLoading";
import { isLocale } from "@/lib/i18n/config";
import { safeReturnTo } from "@/lib/i18n/return-to";
import { emailLinkMessage, finishEmailSignIn } from "../email-link";

function VerifyLink() {
  const { locale: value } = useParams<{ locale: string }>();
  const locale = isLocale(value) ? value : "ar";
  const ar = locale === "ar";
  const search = useSearchParams();
  const { loaded } = useClerk();
  const { isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const returnTo = safeReturnTo(search.get("returnTo"), locale);
  const reportedStatus = search.get("__clerk_status");
  const status = failed ? "failed"
    : signIn.isTransferable ? "verified"
    : signIn.emailLink.verification?.status
      ?? (reportedStatus === "expired" || reportedStatus === "client_mismatch" ? reportedStatus : "failed");
  const restart = `/${locale}/sign-in?${new URLSearchParams({ returnTo })}`;

  async function continueHere() {
    if (isSignedIn) {
      window.location.replace(returnTo);
      return;
    }
    setPending(true);
    try {
      await finishEmailSignIn(signIn, signUp, ({ session, decorateUrl }) => {
        if (session.status !== "active") throw new Error("CLERK_SIGN_IN_INCOMPLETE");
        window.location.replace(decorateUrl(returnTo));
      }, signIn.isTransferable);
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <main className="shell sign-in-shell">
      <h1>{ar ? "التحقق من البريد الإلكتروني" : "Verify your email"}</h1>
      {!loaded ? <p role="status">{ar ? "جارٍ التحقق…" : "Verifying…"}</p> : status === "verified" ? (
        <>
          <p role="status">{ar ? "تم التحقق من بريدك. عُد إلى الصفحة التي بدأت منها." : "Your email is verified. Return to the tab where you started."}</p>
          <button className="button" type="button" disabled={pending} onClick={continueHere}>{ar ? "المتابعة هنا" : "Continue here"}</button>
        </>
      ) : (
        <>
          <p role="alert">{emailLinkMessage(status, locale)}</p>
          <Link href={restart}>{ar ? "اطلب رابطًا جديدًا" : "Request a new link"}</Link>
        </>
      )}
    </main>
  );
}

export default function VerifyPage() {
  return <Suspense fallback={<RouteLoading />}><VerifyLink /></Suspense>;
}

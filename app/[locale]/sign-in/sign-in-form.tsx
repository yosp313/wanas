"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { type FormEvent, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { safeReturnTo } from "@/lib/i18n/return-to";
import { emailLinkMessage, finishEmailSignIn } from "./email-link";

export default function SignInForm({
  locale, returnTo, callbackError,
}: {
  locale: Locale;
  returnTo: string;
  callbackError?: string;
}) {
  const ar = locale === "ar";
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(callbackError === "link"
    ? emailLinkMessage("expired", locale)
    : callbackError === "google"
      ? ar ? "لم يكتمل تسجيل الدخول باستخدام Google. حاول مرة أخرى." : "Google sign-in didn't finish. Try again."
      : "");
  const query = new URLSearchParams({ returnTo: safeReturnTo(returnTo, locale) });

  useEffect(() => {
    function resetAfterBack(event: PageTransitionEvent) {
      if (event.persisted) setPending(false);
    }
    window.addEventListener("pageshow", resetAfterBack);
    return () => window.removeEventListener("pageshow", resetAfterBack);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    let linkSent = false;
    try {
      const { error: createError } = await signIn.create({ identifier: email.trim(), signUpIfMissing: true });
      if (createError) throw createError;
      const verificationUrl = `${window.location.origin}/${locale}/sign-in/verify?${query}`;
      const { error: sendError } = await signIn.emailLink.sendLink({ verificationUrl });
      if (sendError) throw sendError;
      linkSent = true;
      setSent(true);

      const { error: verificationError } = await signIn.emailLink.waitForVerification();
      const transfer = signIn.isTransferable || (isClerkAPIResponseError(verificationError)
        && verificationError.errors.some(({ code }) => code === "sign_up_if_missing_transfer"));
      if (verificationError && !transfer) throw verificationError;
      await finishEmailSignIn(signIn, signUp, ({ session, decorateUrl }) => {
        if (session.status !== "active") throw new Error("CLERK_SIGN_IN_INCOMPLETE");
        window.location.replace(decorateUrl(safeReturnTo(returnTo, locale)));
      }, transfer);
    } catch {
      setError(linkSent
        ? emailLinkMessage(signIn.firstFactorVerification?.status ?? "failed", locale)
        : ar ? "تعذر إرسال الرابط. حاول مرة أخرى." : "We couldn't send the link. Try again.");
      setSent(false);
    } finally {
      setPending(false);
    }
  }

  async function google() {
    setError("");
    setPending(true);
    try {
      const callback = new URL(`/${locale}/sign-in/sso-callback?${query}`, window.location.origin).href;
      const { error } = await signIn.create({
        strategy: "oauth_google",
        redirectUrl: clerk.buildUrlWithAuth(callback),
        actionCompleteRedirectUrl: callback,
      });
      if (error) throw error;
      const redirect = signIn.firstFactorVerification.externalVerificationRedirectURL;
      if (!redirect) throw new Error("CLERK_GOOGLE_REDIRECT_MISSING");
      window.location.assign(redirect.href);
    } catch {
      setError(ar ? "تعذر تسجيل الدخول باستخدام Google. حاول مرة أخرى." : "We couldn't start Google sign-in. Try again.");
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={submit}>
        <label htmlFor="email">{ar ? "البريد الإلكتروني" : "Email"}</label>
        <input id="email" dir="ltr" type="email" autoComplete="email" required readOnly={pending}
          value={email} onChange={(event) => setEmail(event.target.value)} />
        {sent ? (
          <>
            <p role="status">{ar ? "افتح الرابط في بريدك، ثم عُد إلى هذه الصفحة." : "Open the link in your email, then return to this tab."}</p>
            <button className="button" type="button" onClick={() => window.location.reload()}>
              {ar ? "ابدأ من جديد" : "Start again"}
            </button>
          </>
        ) : (
          <button className="button" type="submit" disabled={!clerk.loaded || pending}>
            {ar ? "أرسل رابط تسجيل الدخول" : "Email me a sign-in link"}
          </button>
        )}
        <button className="button secondary" type="button" disabled={!clerk.loaded || pending} onClick={google}>
          {ar ? "المتابعة باستخدام Google" : "Continue with Google"}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
      <div id="clerk-captcha" />
    </>
  );
}

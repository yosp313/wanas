"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useFieldValidation } from "@/components/forms/field-validation";
import type { Locale } from "@/lib/i18n/config";
import { safeReturnTo } from "@/lib/i18n/return-to";
import { emailLinkMessage, finishEmailSignIn } from "./email-link";
import styles from "./sign-in.module.css";

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
  const { field, error } = useFieldValidation();
  useEffect(() => {
    if (callbackError === "link") {
      toast.error(emailLinkMessage("expired", locale), { id: "sign-in-callback" });
    } else if (callbackError === "google") {
      toast.error(ar ? "لم يكتمل تسجيل الدخول باستخدام Google. حاول مرة أخرى." : "Google sign-in didn't finish. Try again.", { id: "sign-in-callback" });
    }
  }, [ar, callbackError, locale]);
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
      toast.error(linkSent
        ? emailLinkMessage(signIn.firstFactorVerification?.status ?? "failed", locale)
        : ar ? "تعذر إرسال الرابط. حاول مرة أخرى." : "We couldn't send the link. Try again.");
      setSent(false);
    } finally {
      setPending(false);
    }
  }

  async function google() {
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
      toast.error(ar ? "تعذر تسجيل الدخول باستخدام Google. حاول مرة أخرى." : "We couldn't start Google sign-in. Try again.");
      setPending(false);
    }
  }

  return (
    <div className={styles.formCard}>
      <button className={styles.google} type="button" disabled={!clerk.loaded || pending} onClick={google}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
          <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
        </svg>
        {ar ? "المتابعة باستخدام Google" : "Continue with Google"}
      </button>
      <p className={styles.divider}>{ar ? "أو تابعوا عبر البريد الإلكتروني" : "Or continue by email"}</p>
      <form onSubmit={submit}>
        <label htmlFor="email">{ar ? "البريد الإلكتروني" : "Email"}</label>
        <div className={styles.emailField}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          <input id="email" dir="ltr" type="email" autoComplete="email" required readOnly={pending}
            placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)}
            {...field("email", ar ? "أدخل بريدًا إلكترونيًا صالحًا." : "Enter a valid email address.")} />
        </div>
        {error("email")}
        {sent ? (
          <>
            <p role="status">{ar ? "افتح الرابط في بريدك، ثم عُد إلى هذه الصفحة." : "Open the link in your email, then return to this tab."}</p>
            <button className={styles.submit} type="button" onClick={() => window.location.reload()}>
              {ar ? "ابدأ من جديد" : "Start again"}
            </button>
          </>
        ) : (
          <button className={styles.submit} type="submit" disabled={!clerk.loaded || pending}>
            {ar ? "أرسل رابط تسجيل الدخول" : "Email me a sign-in link"}
            <span className={styles.arrow} aria-hidden="true">→</span>
          </button>
        )}
      </form>
      <p className={styles.formNote}>
        {ar ? "سنرسل رابطًا للاستخدام مرة واحدة. لا حاجة إلى كلمة مرور." : "We’ll email you a single-use link. No password needed."}
      </p>
      <div id="clerk-captcha" />
    </div>
  );
}

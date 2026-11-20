"use client";

import { type FormEvent, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/server/auth/client";

export default function SignInForm({ locale, returnTo }: { locale: Locale; returnTo: string }) {
  const ar = locale === "ar";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const client = createClient();
      if (!sent) {
        const result = await client.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: true },
        });
        if (result.error) throw result.error;
        setSent(true);
        return;
      }
      const result = await client.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
      if (result.error) throw result.error;
      window.location.assign(returnTo);
    } catch {
      setError(sent ?
        (ar ? "تحقّق من الرمز أو اطلب رمزًا جديدًا." : "Check your code or request a new one.") :
        (ar ? "تعذر إرسال الرمز. حاول مرة أخرى." : "Unable to send a code. Try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="email">{ar ? "البريد الإلكتروني" : "Email"}</label>
      <input id="email" dir="ltr" type="email" autoComplete="email" required readOnly={sent}
        value={email} onChange={(event) => setEmail(event.target.value)} />
      {sent && <>
        <p>{ar ? "أدخل الرمز الوارد في بريدك الإلكتروني." : "Enter the code from your email."}</p>
        <label htmlFor="code">{ar ? "الرمز" : "Code"}</label>
        <input id="code" dir="ltr" inputMode="numeric" autoComplete="one-time-code" required
          value={code} onChange={(event) => setCode(event.target.value)} />
      </>}
      <button className="button" type="submit" disabled={pending}>
        {sent ? (ar ? "تحقّق من الرمز" : "Verify code") : (ar ? "أرسل الرمز" : "Send code")}
      </button>
      {sent && <button type="button" disabled={pending} onClick={() => { setSent(false); setCode(""); setError(""); }}>
        {ar ? "اطلب رمزًا جديدًا" : "Request a new code"}
      </button>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

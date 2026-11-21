import type { SetActiveNavigate, SignInFutureResource, SignUpFutureResource } from "@clerk/nextjs/types";
import type { Locale } from "@/lib/i18n/config";

export function emailLinkMessage(status: string, locale: Locale) {
  const ar = locale === "ar";
  switch (status) {
    case "expired":
      return ar ? "انتهت صلاحية الرابط. اطلب رابطًا جديدًا." : "This link has expired. Request a new one.";
    case "client_mismatch":
      return ar ? "افتح الرابط في المتصفح والجهاز اللذين طلبته منهما." : "Open the link in the browser and on the device where you requested it.";
    default:
      return ar ? "تعذر التحقق من الرابط. اطلب رابطًا جديدًا." : "We couldn't verify this link. Request a new one.";
  }
}

export async function finishEmailSignIn(
  signIn: SignInFutureResource,
  signUp: SignUpFutureResource,
  navigate: SetActiveNavigate,
  transfer: boolean,
) {
  const attempt = transfer ? signUp : signIn;
  if (transfer) {
    const { error } = await signUp.create({ transfer: true });
    if (error) throw error;
  }
  if (attempt.status !== "complete") throw new Error("CLERK_SIGN_IN_INCOMPLETE");
  const { error } = await attempt.finalize({ navigate });
  if (error) throw error;
}

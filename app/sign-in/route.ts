import { cookies } from "next/headers";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

export async function GET(request: Request) {
  const saved = (await cookies()).get("w_locale")?.value;
  const locale = saved && isLocale(saved) ? saved : defaultLocale;
  const { search } = new URL(request.url);

  return new Response(null, { status: 307, headers: { Location: `/${locale}/sign-in${search}` } });
}

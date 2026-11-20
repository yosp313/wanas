import { cookies } from "next/headers";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
export async function GET() { const saved = (await cookies()).get("w_locale")?.value; const locale = saved && isLocale(saved) ? saved : defaultLocale; return new Response(null, { status: 307, headers: { Location: `/${locale}` } }); }

import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/lib/i18n/config";
import { safeReturnTo } from "@/lib/i18n/return-to";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: value } = await params;
  const locale = isLocale(value) ? value : "ar";
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"), locale);
  const search = new URLSearchParams({ error: "link", returnTo });
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/${locale}/sign-in?${search}` },
  });
}

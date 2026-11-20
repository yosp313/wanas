import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/lib/i18n/config";
export function proxy(request: NextRequest) { const { pathname } = request.nextUrl; if (pathname.startsWith("/_next") || pathname.includes(".")) return NextResponse.next(); if (pathname === "/") return NextResponse.next(); const locale = pathname.split("/")[1]; if (!isLocale(locale)) return NextResponse.next(); const response = NextResponse.next(); response.cookies.set("w_locale", locale, { maxAge: 31536000, path: "/", sameSite: "lax" }); return response; }
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };

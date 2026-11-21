import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n/config";

export default clerkMiddleware((_auth, request) => {
  const response = NextResponse.next();
  const locale = request.nextUrl.pathname.split("/")[1];
  if (isLocale(locale)) {
    response.cookies.set("w_locale", locale, { maxAge: 31536000, path: "/", sameSite: "lax" });
  }
  return response;
});

export const config = { matcher: ["/ar/:path*", "/en/:path*", "/__clerk/:path*"] };

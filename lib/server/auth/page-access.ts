import "server-only";

import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";

export async function withPageAccess<T>(locale: Locale, path: string, read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "AUTH_REQUIRED") {
        redirect(`/${locale}/sign-in?returnTo=${encodeURIComponent(path)}`);
      }
      if (error.message === "ADMIN_REQUIRED") notFound();
    }
    throw error;
  }
}

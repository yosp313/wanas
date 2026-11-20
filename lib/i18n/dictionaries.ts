import "server-only";
import type { Locale } from "./config";
const dictionaries = { ar: () => import("./messages/ar").then((module) => module.default), en: () => import("./messages/en").then((module) => module.default) } satisfies Record<Locale, () => Promise<Record<string, string>>>;
export function getDictionary(locale: Locale) { return dictionaries[locale](); }

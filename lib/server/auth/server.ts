import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() { const store = await cookies(); return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { cookies: { getAll: () => store.getAll(), setAll: (values) => { try { values.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Server Components cannot mutate cookies. */ } } } }); }
export async function getVerifiedUser() { if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null; const { data: { user }, error } = await (await createClient()).auth.getUser(); if (error || !user) return null; return user; }

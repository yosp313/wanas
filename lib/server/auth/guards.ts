import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getVerifiedUser } from "./server";
import { requireDb } from "../db";
import { adminAccess } from "../db/schema";
export async function requireCustomer() { const user = await getVerifiedUser(); if (!user) throw new Error("AUTH_REQUIRED"); return user; }
export async function requireAdmin() { const user = await requireCustomer(); const record = await requireDb().select({ userId: adminAccess.userId }).from(adminAccess).where(and(eq(adminAccess.userId, user.id), eq(adminAccess.isAdmin, true), isNull(adminAccess.revokedAt))).limit(1); if (!record[0]) throw new Error("ADMIN_REQUIRED"); return user; }
export async function requireActiveAdmin(userId: string) { const result = await requireDb().select().from(adminAccess).where(eq(adminAccess.userId, userId)).limit(1); return Boolean(result[0] && result[0].revokedAt === null); }

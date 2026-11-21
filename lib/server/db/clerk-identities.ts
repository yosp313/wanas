import { eq } from "drizzle-orm";
import type { User } from "@clerk/nextjs/server";
import type { Database } from "./index";
import { clerkIdentities } from "./schema";

type IdentityDb = Pick<Database, "select" | "insert">;

export async function findIdentity(db: IdentityDb, clerkUserId: string) {
  const [identity] = await db.select({ id: clerkIdentities.appUserId })
    .from(clerkIdentities).where(eq(clerkIdentities.clerkUserId, clerkUserId));
  return identity?.id;
}

export function verifiedPrimaryEmail(user: User) {
  const email = user.primaryEmailAddress;
  return email?.verification?.status === "verified" ? email.emailAddress : undefined;
}

export async function resolveIdentity(db: IdentityDb, user: User) {
  const id = await findIdentity(db, user.id);
  if (id) return id;
  if (user.externalId !== null) {
    throw new Error(`CLERK_IDENTITY_IMPORT_REQUIRED: ${user.id}`);
  }
  if (!verifiedPrimaryEmail(user)) throw new Error("AUTH_EMAIL_REQUIRED");
  const [inserted] = await db.insert(clerkIdentities).values({ clerkUserId: user.id })
    .onConflictDoNothing({ target: clerkIdentities.clerkUserId })
    .returning({ id: clerkIdentities.appUserId });
  const resolved = inserted?.id ?? await findIdentity(db, user.id);
  if (!resolved) throw new Error("CLERK_IDENTITY_INSERT_FAILED");
  return resolved;
}

export async function importIdentity(db: IdentityDb, clerkUserId: string, appUserId: string) {
  await db.insert(clerkIdentities).values({ clerkUserId, appUserId })
    .onConflictDoNothing({ target: clerkIdentities.clerkUserId });
  if (await findIdentity(db, clerkUserId) !== appUserId) {
    throw new Error(`CLERK_IDENTITY_CONFLICT: ${clerkUserId}`);
  }
}

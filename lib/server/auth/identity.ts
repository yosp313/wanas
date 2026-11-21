import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { requireDb } from "../db";
import { findIdentity, resolveIdentity, verifiedPrimaryEmail } from "../db/clerk-identities";

export async function getVerifiedUser(needsEmail = false) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) return null;

  const db = requireDb();
  const mapped = await findIdentity(db, userId);
  if (mapped && !needsEmail) return { id: mapped, email: undefined };

  const user = await (await clerkClient()).users.getUser(userId);
  const id = mapped ?? await resolveIdentity(db, user);
  return { id, email: verifiedPrimaryEmail(user) };
}

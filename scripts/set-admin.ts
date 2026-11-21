import { createClerkClient } from "@clerk/nextjs/server";
import { eq, sql as expression } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { findIdentity, resolveIdentity, verifiedPrimaryEmail } from "../lib/server/db/clerk-identities";
import { adminAccess } from "../lib/server/db/schema";

async function main() {
  const [command, clerkUserId, actorId, ...extra] = process.argv.slice(2);
  const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

  if (extra.length || !["grant", "revoke"].includes(command) || !/^user_[a-z0-9]+$/i.test(clerkUserId ?? "") || !uuid.test(actorId ?? "")) {
    throw new Error("Usage: npm run admin:access -- <grant|revoke> <clerk-user-id> <operator-user-id>");
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    if (command === "grant") {
      const secretKey = process.env.CLERK_SECRET_KEY;
      if (!secretKey) throw new Error("CLERK_SECRET_KEY is required to grant access");
      const user = await createClerkClient({ secretKey }).users.getUser(clerkUserId);
      if (user.banned || user.locked || !verifiedPrimaryEmail(user)) {
        throw new Error("Staff account must be active and have a verified primary email");
      }
      await db.transaction(async (tx) => {
        const userId = await resolveIdentity(tx, user);
        const grant = { isAdmin: true, grantedBy: actorId, revokedAt: null };
        await tx.insert(adminAccess).values({ userId, ...grant })
          .onConflictDoUpdate({ target: adminAccess.userId, set: { ...grant, updatedAt: expression`now()` } });
      });
    } else {
      const userId = await findIdentity(db, clerkUserId);
      if (!userId) throw new Error("Clerk target has no application identity");
      const [revoked] = await db.update(adminAccess).set({
        isAdmin: false,
        revokedAt: expression`coalesce(${adminAccess.revokedAt}, now())`,
        updatedAt: expression`now()`,
      }).where(eq(adminAccess.userId, userId)).returning({ id: adminAccess.userId });
      if (!revoked) throw new Error("Clerk target has no staff grant");
    }
    console.log(command === "grant" ? "Staff access granted." : "Staff access revoked.");
  } finally {
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

import { createClerkClient } from "@clerk/nextjs/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { importIdentity } from "../lib/server/db/clerk-identities";
import { clerkIdentities } from "../lib/server/db/schema";

async function main() {
  const [mode, ...extra] = process.argv.slice(2);
  const { DATABASE_URL, CLERK_SECRET_KEY } = process.env;
  if (extra.length || !["--dry-run", "--apply"].includes(mode)) {
    throw new Error("Usage: npm run clerk:identities -- <--dry-run|--apply>");
  }
  if (!DATABASE_URL || !CLERK_SECRET_KEY) throw new Error("DATABASE_URL and CLERK_SECRET_KEY are required");

  const sql = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(sql);
  const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });

  try {
    const legacy = await sql<{ id: string; email: string | null; verified: boolean }[]>`
      select id, email, email_confirmed_at is not null as verified
      from auth.users
      where deleted_at is null and not is_anonymous
      order by id
    `;
    const pairs = new Map<string, string>();
    for (let offset = 0; offset < legacy.length; offset += 100) {
      const batch = legacy.slice(offset, offset + 100);
      const { data } = await clerk.users.getUserList({ externalId: batch.map(({ id }) => id), limit: batch.length });
      for (const source of batch) {
        const matches = data.filter((user) => user.externalId === source.id);
        const account = matches[0];
        const address = account?.emailAddresses.find((email) =>
          email.emailAddress.toLowerCase() === source.email?.toLowerCase());
        if (matches.length > 1 || (account && source.verified && address?.verification?.status !== "verified")) {
          throw new Error(`CLERK_IDENTITY_CONFLICT: ${source.id}`);
        }
        if (account) pairs.set(source.id, account.id);
      }
    }

    const owners = await sql<{ id: string }[]>`
      select customer_id as id from event_requests
      union select customer_id from booking_change_requests
      union select user_id from admin_access where is_admin and revoked_at is null
    `;
    const historical = await sql<{ id: string }[]>`
      select actors.id
      from (select agreed_by as id from booking_revisions
            union select granted_by from admin_access
            union select user_id from admin_access where not is_admin or revoked_at is not null) actors
      left join auth.users u on u.id = actors.id and u.deleted_at is null
      where actors.id is not null and u.id is null
    `;
    const unresolved = owners.filter(({ id }) => !pairs.has(id));
    console.log({ accounts: legacy.length, matched: pairs.size, ownerAndActiveStaffIds: owners.length, unresolved: unresolved.length, historicalActorsMissing: historical.map(({ id }) => id) });
    if (unresolved.length || pairs.size !== legacy.length) {
      throw new Error("Reconcile missing Clerk accounts before applying identity mappings");
    }

    await db.transaction(async (tx) => {
      const existing = await tx.select().from(clerkIdentities);
      const subjects = new Map(existing.map(({ clerkUserId, appUserId }) => [clerkUserId, appUserId]));
      const owners = new Map(existing.map(({ clerkUserId, appUserId }) => [appUserId, clerkUserId]));
      for (const [appUserId, clerkUserId] of pairs) {
        if ((subjects.has(clerkUserId) && subjects.get(clerkUserId) !== appUserId)
          || (owners.has(appUserId) && owners.get(appUserId) !== clerkUserId)) {
          throw new Error(`CLERK_IDENTITY_CONFLICT: ${appUserId}`);
        }
        if (mode === "--apply") await importIdentity(tx, clerkUserId, appUserId);
      }
    });
    console.log(mode === "--apply" ? "Clerk identity mappings applied." : "Clerk identity mapping dry run passed.");
  } finally {
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

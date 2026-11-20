import postgres from "postgres";

const [command, userId, actorId] = process.argv.slice(2);
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

if (!["grant", "revoke"].includes(command) || !uuid.test(userId ?? "") || !uuid.test(actorId ?? "")) {
  throw new Error("Usage: npm run admin:access -- <grant|revoke> <supabase-user-id> <operator-user-id>");
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const sql = postgres(connectionString, { max: 1 });

try {
  if (command === "grant") {
    await sql`INSERT INTO admin_access (user_id, is_admin, granted_by, revoked_at)
      VALUES (${userId}, TRUE, ${actorId}, NULL)
      ON CONFLICT (user_id) DO UPDATE SET
        is_admin = TRUE, granted_by = EXCLUDED.granted_by, revoked_at = NULL, updated_at = now()`;
  } else {
    await sql`UPDATE admin_access
      SET is_admin = FALSE, revoked_at = now(), updated_at = now()
      WHERE user_id = ${userId}`;
  }
} finally {
  await sql.end();
}

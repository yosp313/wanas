import postgres from "postgres";

const [command, userId, actorId] = process.argv.slice(2);
if (!['grant', 'revoke'].includes(command) || !userId || !actorId) throw new Error('Usage: tsx scripts/set-admin.ts <grant|revoke> <supabase-user-id> <operator-user-id>');
const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
if (command === 'grant') await sql`insert into admin_access (user_id, granted_by, revoked_at) values (${userId}, ${actorId}, null) on conflict (user_id) do update set granted_by = ${actorId}, revoked_at = null, updated_at = now()`;
else await sql`update admin_access set revoked_at = now(), updated_at = now() where user_id = ${userId}`;
await sql.end();

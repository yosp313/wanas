# Enforce booking capacity in Postgres

The Next.js app uses Supabase Auth and stores requests, quotes, and bookings in Supabase Postgres. Quote acceptance checks the current quote and its hold, then confirms the booking in one database transaction. The database enforces one booking per Cairo calendar day so simultaneous requests cannot confirm the same date twice.

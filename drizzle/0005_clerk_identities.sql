CREATE TABLE "clerk_identities" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"app_user_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	CONSTRAINT "clerk_identities_app_user_id_unique" UNIQUE("app_user_id")
);
--> statement-breakpoint
ALTER TABLE "clerk_identities" ENABLE ROW LEVEL SECURITY;
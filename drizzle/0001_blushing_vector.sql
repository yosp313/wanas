ALTER TABLE "admin_access" ADD COLUMN "is_admin" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "event_requests" ADD COLUMN "customer_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD COLUMN "claim_token" uuid;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD COLUMN "claim_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD COLUMN "provider_id" text;
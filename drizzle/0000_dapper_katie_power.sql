CREATE TABLE "admin_access" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"granted_by" uuid,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"change" jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"event_date" date NOT NULL,
	"terms" jsonb NOT NULL,
	"agreed_by" uuid,
	"agreed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_revisions_booking_revision_key" UNIQUE("booking_id","revision")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"accepted_quote_id" uuid NOT NULL,
	"event_date" date NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"status" varchar(32) DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_accepted_quote_key" UNIQUE("accepted_quote_id")
);
--> statement-breakpoint
CREATE TABLE "date_reservations" (
	"event_date" date PRIMARY KEY NOT NULL,
	"kind" varchar(16) NOT NULL,
	"quote_id" uuid,
	"booking_id" uuid,
	"hold_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "date_reservations_kind_check" CHECK ("date_reservations"."kind" in ('hold', 'booking')),
	CONSTRAINT "date_reservations_owner_check" CHECK ((kind = 'hold' and quote_id is not null and booking_id is null) or (kind = 'booking' and booking_id is not null and quote_id is null))
);
--> statement-breakpoint
CREATE TABLE "event_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"language" varchar(2) NOT NULL,
	"customer_name" text NOT NULL,
	"customer_mobile" text NOT NULL,
	"event_date" date NOT NULL,
	"details" jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_requests_customer_submission_key" UNIQUE("customer_id","submission_id")
);
--> statement-breakpoint
CREATE TABLE "notification_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid,
	"quote_id" uuid,
	"booking_id" uuid,
	"kind" varchar(48) NOT NULL,
	"language" varchar(2) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"provider_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"offered_date" date NOT NULL,
	"services" jsonb NOT NULL,
	"total_egp" integer NOT NULL,
	"scope_explanation" text,
	"status" varchar(32) DEFAULT 'current' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_change_requests" ADD CONSTRAINT "booking_change_requests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_revisions" ADD CONSTRAINT "booking_revisions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_request_id_event_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."event_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_accepted_quote_id_quotes_id_fk" FOREIGN KEY ("accepted_quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_reservations" ADD CONSTRAINT "date_reservations_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_reservations" ADD CONSTRAINT "date_reservations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_request_id_event_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."event_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_request_id_event_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."event_requests"("id") ON DELETE no action ON UPDATE no action;
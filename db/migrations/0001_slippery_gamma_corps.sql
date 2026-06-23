CREATE TYPE "public"."payment_kind" AS ENUM('filing_fee', 'balance_due', 'refund_ref');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'authorized', 'captured', 'failed', 'refunded', 'settled');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"return_id" uuid,
	"kind" "payment_kind" NOT NULL,
	"amount_cents" bigint NOT NULL,
	"processor" text NOT NULL,
	"processor_ref" text NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_return_id_tax_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."tax_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_uniq" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id","created_at");
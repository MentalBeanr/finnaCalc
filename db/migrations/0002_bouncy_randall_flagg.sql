CREATE TABLE "consents_signed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"return_id" uuid,
	"consent_type" text NOT NULL,
	"version" text NOT NULL,
	"accepted" boolean DEFAULT true NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "e_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" uuid NOT NULL,
	"method" text NOT NULL,
	"prior_year_agi_match" boolean NOT NULL,
	"ip_pin_present" boolean DEFAULT false NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consents_signed" ADD CONSTRAINT "consents_signed_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents_signed" ADD CONSTRAINT "consents_signed_return_id_tax_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."tax_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "e_signatures" ADD CONSTRAINT "e_signatures_return_id_tax_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."tax_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consents_signed_return_idx" ON "consents_signed" USING btree ("return_id","consent_type");--> statement-breakpoint
CREATE UNIQUE INDEX "e_signatures_return_uniq" ON "e_signatures" USING btree ("return_id");
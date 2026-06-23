CREATE TYPE "public"."audit_actor_kind" AS ENUM('user', 'admin', 'system', 'partner', 'irs');--> statement-breakpoint
CREATE TYPE "public"."credit_type" AS ENUM('ctc', 'actc', 'eitc', 'aotc', 'llc', 'cdcc', 'saver', 'other');--> statement-breakpoint
CREATE TYPE "public"."deduction_type" AS ENUM('mortgage_interest', 'salt', 'charitable', 'medical', 'student_loan', 'property_tax', 'other');--> statement-breakpoint
CREATE TYPE "public"."document_kind" AS ENUM('w2', '1099', '1095_a', 'receipt', 'filed_return_pdf', 'mef_payload', 'other');--> statement-breakpoint
CREATE TYPE "public"."filing_channel" AS ENUM('partner', 'direct_mef');--> statement-breakpoint
CREATE TYPE "public"."filing_linkage" AS ENUM('linked_fed_state', 'unlinked');--> statement-breakpoint
CREATE TYPE "public"."filing_state" AS ENUM('built', 'transmitted', 'received', 'validated', 'accepted', 'rejected', 'imperfect');--> statement-breakpoint
CREATE TYPE "public"."filing_status" AS ENUM('single', 'mfj', 'mfs', 'hoh', 'qss');--> statement-breakpoint
CREATE TYPE "public"."income_type" AS ENUM('w2', '1099_nec', '1099_int', '1099_div', '1099_b', '1099_r', 'sch_c', 'rental', 'ss', 'other');--> statement-breakpoint
CREATE TYPE "public"."person_role" AS ENUM('taxpayer', 'spouse', 'dependent');--> statement-breakpoint
CREATE TYPE "public"."return_kind" AS ENUM('original', 'amendment');--> statement-breakpoint
CREATE TYPE "public"."return_state" AS ENUM('draft', 'ready_to_review', 'ready_to_file', 'signed', 'submitted', 'accepted', 'rejected', 'amended');--> statement-breakpoint
CREATE TYPE "public"."ssn_status" AS ENUM('valid', 'itin', 'pending', 'invalid');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'locked', 'closed');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"auth_provider_ref" text NOT NULL,
	"display_name" text,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"locale" text DEFAULT 'en-US' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "return_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" uuid NOT NULL,
	"role" "person_role" NOT NULL,
	"ordinal" smallint NOT NULL,
	"person_vault_token" uuid NOT NULL,
	"legal_first_name" text NOT NULL,
	"legal_last_name" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"is_minor" boolean NOT NULL,
	"relationship" text,
	"qualifying_child" boolean,
	"qualifying_relative" boolean,
	"ssn_status" "ssn_status",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tax_year" smallint NOT NULL,
	"kind" "return_kind" DEFAULT 'original' NOT NULL,
	"amends_return_id" uuid,
	"filing_status" "filing_status",
	"state_of_residence" char(2),
	"ruleset_id" text,
	"state" "return_state" DEFAULT 'draft' NOT NULL,
	"in_scope_decision" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"accepted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "credits_claimed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" uuid NOT NULL,
	"type" "credit_type" NOT NULL,
	"qualifying_count" smallint,
	"amount_claimed_cents" bigint,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deductions_claimed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" uuid NOT NULL,
	"type" "deduction_type" NOT NULL,
	"amount_cents" bigint NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" uuid NOT NULL,
	"type" "income_type" NOT NULL,
	"payer_name" text,
	"amount_cents" bigint NOT NULL,
	"withholding_cents" bigint DEFAULT 0 NOT NULL,
	"person_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"return_id" uuid,
	"kind" "document_kind" NOT NULL,
	"object_key" text NOT NULL,
	"bytes_size" bigint NOT NULL,
	"mime" text NOT NULL,
	"sha256" text NOT NULL,
	"virus_scan_status" text DEFAULT 'pending' NOT NULL,
	"ocr_status" text DEFAULT 'none' NOT NULL,
	"is_final" boolean DEFAULT false NOT NULL,
	"encryption_key_ref" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calculation_traces" (
	"calculation_id" uuid PRIMARY KEY NOT NULL,
	"trace" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_line_values" (
	"calculation_id" uuid NOT NULL,
	"form_id" text NOT NULL,
	"line_id" text NOT NULL,
	"value_cents" bigint,
	"value_text" text,
	"cite_pub_ref" text,
	CONSTRAINT "form_line_values_calculation_id_form_id_line_id_pk" PRIMARY KEY("calculation_id","form_id","line_id")
);
--> statement-breakpoint
CREATE TABLE "tax_calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" uuid NOT NULL,
	"tax_year" smallint NOT NULL,
	"ruleset_id" text NOT NULL,
	"engine_version" text NOT NULL,
	"inputs_hash" text NOT NULL,
	"converged" boolean NOT NULL,
	"iterations" smallint NOT NULL,
	"nonconvergence_reason" text,
	"total_income_cents" bigint,
	"agi_cents" bigint,
	"deduction_cents" bigint,
	"using_itemized" boolean,
	"taxable_income_cents" bigint,
	"tax_before_credits_cents" bigint,
	"credits_cents" bigint,
	"tax_after_credits_cents" bigint,
	"withholding_cents" bigint,
	"refund_or_due_cents" bigint,
	"marginal_rate_bp" smallint,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filing_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"filing_id" uuid NOT NULL,
	"from_state" text,
	"to_state" text NOT NULL,
	"event_kind" text NOT NULL,
	"payload" jsonb,
	"actor" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" uuid NOT NULL,
	"jurisdiction" text NOT NULL,
	"channel" "filing_channel" NOT NULL,
	"linkage" "filing_linkage" DEFAULT 'unlinked' NOT NULL,
	"state" "filing_state" DEFAULT 'built' NOT NULL,
	"submission_id" text,
	"calculation_id" uuid NOT NULL,
	"mef_payload_doc_id" uuid,
	"filed_pdf_doc_id" uuid,
	"ack_code" text,
	"reject_codes" jsonb,
	"built_at" timestamp with time zone DEFAULT now() NOT NULL,
	"transmitted_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"validated_at" timestamp with time zone,
	"acknowledged_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"actor_kind" "audit_actor_kind" NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"resource_kind" text NOT NULL,
	"resource_id" text NOT NULL,
	"accessed_pii" boolean NOT NULL,
	"purpose" text,
	"ip" "inet",
	"user_agent" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"prev_hash" text NOT NULL,
	"row_hash" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "return_people" ADD CONSTRAINT "return_people_return_id_tax_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."tax_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_returns" ADD CONSTRAINT "tax_returns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits_claimed" ADD CONSTRAINT "credits_claimed_return_id_tax_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."tax_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deductions_claimed" ADD CONSTRAINT "deductions_claimed_return_id_tax_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."tax_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_return_id_tax_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."tax_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_person_id_return_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."return_people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_return_id_tax_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."tax_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculation_traces" ADD CONSTRAINT "calculation_traces_calculation_id_tax_calculations_id_fk" FOREIGN KEY ("calculation_id") REFERENCES "public"."tax_calculations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_line_values" ADD CONSTRAINT "form_line_values_calculation_id_tax_calculations_id_fk" FOREIGN KEY ("calculation_id") REFERENCES "public"."tax_calculations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_calculations" ADD CONSTRAINT "tax_calculations_return_id_tax_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."tax_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filing_events" ADD CONSTRAINT "filing_events_filing_id_filings_id_fk" FOREIGN KEY ("filing_id") REFERENCES "public"."filings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_return_id_tax_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."tax_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_calculation_id_tax_calculations_id_fk" FOREIGN KEY ("calculation_id") REFERENCES "public"."tax_calculations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_mef_payload_doc_id_documents_id_fk" FOREIGN KEY ("mef_payload_doc_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_filed_pdf_doc_id_documents_id_fk" FOREIGN KEY ("filed_pdf_doc_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_auth_provider_ref_idx" ON "users" USING btree ("auth_provider_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "return_people_return_ordinal_uniq" ON "return_people" USING btree ("return_id","ordinal");--> statement-breakpoint
CREATE INDEX "return_people_vault_token_idx" ON "return_people" USING btree ("person_vault_token");--> statement-breakpoint
CREATE INDEX "tax_returns_user_year_idx" ON "tax_returns" USING btree ("user_id","tax_year");--> statement-breakpoint
CREATE INDEX "credits_claimed_return_idx" ON "credits_claimed" USING btree ("return_id");--> statement-breakpoint
CREATE INDEX "deductions_claimed_return_idx" ON "deductions_claimed" USING btree ("return_id");--> statement-breakpoint
CREATE INDEX "income_sources_return_idx" ON "income_sources" USING btree ("return_id");--> statement-breakpoint
CREATE INDEX "income_sources_return_type_idx" ON "income_sources" USING btree ("return_id","type");--> statement-breakpoint
CREATE INDEX "documents_user_idx" ON "documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "documents_return_idx" ON "documents" USING btree ("return_id");--> statement-breakpoint
CREATE INDEX "tax_calculations_return_time_idx" ON "tax_calculations" USING btree ("return_id","computed_at");--> statement-breakpoint
CREATE INDEX "tax_calculations_inputs_hash_idx" ON "tax_calculations" USING btree ("return_id","inputs_hash");--> statement-breakpoint
CREATE INDEX "filing_events_filing_idx" ON "filing_events" USING btree ("filing_id","at");--> statement-breakpoint
CREATE INDEX "filings_return_juris_idx" ON "filings" USING btree ("return_id","jurisdiction");--> statement-breakpoint
CREATE INDEX "filings_state_idx" ON "filings" USING btree ("state","transmitted_at");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource_kind","resource_id","at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_kind","actor_id","at");
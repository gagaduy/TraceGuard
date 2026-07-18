-- SPDX-FileCopyrightText: 2026 TraceGuard contributors
-- SPDX-License-Identifier: Apache-2.0

CREATE TABLE "audit_events" (
	"action" text NOT NULL,
	"actor_identity_id" uuid NOT NULL,
	"after_state" jsonb,
	"before_state" jsonb,
	"correlation_id" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"organization_id" uuid NOT NULL,
	CONSTRAINT "audit_events_action_nonblank" CHECK (length(trim("audit_events"."action")) > 0),
	CONSTRAINT "audit_events_correlation_nonblank" CHECK (length(trim("audit_events"."correlation_id")) > 0)
);
--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"identity_id" uuid NOT NULL,
	"key" text NOT NULL,
	"operation" text NOT NULL,
	"request_hash" text NOT NULL,
	"response_body" jsonb NOT NULL,
	"response_status" integer NOT NULL,
	CONSTRAINT "idempotency_records_identity_operation_key_unique" UNIQUE("identity_id","operation","key"),
	CONSTRAINT "idempotency_records_key_nonblank" CHECK (length(trim("idempotency_records"."key")) > 0),
	CONSTRAINT "idempotency_records_operation_nonblank" CHECK (length(trim("idempotency_records"."operation")) > 0),
	CONSTRAINT "idempotency_records_request_hash_nonblank" CHECK (length(trim("idempotency_records"."request_hash")) > 0),
	CONSTRAINT "idempotency_records_response_status_valid" CHECK ("idempotency_records"."response_status" between 200 and 599)
);
--> statement-breakpoint
CREATE TABLE "identities" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"display_name" text,
	"email" text,
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"issuer" text NOT NULL,
	"subject" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identities_issuer_subject_unique" UNIQUE("issuer","subject"),
	CONSTRAINT "identities_issuer_nonblank" CHECK (length(trim("identities"."issuer")) > 0),
	CONSTRAINT "identities_subject_nonblank" CHECK (length(trim("identities"."subject")) > 0)
);
--> statement-breakpoint
CREATE TABLE "membership_roles" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"membership_id" uuid NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "membership_roles_membership_id_role_pk" PRIMARY KEY("membership_id","role"),
	CONSTRAINT "membership_roles_role_valid" CHECK ("membership_roles"."role" in ('admin', 'quality_analyst', 'recall_coordinator', 'approver'))
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"identity_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	CONSTRAINT "organization_memberships_identity_org_unique" UNIQUE("identity_id","organization_id"),
	CONSTRAINT "organization_memberships_status_valid" CHECK ("organization_memberships"."status" = 'active')
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "row_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "time_zone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_identity_id_identities_id_fk" FOREIGN KEY ("actor_identity_id") REFERENCES "public"."identities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_membership_id_organization_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_organization_occurred_idx" ON "audit_events" USING btree ("organization_id","occurred_at");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_name_nonblank" CHECK (length(trim("organizations"."name")) > 0);--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_row_version_positive" CHECK ("organizations"."row_version" > 0);--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_slug_normalized" CHECK ("organizations"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_time_zone_nonblank" CHECK (length(trim("organizations"."time_zone")) > 0);

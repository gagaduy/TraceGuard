-- SPDX-FileCopyrightText: 2026 TraceGuard contributors
-- SPDX-License-Identifier: Apache-2.0

CREATE TABLE "organizations" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);

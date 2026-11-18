CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"instruction" text NOT NULL,
	"original_name" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"status" text NOT NULL,
	"analysis" text,
	"failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "documents_size_bytes_positive_check" CHECK ("documents"."size_bytes" > 0),
	CONSTRAINT "documents_status_check" CHECK ("documents"."status" in ('processing', 'completed', 'failed')),
	CONSTRAINT "documents_completed_analysis_check" CHECK (("documents"."status" = 'completed' and "documents"."analysis" is not null and btrim("documents"."analysis") <> '') or ("documents"."status" <> 'completed' and "documents"."analysis" is null))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_active_at" timestamp with time zone NOT NULL,
	"mfa" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"google_sub" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_user_id_created_at_idx" ON "documents" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");
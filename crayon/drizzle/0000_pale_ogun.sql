CREATE TABLE "comments" (
	"uri" text PRIMARY KEY NOT NULL,
	"cid" text NOT NULL,
	"did" text NOT NULL,
	"rkey" text NOT NULL,
	"subject_uri" text NOT NULL,
	"subject_cid" text NOT NULL,
	"parent_uri" text,
	"parent_cid" text,
	"comment" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text,
	"indexed_at" bigint NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"uri" text PRIMARY KEY NOT NULL,
	"cid" text NOT NULL,
	"did" text NOT NULL,
	"rkey" text NOT NULL,
	"subject_did" text NOT NULL,
	"created_at" text NOT NULL,
	"indexed_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"recipient_did" text NOT NULL,
	"reason" text NOT NULL,
	"subject_uri" text NOT NULL,
	"record_uri" text NOT NULL,
	"actor_did" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"did" text PRIMARY KEY NOT NULL,
	"description" text,
	"created_at" text NOT NULL,
	"cid" text NOT NULL,
	"indexed_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"uri" text PRIMARY KEY NOT NULL,
	"cid" text NOT NULL,
	"did" text NOT NULL,
	"rkey" text NOT NULL,
	"subject_uri" text NOT NULL,
	"subject_cid" text NOT NULL,
	"rating" integer NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text,
	"indexed_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userstyles" (
	"rowid" bigserial NOT NULL,
	"uri" text PRIMARY KEY NOT NULL,
	"cid" text NOT NULL,
	"did" text NOT NULL,
	"rkey" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"license" text,
	"upstream_url" text,
	"homepage_url" text,
	"ignore_update_url" boolean DEFAULT false NOT NULL,
	"source_code_cid" text NOT NULL,
	"preview_image_cid" text,
	"created_at" text NOT NULL,
	"updated_at" text,
	"indexed_at" bigint NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(description, '')), 'B')) STORED,
	"moz_document_rules" jsonb,
	"user_css_vars" integer,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"rating_sum" integer DEFAULT 0 NOT NULL,
	"popularity" integer GENERATED ALWAYS AS (comment_count + rating_count) STORED
);
--> statement-breakpoint
CREATE INDEX "comments_subject_idx" ON "comments" USING btree ("subject_uri");--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parent_uri");--> statement-breakpoint
CREATE INDEX "comments_did_idx" ON "comments" USING btree ("did");--> statement-breakpoint
CREATE INDEX "follows_did_idx" ON "follows" USING btree ("did","indexed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "follows_subject_did_idx" ON "follows" USING btree ("subject_did","indexed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_recipient_idx" ON "notifications" USING btree ("recipient_did","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_record_recipient_idx" ON "notifications" USING btree ("record_uri","recipient_did");--> statement-breakpoint
CREATE INDEX "ratings_subject_did_rkey_idx" ON "ratings" USING btree ("subject_uri","did","rkey" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "ratings_did_idx" ON "ratings" USING btree ("did");--> statement-breakpoint
CREATE INDEX "userstyles_did_idx" ON "userstyles" USING btree ("did");--> statement-breakpoint
CREATE INDEX "userstyles_indexed_at_idx" ON "userstyles" USING btree ("indexed_at");--> statement-breakpoint
CREATE INDEX "userstyles_homepage_idx" ON "userstyles" USING btree ("homepage_url");--> statement-breakpoint
CREATE INDEX "userstyles_upstream_idx" ON "userstyles" USING btree ("upstream_url");--> statement-breakpoint
CREATE INDEX "userstyles_search_idx" ON "userstyles" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "userstyles_popularity_idx" ON "userstyles" USING btree ("popularity");
CREATE TABLE "list_items" (
	"uri" text PRIMARY KEY NOT NULL,
	"cid" text NOT NULL,
	"did" text NOT NULL,
	"rkey" text NOT NULL,
	"list_uri" text NOT NULL,
	"subject_uri" text NOT NULL,
	"subject_cid" text NOT NULL,
	"created_at" text NOT NULL,
	"indexed_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"uri" text PRIMARY KEY NOT NULL,
	"cid" text NOT NULL,
	"did" text NOT NULL,
	"rkey" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"item_count" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text,
	"indexed_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "list_items_list_subject_idx" ON "list_items" USING btree ("list_uri","subject_uri");--> statement-breakpoint
CREATE INDEX "list_items_list_indexed_idx" ON "list_items" USING btree ("list_uri","indexed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "list_items_subject_did_idx" ON "list_items" USING btree ("subject_uri","did");--> statement-breakpoint
CREATE INDEX "lists_did_idx" ON "lists" USING btree ("did","indexed_at" DESC NULLS LAST);
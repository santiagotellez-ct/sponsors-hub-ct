import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sponsors_event_participations_meetings_status" AS ENUM('pending', 'scheduled', 'completed');
  CREATE TYPE "public"."enum_sponsors_event_participations_deliverables_type" AS ENUM('document', 'image', 'text', 'link', 'direct');
  CREATE TYPE "public"."enum_sponsors_event_participations_deliverables_status" AS ENUM('pending', 'completed', 'overdue');
  CREATE TYPE "public"."enum_sponsors_event_participations_benefit_items_evidences_type" AS ENUM('image', 'document', 'text', 'link');
  CREATE TYPE "public"."enum_sponsors_event_participations_benefit_items_status" AS ENUM('not_started', 'in_progress', 'completed');
  CREATE TYPE "public"."enum_plans_benefits_deliverables_type" AS ENUM('document', 'image', 'text', 'link', 'direct');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "sponsors_documents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"file_id" integer
  );
  
  CREATE TABLE "sponsors_event_participations_meetings" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"projected_month" varchar,
  	"calendly_link" varchar,
  	"platform" varchar,
  	"status" "enum_sponsors_event_participations_meetings_status" DEFAULT 'pending',
  	"scheduled_date" timestamp(3) with time zone
  );
  
  CREATE TABLE "sponsors_event_participations_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"benefit_category" varchar,
  	"item_name" varchar,
  	"type" "enum_sponsors_event_participations_deliverables_type",
  	"status" "enum_sponsors_event_participations_deliverables_status" DEFAULT 'pending',
  	"due_date" timestamp(3) with time zone,
  	"uploaded_file_id" integer,
  	"uploaded_text" varchar,
  	"uploaded_link" varchar
  );
  
  CREATE TABLE "sponsors_event_participations_benefit_items_evidences" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_sponsors_event_participations_benefit_items_evidences_type" NOT NULL,
  	"file_id" integer,
  	"text" varchar,
  	"link" varchar
  );
  
  CREATE TABLE "sponsors_event_participations_benefit_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"benefit_category" varchar,
  	"item_name" varchar,
  	"status" "enum_sponsors_event_participations_benefit_items_status" DEFAULT 'not_started'
  );
  
  CREATE TABLE "sponsors_event_participations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"is_current" boolean DEFAULT false,
  	"event_id" integer NOT NULL,
  	"plan_id" integer NOT NULL,
  	"strategy_description" varchar,
  	"strategy_event_objectives" varchar,
  	"strategy_brand_differentiator" varchar
  );
  
  CREATE TABLE "sponsors_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "sponsors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"events_summary" varchar,
  	"current_plan_name" varchar,
  	"company_name" varchar NOT NULL,
  	"logo_id" integer,
  	"contact_info_full_name" varchar,
  	"contact_info_whatsapp" varchar,
  	"contact_info_corporate_email" varchar,
  	"contact_info_linkedin" varchar,
  	"whatsapp_group_link" varchar,
  	"whatsapp_group_joined" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "events_journey_moments_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_title" varchar NOT NULL,
  	"date1" timestamp(3) with time zone NOT NULL,
  	"date2" timestamp(3) with time zone
  );
  
  CREATE TABLE "events_journey_moments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"moment_title" varchar NOT NULL
  );
  
  CREATE TABLE "events_meeting_templates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"projected_month" varchar,
  	"calendly_link" varchar,
  	"platform" varchar
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"logo_id" integer,
  	"background_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "plans_benefits_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"deliverable_name" varchar,
  	"type" "enum_plans_benefits_deliverables_type",
  	"due_date" timestamp(3) with time zone
  );
  
  CREATE TABLE "plans_benefits_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_name" varchar NOT NULL
  );
  
  CREATE TABLE "plans_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"benefit_name" varchar NOT NULL,
  	"has_deliverable" boolean DEFAULT false
  );
  
  CREATE TABLE "plans" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"addons_discount" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"sponsors_id" integer,
  	"events_id" integer,
  	"plans_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"sponsors_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sponsors_documents" ADD CONSTRAINT "sponsors_documents_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sponsors_documents" ADD CONSTRAINT "sponsors_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sponsors_event_participations_meetings" ADD CONSTRAINT "sponsors_event_participations_meetings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sponsors_event_participations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sponsors_event_participations_deliverables" ADD CONSTRAINT "sponsors_event_participations_deliverables_uploaded_file_id_media_id_fk" FOREIGN KEY ("uploaded_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sponsors_event_participations_deliverables" ADD CONSTRAINT "sponsors_event_participations_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sponsors_event_participations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sponsors_event_participations_benefit_items_evidences" ADD CONSTRAINT "sponsors_event_participations_benefit_items_evidences_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sponsors_event_participations_benefit_items_evidences" ADD CONSTRAINT "sponsors_event_participations_benefit_items_evidences_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sponsors_event_participations_benefit_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sponsors_event_participations_benefit_items" ADD CONSTRAINT "sponsors_event_participations_benefit_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sponsors_event_participations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sponsors_event_participations" ADD CONSTRAINT "sponsors_event_participations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sponsors_event_participations" ADD CONSTRAINT "sponsors_event_participations_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sponsors_event_participations" ADD CONSTRAINT "sponsors_event_participations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sponsors_sessions" ADD CONSTRAINT "sponsors_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_journey_moments_items" ADD CONSTRAINT "events_journey_moments_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_journey_moments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_journey_moments" ADD CONSTRAINT "events_journey_moments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_meeting_templates" ADD CONSTRAINT "events_meeting_templates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "plans_benefits_deliverables" ADD CONSTRAINT "plans_benefits_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."plans_benefits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "plans_benefits_items" ADD CONSTRAINT "plans_benefits_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."plans_benefits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "plans_benefits" ADD CONSTRAINT "plans_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sponsors_fk" FOREIGN KEY ("sponsors_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_plans_fk" FOREIGN KEY ("plans_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_sponsors_fk" FOREIGN KEY ("sponsors_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "sponsors_documents_order_idx" ON "sponsors_documents" USING btree ("_order");
  CREATE INDEX "sponsors_documents_parent_id_idx" ON "sponsors_documents" USING btree ("_parent_id");
  CREATE INDEX "sponsors_documents_file_idx" ON "sponsors_documents" USING btree ("file_id");
  CREATE INDEX "sponsors_event_participations_meetings_order_idx" ON "sponsors_event_participations_meetings" USING btree ("_order");
  CREATE INDEX "sponsors_event_participations_meetings_parent_id_idx" ON "sponsors_event_participations_meetings" USING btree ("_parent_id");
  CREATE INDEX "sponsors_event_participations_deliverables_order_idx" ON "sponsors_event_participations_deliverables" USING btree ("_order");
  CREATE INDEX "sponsors_event_participations_deliverables_parent_id_idx" ON "sponsors_event_participations_deliverables" USING btree ("_parent_id");
  CREATE INDEX "sponsors_event_participations_deliverables_uploaded_file_idx" ON "sponsors_event_participations_deliverables" USING btree ("uploaded_file_id");
  CREATE INDEX "sponsors_event_participations_benefit_items_evidences_order_idx" ON "sponsors_event_participations_benefit_items_evidences" USING btree ("_order");
  CREATE INDEX "sponsors_event_participations_benefit_items_evidences_parent_id_idx" ON "sponsors_event_participations_benefit_items_evidences" USING btree ("_parent_id");
  CREATE INDEX "sponsors_event_participations_benefit_items_evidences_fi_idx" ON "sponsors_event_participations_benefit_items_evidences" USING btree ("file_id");
  CREATE INDEX "sponsors_event_participations_benefit_items_order_idx" ON "sponsors_event_participations_benefit_items" USING btree ("_order");
  CREATE INDEX "sponsors_event_participations_benefit_items_parent_id_idx" ON "sponsors_event_participations_benefit_items" USING btree ("_parent_id");
  CREATE INDEX "sponsors_event_participations_order_idx" ON "sponsors_event_participations" USING btree ("_order");
  CREATE INDEX "sponsors_event_participations_parent_id_idx" ON "sponsors_event_participations" USING btree ("_parent_id");
  CREATE INDEX "sponsors_event_participations_event_idx" ON "sponsors_event_participations" USING btree ("event_id");
  CREATE INDEX "sponsors_event_participations_plan_idx" ON "sponsors_event_participations" USING btree ("plan_id");
  CREATE INDEX "sponsors_sessions_order_idx" ON "sponsors_sessions" USING btree ("_order");
  CREATE INDEX "sponsors_sessions_parent_id_idx" ON "sponsors_sessions" USING btree ("_parent_id");
  CREATE INDEX "sponsors_logo_idx" ON "sponsors" USING btree ("logo_id");
  CREATE INDEX "sponsors_updated_at_idx" ON "sponsors" USING btree ("updated_at");
  CREATE INDEX "sponsors_created_at_idx" ON "sponsors" USING btree ("created_at");
  CREATE UNIQUE INDEX "sponsors_email_idx" ON "sponsors" USING btree ("email");
  CREATE INDEX "events_journey_moments_items_order_idx" ON "events_journey_moments_items" USING btree ("_order");
  CREATE INDEX "events_journey_moments_items_parent_id_idx" ON "events_journey_moments_items" USING btree ("_parent_id");
  CREATE INDEX "events_journey_moments_order_idx" ON "events_journey_moments" USING btree ("_order");
  CREATE INDEX "events_journey_moments_parent_id_idx" ON "events_journey_moments" USING btree ("_parent_id");
  CREATE INDEX "events_meeting_templates_order_idx" ON "events_meeting_templates" USING btree ("_order");
  CREATE INDEX "events_meeting_templates_parent_id_idx" ON "events_meeting_templates" USING btree ("_parent_id");
  CREATE INDEX "events_logo_idx" ON "events" USING btree ("logo_id");
  CREATE INDEX "events_background_image_idx" ON "events" USING btree ("background_image_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "plans_benefits_deliverables_order_idx" ON "plans_benefits_deliverables" USING btree ("_order");
  CREATE INDEX "plans_benefits_deliverables_parent_id_idx" ON "plans_benefits_deliverables" USING btree ("_parent_id");
  CREATE INDEX "plans_benefits_items_order_idx" ON "plans_benefits_items" USING btree ("_order");
  CREATE INDEX "plans_benefits_items_parent_id_idx" ON "plans_benefits_items" USING btree ("_parent_id");
  CREATE INDEX "plans_benefits_order_idx" ON "plans_benefits" USING btree ("_order");
  CREATE INDEX "plans_benefits_parent_id_idx" ON "plans_benefits" USING btree ("_parent_id");
  CREATE INDEX "plans_updated_at_idx" ON "plans" USING btree ("updated_at");
  CREATE INDEX "plans_created_at_idx" ON "plans" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_sponsors_id_idx" ON "payload_locked_documents_rels" USING btree ("sponsors_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("plans_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_rels_sponsors_id_idx" ON "payload_preferences_rels" USING btree ("sponsors_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "sponsors_documents" CASCADE;
  DROP TABLE "sponsors_event_participations_meetings" CASCADE;
  DROP TABLE "sponsors_event_participations_deliverables" CASCADE;
  DROP TABLE "sponsors_event_participations_benefit_items_evidences" CASCADE;
  DROP TABLE "sponsors_event_participations_benefit_items" CASCADE;
  DROP TABLE "sponsors_event_participations" CASCADE;
  DROP TABLE "sponsors_sessions" CASCADE;
  DROP TABLE "sponsors" CASCADE;
  DROP TABLE "events_journey_moments_items" CASCADE;
  DROP TABLE "events_journey_moments" CASCADE;
  DROP TABLE "events_meeting_templates" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "plans_benefits_deliverables" CASCADE;
  DROP TABLE "plans_benefits_items" CASCADE;
  DROP TABLE "plans_benefits" CASCADE;
  DROP TABLE "plans" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_sponsors_event_participations_meetings_status";
  DROP TYPE "public"."enum_sponsors_event_participations_deliverables_type";
  DROP TYPE "public"."enum_sponsors_event_participations_deliverables_status";
  DROP TYPE "public"."enum_sponsors_event_participations_benefit_items_evidences_type";
  DROP TYPE "public"."enum_sponsors_event_participations_benefit_items_status";
  DROP TYPE "public"."enum_plans_benefits_deliverables_type";`)
}

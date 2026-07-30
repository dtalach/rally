CREATE TABLE "holdings" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"symbol" text NOT NULL,
	"shares" numeric(18, 6) NOT NULL,
	"cost_basis" numeric(16, 2) NOT NULL,
	CONSTRAINT "holdings_player_symbol" UNIQUE("player_id","symbol")
);
--> statement-breakpoint
CREATE TABLE "instruments" (
	"symbol" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"sector" text NOT NULL,
	"blurb" text NOT NULL,
	"badge" text NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"symbol" text NOT NULL,
	"side" text NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"shares" numeric(18, 6) NOT NULL,
	"price" numeric(16, 4) NOT NULL,
	"filled_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"name" text NOT NULL,
	"initials" text NOT NULL,
	"pin_hash" text NOT NULL,
	"cash" numeric(16, 2) NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"symbol" text PRIMARY KEY NOT NULL,
	"price" numeric(16, 4) NOT NULL,
	"prev_close" numeric(16, 4) NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"as_of" date NOT NULL,
	"total_value" numeric(16, 2) NOT NULL,
	"seeded" text DEFAULT 'false' NOT NULL,
	CONSTRAINT "snapshot_player_day" UNIQUE("player_id","as_of")
);
--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_symbol_instruments_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."instruments"("symbol") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_player_idx" ON "orders" USING btree ("player_id","filled_at");
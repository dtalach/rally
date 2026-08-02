-- Real price history for the stock chart, appended on every quote refresh.
CREATE TABLE IF NOT EXISTS "price_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"price" numeric(16, 4) NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_history_symbol_idx" ON "price_history" USING btree ("symbol","at");

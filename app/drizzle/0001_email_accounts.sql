-- Real accounts: email + password instead of a picked test handle and a PIN.
--
-- Hand-written rather than generated, because it has to clear the seeded test
-- crew before `email` can be NOT NULL — and it has to do that exactly once.
-- The DO block keys off `pin_hash` still existing, so re-running setup after a
-- real account exists is a no-op instead of a wipe.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'pin_hash'
  ) THEN
    DELETE FROM "players";
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "email" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "password_hash" text;--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "password_hash" SET NOT NULL;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_email_unique') THEN
    ALTER TABLE "players" ADD CONSTRAINT "players_email_unique" UNIQUE ("email");
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN IF EXISTS "handle";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN IF EXISTS "pin_hash";

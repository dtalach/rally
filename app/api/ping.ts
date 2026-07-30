/**
 * The smallest possible function: no imports, no database, no dependencies.
 *
 * It exists to split one question into two. If /api/ping answers but
 * /api/health crashes, the platform is fine and the fault is in the app's
 * import graph. If /api/ping crashes too, functions aren't running at all and
 * the fault is in the build or project configuration.
 *
 * It also reports which environment variables are present — names only, never
 * values — which is the other thing you need to know on a fresh deployment.
 */
export default function handler(
  _req: unknown,
  res: { status: (code: number) => { json: (body: unknown) => void } }
) {
  res.status(200).json({
    ok: true,
    node: process.version,
    region: process.env.VERCEL_REGION ?? null,
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
      FINNHUB_API_KEY: Boolean(process.env.FINNHUB_API_KEY),
      SETUP_TOKEN: Boolean(process.env.SETUP_TOKEN),
    },
  });
}

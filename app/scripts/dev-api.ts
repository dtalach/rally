/**
 * Runs the `api/` folder locally.
 *
 * On Vercel each file in `api/` becomes a serverless function. This is a thin
 * shim that mounts the exact same handlers on a Node server so `npm run dev`
 * and local verification exercise the real code, not a parallel implementation.
 *
 *   DATABASE_URL=... SESSION_SECRET=... npm run dev:api
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const PORT = Number(process.env.API_PORT ?? 3001);
const API_DIR = join(import.meta.dirname, "..", "api");

type Handler = (req: any, res: any) => Promise<void> | void;

const routes = new Map<string, Handler>();

for (const file of readdirSync(API_DIR)) {
  if (!file.endsWith(".ts") || file.startsWith("_")) continue;
  const name = file.replace(/\.ts$/, "");
  const mod = await import(join(API_DIR, file));
  routes.set(`/api/${name}`, mod.default);
}

console.log(`api routes: ${[...routes.keys()].sort().join(", ")}`);

function shimResponse(res: ServerResponse) {
  const shim = {
    statusCode: 200,
    writableEnded: false,
    setHeader: (k: string, v: string) => res.setHeader(k, v),
    status(code: number) {
      shim.statusCode = code;
      return shim;
    },
    json(body: unknown) {
      shim.writableEnded = true;
      res.writeHead(shim.statusCode, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
      return shim;
    },
  };
  return shim;
}

createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const handler = routes.get(url.pathname);

  if (!handler) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: `No route ${url.pathname}` }));
    return;
  }

  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString();

  let body: unknown = undefined;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Body must be JSON." }));
      return;
    }
  }

  const cookies = Object.fromEntries(
    (req.headers.cookie ?? "")
      .split(";")
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf("=");
        return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
      })
  );

  const shimReq = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: Object.fromEntries(url.searchParams),
    cookies,
    body,
  };

  await handler(shimReq, shimResponse(res));
}).listen(PORT, () => console.log(`api listening on http://localhost:${PORT}`));

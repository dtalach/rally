import { route } from "./_lib/http";
import { clear } from "./_lib/session";

export default route("POST", async (_req, res) => {
  clear(res);
  return { ok: true };
});

import { route } from "./_lib/http.js";
import { clear } from "./_lib/session.js";

export default route("POST", async (_req, res) => {
  clear(res);
  return { ok: true };
});

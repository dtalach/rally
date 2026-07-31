import { type ReactNode } from "react";
import { SessionContext } from "./sessionContext";
import type { Player } from "./api";

/** Publishes the signed-in player, so any screen can show their own face. */
export function SessionProvider({ player, children }: { player: Player; children: ReactNode }) {
  return <SessionContext.Provider value={player}>{children}</SessionContext.Provider>;
}

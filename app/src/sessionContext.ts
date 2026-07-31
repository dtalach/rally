import { createContext } from "react";
import type { Player } from "./api";

/**
 * Who's signed in.
 *
 * The design gallery renders the same components with no provider around them,
 * so `null` has to be a working value — components fall back to their
 * design-frame defaults rather than assuming a session.
 */
export const SessionContext = createContext<Player | null>(null);

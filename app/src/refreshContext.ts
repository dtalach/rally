import { createContext } from "react";

/** Set by the app shell; consumed by the scroll surface to arm pull-to-refresh. */
export const RefreshContext = createContext<(() => void) | null>(null);

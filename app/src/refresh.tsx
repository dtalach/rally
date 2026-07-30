import { type ReactNode } from "react";
import { RefreshContext } from "./refreshContext";

/**
 * Pull-to-refresh plumbing.
 *
 * The gesture belongs to the scroll surface (`Screen`), but the thing it
 * refreshes is owned by the app shell. Rather than thread a callback through
 * nine screens that don't otherwise care, the shell publishes it here and the
 * scroll surface picks it up.
 */
export function RefreshProvider({
  onRefresh,
  children,
}: {
  onRefresh: () => void;
  children: ReactNode;
}) {
  return <RefreshContext.Provider value={onRefresh}>{children}</RefreshContext.Provider>;
}

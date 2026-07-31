import { useContext } from "react";
import { SessionContext } from "./sessionContext";

export const useSession = () => useContext(SessionContext);

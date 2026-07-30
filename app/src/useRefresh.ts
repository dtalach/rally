import { useContext } from "react";
import { RefreshContext } from "./refreshContext";

export const useRefresh = () => useContext(RefreshContext);

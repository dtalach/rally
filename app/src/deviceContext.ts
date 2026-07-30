import { createContext } from "react";

/** True when the app is running on a real phone rather than in the desktop bezel. */
export const DeviceContext = createContext(false);

import { useContext } from "react";
import { DeviceContext } from "./deviceContext";

/** True when the app is running on a real phone rather than in the desktop bezel. */
export const useDeviceMode = () => useContext(DeviceContext);

import { useEffect, useState, type ReactNode } from "react";
import { DeviceContext } from "./deviceContext";

/* ---------------------------------------------------------------------------
   Device mode.

   On a desktop the app draws its own phone — bezel, notch, fake status bar —
   because that's how the design is reviewed. On a real phone all of that is
   wrong: the hardware already provides it, and a drawn bezel inside the screen
   just wastes the screen. So the frame chrome switches off and the app fills
   the viewport, respecting the safe areas around the notch and home indicator.
--------------------------------------------------------------------------- */

const isPhoneViewport = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own standalone flag, which predates display-mode.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.matchMedia("(max-width: 520px)").matches);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState(isPhoneViewport);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 520px)");
    const update = () => setDevice(isPhoneViewport());
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>;
}

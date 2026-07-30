import { useCallback, useEffect, useState } from "react";

/* ---------------------------------------------------------------------------
   Shake to rattle the coin jar.

   The constraint that shapes this: since iOS 13, `devicemotion` requires
   `DeviceMotionEvent.requestPermission()`, and that call is only honoured
   inside a user gesture. So this can't be switched on quietly at boot — it
   needs a control the player taps, which is why it lives in the profile sheet
   alongside the sound toggle. Permission then persists per-origin.

   Everywhere else (Android, desktop) there's no permission gate and the
   listener attaches directly.
--------------------------------------------------------------------------- */

const ENABLED_KEY = "rally.shake";

/** iOS 13+ adds requestPermission; the type isn't in lib.dom. */
type MotionCtor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

const motionCtor = () =>
  (typeof DeviceMotionEvent !== "undefined" ? DeviceMotionEvent : undefined) as
    | MotionCtor
    | undefined;

export const shakeSupported = () =>
  typeof window !== "undefined" && typeof DeviceMotionEvent !== "undefined";

export const needsPermission = () => typeof motionCtor()?.requestPermission === "function";

const stored = () => {
  try {
    return localStorage.getItem(ENABLED_KEY) === "1";
  } catch {
    return false;
  }
};

const store = (on: boolean) => {
  try {
    localStorage.setItem(ENABLED_KEY, on ? "1" : "0");
  } catch {
    /* preference just won't persist */
  }
};

/* Tuned for "aggressively", not a jostle in a pocket: three hard direction
   changes inside a second. Frame-to-frame delta is used rather than raw
   magnitude so constant gravity cancels out. */
const JOLT = 28;
const HITS_NEEDED = 3;
const WINDOW_MS = 1000;
const COOLDOWN_MS = 2500;

export type ShakeState = "unsupported" | "off" | "on" | "denied" | "no-response";

/** Running from the home screen rather than a Safari tab. */
export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true);

/**
 * Calls `onShake` when the device is shaken hard. Returns the current state
 * and an `enable` you must call from a tap handler.
 */
export function useShake(onShake: () => void) {
  const [state, setState] = useState<ShakeState>(() =>
    !shakeSupported() ? "unsupported" : stored() ? "on" : "off"
  );

  const enable = useCallback(async () => {
    if (!shakeSupported()) return;

    const ctor = motionCtor();
    if (typeof ctor?.requestPermission === "function") {
      try {
        // WebKit has a long history of this prompt never appearing — and the
        // promise never settling — when the app runs standalone from the home
        // screen. A hung promise would leave the toggle doing nothing at all,
        // so treat silence as its own answer and say so in the UI.
        const result = await Promise.race([
          ctor.requestPermission(),
          new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 3000)),
        ]);
        if (result === "timeout") {
          setState("no-response");
          return;
        }
        if (result !== "granted") {
          setState("denied");
          return;
        }
      } catch {
        // Thrown when not called from a gesture, or the prompt was dismissed.
        setState("denied");
        return;
      }
    }
    store(true);
    setState("on");
  }, []);

  const disable = useCallback(() => {
    store(false);
    setState("off");
  }, []);

  useEffect(() => {
    if (state !== "on") return;

    let last: { x: number; y: number; z: number } | null = null;
    let hits: number[] = [];
    let mutedUntil = 0;

    const handle = (e: DeviceMotionEvent) => {
      // accelerationIncludingGravity is the one reliably populated across
      // devices; `acceleration` is null on plenty of hardware.
      const a = e.accelerationIncludingGravity;
      if (!a || a.x === null || a.y === null || a.z === null) return;

      const now = Date.now();
      const cur = { x: a.x, y: a.y, z: a.z };

      if (last) {
        const delta = Math.abs(cur.x - last.x) + Math.abs(cur.y - last.y) + Math.abs(cur.z - last.z);
        if (delta > JOLT) {
          hits = hits.filter((t) => now - t < WINDOW_MS);
          hits.push(now);
          if (hits.length >= HITS_NEEDED && now > mutedUntil) {
            mutedUntil = now + COOLDOWN_MS;
            hits = [];
            onShake();
          }
        }
      }
      last = cur;
    };

    window.addEventListener("devicemotion", handle);
    return () => window.removeEventListener("devicemotion", handle);
  }, [state, onShake]);

  return { state, enable, disable };
}

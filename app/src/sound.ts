import coinsUrl from "./assets/coins.mp3";
import shakeUrl from "./assets/shake.mp3";

/* ---------------------------------------------------------------------------
   Sound.

   Two samples, each tied to a moment the arcade design already implies:
   coins landing when an order fills, and a jar of coins rattling when you
   shake the phone.

   Two things make audio awkward on iOS, and both are handled here:

   1. Audio only plays inside a user gesture. A fill's sound happens after the
      network round-trip, which is outside that window — so every element is
      primed on the first tap anywhere in the app, after which programmatic
      playback is allowed.
   2. An app that makes noise with no way to stop it is an app people mute at
      the OS level and never unmute. The preference lives in localStorage and
      is honoured before anything is played.
--------------------------------------------------------------------------- */

const MUTE_KEY = "rally.muted";

type Name = "fill" | "shake";

const SOURCES: Record<Name, string> = { fill: coinsUrl, shake: shakeUrl };
const VOLUME: Record<Name, number> = {
  // Loud enough to register as a reward, quiet enough not to startle.
  fill: 0.55,
  // The shake is deliberate and self-inflicted, so it can be louder.
  shake: 0.7,
};

const elements = new Map<Name, HTMLAudioElement>();
let primed = false;
let priming = false;

function audio(name: Name) {
  let el = elements.get(name);
  if (!el) {
    el = new Audio(SOURCES[name]);
    el.preload = "auto";
    el.volume = VOLUME[name];
    elements.set(name, el);
  }
  return el;
}

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Private mode or storage disabled — the preference just won't persist.
  }
}

/**
 * Unlock playback on the first real interaction. Each element plays muted and
 * immediately pauses, which satisfies iOS's gesture requirement without the
 * player hearing anything. Keeps listening until it succeeds, then detaches.
 */
function prime() {
  // pointerdown and touchend can both fire for one tap. Without this guard the
  // second call captures the muted state the first one set, then "restores" it
  // — leaving elements permanently muted and every sound silent.
  if (primed || priming) return;
  priming = true;

  const all = (Object.keys(SOURCES) as Name[]).map((n) => audio(n));
  Promise.allSettled(
    all.map((a) => {
      a.muted = true;
      return a.play().then(() => {
        a.pause();
        a.currentTime = 0;
      });
    })
  )
    .then((results) => {
      if (results.every((r) => r.status === "fulfilled")) {
        primed = true;
        detach();
      }
    })
    .finally(() => {
      priming = false;
      for (const a of all) a.muted = false;
    });
}

function detach() {
  document.removeEventListener("pointerdown", prime);
  document.removeEventListener("touchend", prime);
}

export function listenForFirstGesture() {
  document.addEventListener("pointerdown", prime);
  document.addEventListener("touchend", prime);
}

/** Never throws — a silent failure beats a broken trade. */
function play(name: Name) {
  if (isMuted()) return;
  const a = audio(name);
  try {
    // Never trust inherited state — priming leaves these elements shared.
    a.muted = false;
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {
    // Some browsers throw on currentTime before metadata loads; not worth caring.
  }
}

export const playFill = () => play("fill");
export const playShake = () => play("shake");

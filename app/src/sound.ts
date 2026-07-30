import coinsUrl from "./assets/coins.mp3";

/* ---------------------------------------------------------------------------
   Sound.

   One sound, for one event: coins clinking when an order fills. The arcade
   design has been asking for it since the coin drop, and a fill is the only
   moment in the app where something is genuinely *won*.

   Two things make this awkward on iOS, and both are handled here:

   1. Audio only plays inside a user gesture. A fill's sound happens after the
      network round-trip, which is outside that window — so the element is
      primed on the first tap anywhere in the app, after which programmatic
      playback is allowed.
   2. An app that makes noise with no way to stop it is an app people mute at
      the OS level and never unmute. The preference lives in localStorage and
      is honoured before anything is played.
--------------------------------------------------------------------------- */

const MUTE_KEY = "rally.muted";

let el: HTMLAudioElement | null = null;
let primed = false;
let priming = false;

function audio() {
  if (!el) {
    el = new Audio(coinsUrl);
    el.preload = "auto";
    // Loud enough to register as a reward, quiet enough not to startle.
    el.volume = 0.55;
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
 * Unlock playback on the first real interaction. Plays muted and immediately
 * pauses, which satisfies iOS's gesture requirement without the player hearing
 * anything. Keeps listening until it succeeds, then detaches.
 */
function prime() {
  // pointerdown and touchend can both fire for one tap. Without this guard the
  // second call captures the muted state the first one set, then "restores" it
  // — leaving the element permanently muted and every fill silent.
  if (primed || priming) return;
  priming = true;

  const a = audio();
  a.muted = true;
  a.play()
    .then(() => {
      a.pause();
      a.currentTime = 0;
      primed = true;
      detach();
    })
    .catch(() => {
      // Gesture wasn't accepted; leave the listeners attached and try again.
    })
    .finally(() => {
      priming = false;
      a.muted = false;
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

/** The fill sound. Never throws — a silent failure beats a broken trade. */
export function playFill() {
  if (isMuted()) return;
  const a = audio();
  try {
    // Never trust inherited state — priming leaves this element shared.
    a.muted = false;
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {
    // Some browsers throw on currentTime before metadata loads; not worth caring.
  }
}

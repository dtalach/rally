/**
 * Money helpers. Everything crossing the database boundary is a decimal string;
 * everything crossing the API boundary to the client is a number of dollars or
 * a preformatted display string. Rounding happens once, here.
 */

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

export const toNum = (v: string | number | null | undefined) =>
  v === null || v === undefined ? 0 : typeof v === "number" ? v : Number(v);

/** "$1,140,230" — whole dollars, which is how every figure in the design reads. */
export function usd(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/** "$1.14M" for the compact stack figures on the race rows. */
export function usdCompact(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) {
    const k = Math.round(n / 1000);
    // $999,999 rounds to 1000K, which is a millionth of a dollar short of the
    // M branch and reads like a bug. Promote it.
    if (Math.abs(k) >= 1000) return `$${(k / 1000).toFixed(2)}M`;
    return `$${k}K`;
  }
  return usd(n);
}

/** "+14.4%" / "−0.9%" — note the real minus sign, matching the design. */
export function pct(fraction: number, places = 1) {
  const p = fraction * 100;
  const sign = p >= 0 ? "+" : "−";
  return `${sign}${Math.abs(p).toFixed(places)}%`;
}

/** "+$3,420" / "−$1,204" */
export function signedUsd(n: number) {
  return `${n >= 0 ? "+" : "−"}$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
}

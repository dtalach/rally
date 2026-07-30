/**
 * One palette logic, applied everywhere:
 *   cyan = you · magenta = rival · green = gains · gold = rewards
 * `ice` is the pale cyan used for silver-tier and secondary medals.
 */
export type Role = "cyan" | "magenta" | "green" | "gold" | "ice";

export const ROLE: Record<Role, { base: string; rgb: string; text: string }> = {
  cyan: { base: "#22f7ff", rgb: "34,247,255", text: "#9df4ff" },
  magenta: { base: "#ff2bd6", rgb: "255,43,214", text: "#ff2bd6" },
  green: { base: "#39ff14", rgb: "57,255,20", text: "#39ff14" },
  gold: { base: "#ffe600", rgb: "255,230,0", text: "#ffe600" },
  ice: { base: "#9df4ff", rgb: "157,244,255", text: "#9df4ff" },
};

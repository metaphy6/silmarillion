import type { Match } from "./types";

/** Offers stay in each party's map; only matching mutual consent makes a treaty.
 * Cross-era sandbox defaults to hostility and either party can revoke consent. */
export function effectiveRelation(
  s: Match,
  a: string,
  b: string,
): "war" | "peace" | "alliance" {
  if (a === b) return "alliance";
  const left = s.players[a]?.relations[b];
  const right = s.players[b]?.relations[a];
  return left === right && (left === "peace" || left === "alliance")
    ? left
    : "war";
}

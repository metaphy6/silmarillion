import roster from "../../hero-balance-roster.json";
import factions from "./factions.json";
import abilities from "./abilities.json";
// Compatibility fingerprint, not an authenticity or anti-cheat mechanism.
let hash = 2166136261;
for (const code of JSON.stringify([roster, factions, abilities]))
  hash = Math.imul(hash ^ code.charCodeAt(0), 16777619) >>> 0;
export const CONTENT_FINGERPRINT = hash.toString(16).padStart(8, "0");

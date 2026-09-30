import type { Action, Match } from "../simulation/types";
import { fatigue } from "../simulation/fatigue";
export interface SituatedScene {
  id: string;
  title: string;
  speaker: string;
  observed: string;
  testimony: string;
  uncertainty: string;
  care: string;
  boundary: string;
  choice: string;
  action: Action;
}
/** Original Cross-era sandbox conversations, conditional on actual known state.
 * Choices use existing authoritative commands; dialogue grants no secret buff. */
export function situatedScenes(
  s: Match,
  seat: string,
  selected: string,
): SituatedScene[] {
  const f = s.facilities[selected];
  if (!f || f.owner !== seat || f.hp <= 0) return [];
  const scenes: SituatedScene[] = [];
  if (f.kind === "refuge") {
    const u = Object.values(s.units).find(
      (u) =>
        u.owner === seat &&
        u.alive &&
        u.kind === "company" &&
        Math.abs(u.x - f.x) + Math.abs(u.y - f.y) <= 1 &&
        fatigue(s, u) > 0,
    );
    if (u)
      scenes.push({
        id: `rest:${f.id}:${u.id}`,
        title: "The Empty Hook",
        speaker: "The refuge cook",
        observed: `${u.name} has reached ${f.name}. An unused kettle hangs beside the serving fire.`,
        testimony:
          "“I can count their bowls. I cannot count how many times they have been told to keep walking.”",
        uncertainty:
          "The cook knows this party is tired, not what waits on its next road.",
        care: "The returning workers and the last dry firewood.",
        boundary:
          "“If they leave before the meal, do not ask me to call it rest.”",
        choice: "Review paid rest for this party",
        action: { kind: "rest", unit: u.id, facility: f.id },
      });
  }
  if (["harbor", "rescue-yard"].includes(f.kind)) {
    const v = Object.values(s.vessels).find(
      (v) =>
        v.owner === seat &&
        v.hp > 0 &&
        v.hp < v.maxHp &&
        Math.abs(v.x - f.x) + Math.abs(v.y - f.y) <= 1,
    );
    if (v)
      scenes.push({
        id: `hull:${v.id}`,
        title: "The Spare Plank",
        speaker: "The boatwright at this yard",
        observed: `${v.name} lies beside the yard with ${v.hp}/${v.maxHp} hull condition. The worker has chalked the damaged seam.`,
        testimony:
          "“A small leak, they said. Water has never agreed to a small appointment.”",
        uncertainty:
          "The seam is damaged. The next voyage and weather are not promised safe.",
        care: "The crew who will trust the same planks again.",
        boundary:
          "“Give me the materials and the time. Praise is difficult to hammer.”",
        choice: "Review the existing hull repair",
        action: { kind: "repair-ship", ship: v.id },
      });
  }
  if (f.kind === "foundry") {
    const site = Object.values(s.infrastructureSites).find(
      (q) =>
        q.owner === seat && q.kind === "wreck" && !q.consumed && !q.claimedBy,
    );
    const worker =
      site &&
      Object.values(s.units).find(
        (u) =>
          u.owner === seat &&
          u.kind === "worker" &&
          u.alive &&
          Math.abs(u.x - site.x) + Math.abs(u.y - site.y) <= 1,
      );
    if (site && worker)
      scenes.push({
        id: `salvage:${site.id}`,
        title: "Letters in the Iron",
        speaker: "The salvage worker",
        observed: `${worker.name} is beside a recorded wreck at (${site.x},${site.y}). Its finite material inventory has not been recovered.`,
        testimony:
          "“There are household marks under the rust. I can save the iron. I cannot tell you who has stopped looking for it.”",
        uncertainty:
          "The household marks are original scenario detail, not evidence that an owner survives nearby.",
        care: "A usable road home and the names that work can erase.",
        boundary:
          "“If we take it, we carry it back. The ledger cannot carry a beam.”",
        choice: "Review funded salvage and the physical return",
        action: {
          kind: "infrastructure-work",
          site: site.id,
          worker: worker.id,
          facility: f.id,
        },
      });
  }
  return scenes;
}

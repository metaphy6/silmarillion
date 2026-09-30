import type { Item, Match, Unit } from "./types";
import { factionProduction } from "../content/production";

const near = (a: Unit, b: Unit, radius: number) =>
  Math.hypot(a.x - b.x, a.y - b.y) <= radius;
function heroFor(s: Match, u: Unit): Unit | undefined {
  const p = s.players[u.owner],
    h = p && s.units[p.hero.id];
  return p?.hero.status === "living" && h?.alive && h.active ? h : undefined;
}
function used(s: Match, h: Unit, kind: string): string | undefined {
  return h.effects
    .find((e) => e.kind === kind && e.source.startsWith(`wear:${s.turn}:`))
    ?.source.slice(`wear:${s.turn}:`.length);
}
function remember(s: Match, h: Unit, kind: string, subject: string) {
  h.effects = h.effects.filter((e) => e.kind !== kind);
  h.effects.push({
    kind,
    value: 1,
    until: 1000000,
    source: `wear:${s.turn}:${subject}`,
  });
}
function changeDurability(s: Match, item: Item, next: number) {
  const old = item.durability;
  item.durability = Math.max(0, Math.min(item.maxDurability, next));
  const bearer = item.bearer ? s.units[item.bearer] : undefined;
  if (item.carried || !bearer || !bearer.alive || !bearer.inventory.includes(item.id)) return;
  const sign =
    old > 0 && item.durability === 0
      ? -1
      : old === 0 && item.durability > 0
        ? 1
        : 0;
  if (sign) {
    bearer.armor += sign * item.bonus;
    bearer.attack += sign * (item.attackBonus ?? 0);
  }
}
/** Provisional routine wear: attack/breach 4, armor 5. HP is not durability.
 * Caller invokes breach only on a successful ordinary obstacle hit, and armor
 * only when actual damage is received. Magical damage itself never wears tools.
 * Nogrod's specialized breach tools are excluded from generic attack wear, so
 * invoking attack and breach for the same attack never charges them twice. */
export function wearEquipment(
  s: Match,
  u: Unit,
  role: "attack" | "armor" | "breach",
): void {
  const p = s.players[u.owner];
  if (!p || !u.alive) return;
  const h = heroFor(s, u);
  const breachName = factionProduction("dwarf_nogrod").equipment.name;
  for (const id of [...new Set(u.inventory)]) {
    const item = s.items[id];
    if (!item || item.carried || item.bearer !== u.id || item.durability <= 0) continue;
    const breachTool = item.name === breachName || item.name === "Field breach tools" || s.toolMetadata[item.id]?.function === "breach";
    if (role === "attack" && (!(item.attackBonus ?? 0) || breachTool)) continue;
    if (role === "armor" && item.bonus <= 0) continue;
    if (role === "breach" && !breachTool) continue;
    let wear = role === "armor" ? 5 : 4;
    const owned = item.owner === u.owner;
    // Strongest qualifying reduction only; these identities cannot stack.
    if (
      h &&
      owned &&
      p.profile === "elf_feanor" &&
      u.id === h.id &&
      item.crafted &&
      !used(s, h, "wear-feanor")
    ) {
      wear = Math.ceil(wear * 0.75);
      remember(s, h, "wear-feanor", item.id);
    } else if (
      h &&
      owned &&
      p.profile === "dwarf_nogrod" &&
      role === "breach" &&
      u.kind === "company" &&
      Boolean(u.engineer) &&
      near(h, u, 1.5) &&
      !used(s, h, "wear-nogrod")
    ) {
      wear = Math.ceil(wear * 0.75);
      remember(s, h, "wear-nogrod", u.id);
    } else if (
      h &&
      owned &&
      p.profile === "dwarf_belegost" &&
      role === "armor" &&
      u.kind === "company" &&
      near(h, u, 3)
    ) {
      const selected = used(s, h, "wear-belegost");
      if (!selected || selected === u.id) {
        wear = Math.ceil(wear * 0.8);
        if (!selected) remember(s, h, "wear-belegost", u.id);
      }
    }
    changeDurability(s, item, item.durability - wear);
  }
}
/** Repairs consume resources/actions in the caller. This helper only restores
 * existing durability and reactivates already-equipped bonuses across zero. */
export function restoreItemDurability(
  s: Match,
  itemId: string,
  amount: number,
): void {
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new Error("Invalid durability repair amount");
  const item = s.items[itemId];
  if (!item) throw new Error("Unknown equipment item");
  changeDurability(s, item, item.durability + amount);
}

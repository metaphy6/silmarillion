import type { Action, Match } from "../simulation/types";
import { visible } from "../simulation/engine";
const esc = (x: string) =>
  x.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function habitatPanel(s: Match, seat: string): string {
  const id = s.players[seat].profile;
  const select = (name: string, label: string, choices: [string, string][]) =>
    `<label>${label}<select id="habitat-${name}">${choices.map(([id, text]) => `<option value="${esc(id)}">${esc(text)}</option>`).join("")}</select></label>`;
  const button = (label: string, action: string) =>
    `<button data-action="habitat-${action}">Review ${label}</button>`;
  return `<details><summary>Living works and old trails</summary><p>Existing vegetation, paid workers and physically surveyed trails only. No new terrain or free construction materials.</p>${select(
    "worker",
    "Available owned party",
    Object.values(s.units)
      .filter((u) => u.owner === seat && u.alive)
      .map((u) => [u.id, `${u.name} (${u.x},${u.y})`]),
  )}${select(
    "job",
    "Unfilled lifting phase",
    Object.values(s.fieldworkJobs)
      .filter(
        (q) =>
          q.owner === seat &&
          q.status === "working" &&
          q.lifting &&
          !q.lifting.unit,
      )
      .map((q) => [q.id, `${q.kind} (${q.x},${q.y})`]),
  )}<p>A stone gate or siege brace needs a separate adjacent lifting worker in addition to its builder. Full Materials are paid in the ordinary job.</p>${button("assign lifting worker", "lifter")}${id === "tulkas" ? button("Shoulder the Burden", "shoulder") : ""}${select(
    "trail",
    "Observed old woodland trail",
    Object.values(s.oldTrails)
      .filter((t) => t.tiles.some((p) => visible(s, seat, p)))
      .map((t) => [
        t.id,
        `${t.blocked ? "Obstructed" : "Open"}: ${t.tiles.map((p) => `(${p.x},${p.y})`).join(" → ")}`,
      ]),
  )}${id === "elf_nandor" ? `<p>Hero must first physically travel the entire trail. Restoration spends 5M tools, provisional 5P worker supplies, one worker operation and one weekly hero commitment.</p>${button("Open the Old Trail", "trail")}` : ""}${button("block existing trail", "block")}${
    id === "yavanna"
      ? `${select(
          "vegetation",
          "Existing observed mature vegetation",
          Object.values(s.vegetation)
            .filter((v) => v.mature && !v.altered && visible(s, seat, v))
            .map((v) => [v.id, `Woodland (${v.x},${v.y})`]),
        )}${select(
          "facility",
          "Adjacent owned staffed worksite",
          Object.values(s.facilities)
            .filter((f) => f.owner === seat && f.hp > 0 && f.workers > 0)
            .map((f) => [f.id, f.name]),
        )}${button("Living Buttress", "buttress")}`
      : ""
  }</details>`;
}
export function habitatAction(
  name: string,
  value: (id: string) => string,
): Action | undefined {
  const v = (x: string) => value("habitat-" + x);
  if (name === "habitat-lifter")
    return { kind: "assign-lifter", job: v("job"), unit: v("worker") };
  if (name === "habitat-block")
    return { kind: "block-trail", trail: v("trail"), unit: v("worker") };
  if (name === "habitat-shoulder")
    return { kind: "habitat-power", mode: "shoulder-burden", job: v("job") };
  if (name === "habitat-trail")
    return {
      kind: "habitat-power",
      mode: "old-trail",
      trail: v("trail"),
      worker: v("worker"),
    };
  if (name === "habitat-buttress")
    return {
      kind: "habitat-power",
      mode: "living-buttress",
      vegetation: v("vegetation"),
      facility: v("facility"),
    };
}

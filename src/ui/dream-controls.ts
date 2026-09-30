import type { Action, Match } from "../simulation/types";
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function dreamPanel(s: Match, seat: string): string {
  if (s.players[seat]?.profile !== "irmo") return "";
  const plans = Object.values(s.dreamPlans).filter((q) => q.owner === seat);
  const resting = Object.values(s.facilities).filter(
    (f) => f.owner === seat && f.rest,
  );
  const reports = Object.values(s.nightReports).filter(
    (r) => r.owner === seat && r.verified && r.observations.length,
  );
  return `<details><summary>Rehearsal in Dream</summary><p>Prepare one existing company in paid rest: 3 readiness and one weekly hero commitment. Rest separately costs 2P and one operation; ordinary upkeep still applies. Rest must complete before the first matching coordination penalty can be reduced by one. Injury, interrupted rest or a different event defeats the preparation. Provisional choices: fear, withdrawal, landing.</p><label>Paid rest assignment<select id="dream-rest">${resting.map((f) => `<option value="${esc(f.id)}">${esc(s.units[f.rest!.unit]?.name ?? f.rest!.unit)} · ${esc(f.name)}</option>`).join("")}</select></label><label>Chosen contingency<select id="dream-contingency"><option value="fear">Fear</option><option value="withdrawal">Withdrawal</option><option value="landing">Landing</option></select></label><button data-action="dream-prepare">Review dream rehearsal</button><p>Each preparation triggers once and expires after the following week. It does not prevent injury or grant extra movement.</p><label>Existing preparation<select id="dream-plan">${plans.map((q) => `<option value="${esc(q.id)}">${esc(q.contingency)} · ${esc(q.phase)} · expires after week ${q.expiresTurn}</option>`).join("")}</select></label><label>Verified nonempty night report<select id="dream-report">${reports.map((r) => `<option value="${esc(r.id)}">Week ${r.createdTurn} · ${r.observations.length} observations</option>`).join("")}</select></label><p>Lucid Adaptation replaces the selected contingency once after fresh owned scouting evidence, with no new rest, payment or extension of expiry. This route currently uses verified night-patrol reports.</p><button data-action="dream-replace">Review contingency replacement</button></details>`;
}
export function dreamAction(
  name: string,
  s: Match,
  value: (id: string) => string,
): Action | undefined {
  const contingency = value("dream-contingency");
  if (!["fear", "withdrawal", "landing"].includes(contingency)) return;
  const choice = contingency as "fear" | "withdrawal" | "landing";
  if (name === "dream-prepare") {
    const facility = value("dream-rest");
    return {
      kind: "prepare-dream",
      facility,
      unit: s.facilities[facility]?.rest?.unit ?? "",
      contingency: choice,
    };
  }
  if (name === "dream-replace")
    return {
      kind: "replace-dream",
      plan: value("dream-plan"),
      report: value("dream-report"),
      contingency: choice,
    };
}

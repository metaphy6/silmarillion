import type { Action, Match } from "../simulation/types";
import { path, visible } from "../simulation/engine";
import { councilVisible } from "../simulation/council";
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const options = (rows: { id: string; label: string }[]) =>
  rows
    .map((r) => `<option value="${esc(r.id)}">${esc(r.label)}</option>`)
    .join("");
export function councilPanel(s: Match, seat: string): string {
  const records = Object.values(s.grievances).filter((q) =>
    councilVisible(q, seat),
  );
  if (!records.length && s.players[seat].profile !== "nienna") return "";
  const sites = Object.values(s.facilities).filter(
    (f) => f.hp > 0 && f.workers > 0 && visible(s, seat, f),
  );
  return `<details><summary>Council of Repair</summary><p>Record actual observed injury, offer exact existing stocks, then collect both parties' consent. Changed terms require fresh consent. Delivery reserves 1–20 stocks (provisional capacity) and one operation, using an existing ordinary courier on an open surveyed route. No production or new courier is created.</p>
 <label>Recorded grievance<select id="council-grievance">${options(records.filter((q) => !q.resolved).map((q) => ({ id: q.id, label: `${q.id} · week ${q.turn} · ${q.offenderSeat} owes ${q.claimantSeat} · ${q.injury} injury` })))}</select></label>
 ${records.map((q) => `<p>${esc(q.id)}: ${q.payment ? `terms ${q.termsVersion}: ${q.payment.P}P ${q.payment.M}M ${q.payment.K}K ${q.payment.E}E` : "No terms offered"} · consent: ${esc(q.consents.join(", ") || "none")} · ${q.resolved ? "settled" : q.delivered ? "delivered" : "not delivered"}</p>`).join("")}
 <label>Invited mediator<select id="council-mediator">${options(
   Object.values(s.players)
     .filter((p) => p.profile === "nienna")
     .map((p) => ({ id: p.seat, label: p.seat + " · Nienna" })),
 )}</select></label>
 ${(["P", "M", "K", "E"] as const).map((k) => `<label>Restitution ${k}<input id="council-${k}" type="number" min="0" max="20" step="1" value="${k === "P" ? 5 : 0}"></label>`).join("")}
 <button data-action="council-offer">Review exact terms</button><button data-action="council-accept">Review consent</button><button data-action="council-revoke">Review withdrawal of consent</button>
 <label>Existing courier<select id="council-carrier">${options(
   Object.values(s.units)
     .filter(
       (u) =>
         u.owner === seat && u.alive && ["worker", "company"].includes(u.kind),
     )
     .map((u) => ({ id: u.id, label: u.name })),
 )}</select></label>
 <label>Payer depot<select id="council-origin">${options(sites.filter((f) => f.owner === seat).map((f) => ({ id: f.id, label: f.name })))}</select></label>
 <label>Recipient site<select id="council-destination">${options(sites.map((f) => ({ id: f.id, label: `${f.owner} · ${f.name}` })))}</select></label>
 <button data-action="council-send">Review physical restitution</button>
 <label>Traveling escrow<select id="council-travel">${options(
   Object.values(s.restitutions)
     .filter((j) => j.owner === seat && j.phase === "travel")
     .map((j) => ({ id: j.id, label: j.id })),
 )}</select></label><button data-action="council-drop-cargo">Review cargo drop</button><p>Dropping releases the courier and leaves the same escrow at its current location for later recovery.</p>
 <label>Lost escrow<select id="council-lost">${options(
   Object.values(s.restitutions)
     .filter((j) => j.owner === seat && j.phase === "lost")
     .map((j) => ({
       id: j.id,
       label: `${j.id} · last position ${j.x}, ${j.y}`,
     })),
 )}</select></label><button data-action="council-recover-cargo">Review cargo recovery</button>
 <p>Settlement requires living Nienna, 3 readiness, one weekly hero commitment, both groups in one connected region, continuing consent and actual delivery. Interception or renewed injury does not disappear. Services are not supported by this stock-payment route.</p><button data-action="council-resolve">Review settlement</button>
 ${Object.values(s.survivorMemories)
   .filter((m) => m.owner === seat)
   .map(
     (m) =>
       `<p>Known separated survivor ${esc(m.party)} · week ${m.turn}, revision ${m.revision}, last observed ${m.x}, ${m.y}. Dated planning record; current position and survival are unknown until observed again.</p>`,
   )
   .join("")}
 </details>`;
}
export function councilAction(
  name: string,
  s: Match,
  value: (id: string) => string,
): Action | undefined {
  if (name === "council-drop-cargo")
    return { kind: "council-drop", restitution: value("council-travel") };
  const grievance = value("council-grievance"),
    q = s.grievances[grievance];
  if (name === "council-offer")
    return {
      kind: "council-terms",
      grievance,
      mediator: value("council-mediator"),
      payment: {
        P: Number(value("council-P")),
        M: Number(value("council-M")),
        K: Number(value("council-K")),
        E: Number(value("council-E")),
      },
    };
  if (name === "council-accept" || name === "council-revoke")
    return {
      kind: "council-consent",
      grievance,
      accept: name === "council-accept",
      termsVersion: q?.termsVersion ?? 0,
    };
  if (name === "council-resolve") return { kind: "council-settle", grievance };
  if (name === "council-send" || name === "council-recover-cargo") {
    const carrier = value("council-carrier"),
      u = s.units[carrier],
      j = s.restitutions[value("council-lost")],
      destination =
        name === "council-send"
          ? value("council-destination")
          : (j?.destination ?? ""),
      f = s.facilities[destination];
    const candidates = f
      ? [
          { x: f.x + 1, y: f.y },
          { x: f.x - 1, y: f.y },
          { x: f.x, y: f.y + 1 },
          { x: f.x, y: f.y - 1 },
          { x: f.x, y: f.y },
        ]
      : [];
    const route =
      u && f && visible(s, u.owner, f)
        ? (candidates
            .map((at) => path(s, u, at, false, u))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .sort((a, b) => a.length - b.length)[0] ?? [])
        : [];
    return name === "council-send"
      ? {
          kind: "council-deliver",
          grievance,
          carrier,
          origin: value("council-origin"),
          destination,
          route,
        }
      : {
          kind: "council-recover",
          restitution: value("council-lost"),
          carrier,
          route,
        };
  }
}

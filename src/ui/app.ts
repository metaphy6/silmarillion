import {panel as forestPanel,actionBuilder as forestAction} from "./forest-controls";
import { dreamPanel, dreamAction } from "./dream-controls";
import { panel as nightPanel, actionBuilder as nightAction, describe as nightDescription } from "./night-relay-controls";
import { panel as equipmentLogisticsPanel, actionBuilder as equipmentLogisticsAction, describe as equipmentLogisticsDescription } from "./equipment-logistics-controls";
import {
  panel as formationPanel,
  actionBuilder as formationAction,
} from "./formation-controls";
import {
  panel as civilianPanel,
  actionBuilder as civilianAction,
} from "./civilian-controls";
import {
  panel as shorePanel,
  actionBuilder as shoreAction,
} from "./shore-controls";
import { habitatPanel, habitatAction } from "./habitat-controls";
import type { OrdinaryHazard } from "../simulation/equipment-service";
import portraitMap from "../../public/assets/portrait-map.json";
import {
  fieldworkCost,
  type FieldworkKind,
  type StructuralMaterial,
} from "../simulation/fieldworks";
import { situatedScenes } from "../content/narrative";
import { navalRoute } from "../simulation/naval";
import { effectiveRelation } from "../simulation/diplomacy";
import { fatigue } from "../simulation/fatigue";
import { repairCost, repairPowerProfiles } from "../simulation/repair";
import { supportedAbilities, zonePowerProfiles } from "../simulation/abilities";
import { MatchSession } from "../network/session";
import {
  profiles,
  profile,
  art,
  economy,
  recipe,
  recipeKeys,
  buildings,
  heroRecipe,
} from "../content/catalog";
import {
  createMatch,
  submit,
  resolveWeek,
  planAI,
  preview,
  validate,
  capacities,
  visible,
  silhouetteContacts,
  powerCost,
  path,
  movementPowerOperations,
} from "../simulation/engine";
import {
  type Match,
  type Action,
  type Pos,
  type Order,
  type Stock,
} from "../simulation/types";
import { bootWorld, RULES_TERRAIN_LEGEND } from "../render/world";
import {
  encodeCheckpoint,
  decodeCheckpoint,
  saveCheckpoint,
  loadCheckpoint,
} from "../persistence/checkpoints";
const esc = (s: unknown) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const cost = (s: Stock) =>
  Object.entries(s)
    .filter(([, n]) => n)
    .map(([k, n]) => `${n}${k}`)
    .join(" + ") || "No stocks";
let state: Match | undefined,
  selected = "p1:core",
  seat = "p1",
  tab = "world",
  notice = "",
  tutorial = false,
  tutorialStep = 0,
  textScale = 1;
let panelHidden = false;
let selectedTile: Pos | undefined;
let pending: Action | undefined;
let opener: HTMLElement | null = null;
let restoredTokens: Record<string, string> = {};
let restoredAssignments: Record<string, string> = {};
let network: MatchSession | undefined;
let netStatus = "Not connected";
let inviteText = "";
let world: ReturnType<typeof bootWorld>;
const checkpointMetadata = () =>
  [
    network?.authority?.assignments ?? restoredAssignments,
    network?.authority?.seatTokens ?? restoredTokens,
  ] as const;
function portrait(id: string) {
  const p = portraitMap.profiles[id as keyof typeof portraitMap.profiles];
  const atlas =
    portraitMap.atlases[p.atlas as keyof typeof portraitMap.atlases];
  return `<div class="portrait" role="img" aria-label="${esc(p.alt)}" style="background-image:url('${import.meta.env.BASE_URL}${atlas.url}');background-size:${p.backgroundSize};background-position:${p.backgroundPosition};aspect-ratio:${p.aspectRatio}"></div>`;
}
const root = () => document.querySelector<HTMLDivElement>("#app")!;
const command = (action: Action): Order => ({
  id: `${seat}:${state!.turn}:${state!.nextSeq[seat]}`,
  seat,
  seq: state!.nextSeq[seat],
  turn: state!.turn,
  revision: state!.revision,
  action,
});
const button = (label: string, action: string, attrs = "") =>
  `<button data-action="${action}" ${attrs}>${label}</button>`;
function download(text: string, name: string) {
  const u = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
function setup() {
  root().classList.remove("landscape-view");
  root().innerHTML = `<section class="setup" id="controls"><p class="eyebrow">A vast world. A particular life.</p><h1>The Long Keeping</h1><p class="lede">Raise a place worth returning to.</p><p>Cross-era sandbox · revision 6 · provisional tuning</p><form id="setup-form"><label>Your faction<select id="faction">${profiles.map((p) => `<option value="${p.id}" ${p.id === "human_rohan" ? "selected" : ""}>${esc(p.faction)} · ${esc(p.hero)}</option>`).join("")}</select></label><div id="faction-detail"></div><div class="form-row"><label>Factions<select id="count"><option value="2">2 · one local rival</option><option value="3">3 · two local rivals</option><option value="4">4 · three local rivals</option></select></label><label>Seed<input id="seed" type="number" value="1947" min="0" max="4294967295"></label></div><label><input id="tutorial" type="checkbox" checked> Guided playable tutorial</label><p class="fine">An invented basin joins grassland, forest, mountain and coastal analogues. These factions did not historically coexist. All 55 profiles are selectable; Melkor's doctrines are one identity, locked for the match. Unique canonical artifacts are absent.</p><button type="submit" class="primary">Begin Cross-era sandbox</button></form><div class="button-row">${button("Continue saved match", "load")}${button("Import host checkpoint", "import")}${button("Private multiplayer", "network")}</div><p role="status">${esc(notice)}</p></section>`;
  const sel = document.querySelector<HTMLSelectElement>("#faction")!;
  const detail = () => {
    const p = profile(sel.value),
      e = economy(sel.value);
    document.querySelector("#faction-detail")!.innerHTML =
      `<h2>${esc(p.hero)}</h2><p>${esc(e.production)}</p><p class="fine">${esc(p.retained_weakness)}</p><p><b>Hero:</b> ${cost(e.recipe.cost)} · ${e.recipe.turns} weeks + ${esc(e.component.name)} (${cost(e.component.cost)}, 1 week).</p><p class="fine">${esc(e.presentation.loreStatus)}</p>`;
  };
  sel.onchange = detail;
  detail();
  document.querySelector<HTMLFormElement>("#setup-form")!.onsubmit = (e) => {
    e.preventDefault();
    const chosen = sel.value;
    const count = Number(
      (document.querySelector("#count") as HTMLSelectElement).value,
    );
    const others = [
      "human_gondor",
      "istari_gandalf",
      "elf_sindar",
      "orc_fortress_clan",
    ]
      .filter((id) => id !== chosen)
      .slice(0, count - 1);
    restoredTokens = {};
    restoredAssignments = {};
    state = createMatch(
      [chosen, ...others],
      Number((document.querySelector("#seed") as HTMLInputElement).value),
      32,
      crypto.randomUUID(),
    );
    tutorial = (document.querySelector("#tutorial") as HTMLInputElement)
      .checked;
    tutorialStep = 0;
    selected = "p1:core";
    notice =
      "Select a place or company. Review every commitment before confirming.";
    void saveCheckpoint(state, ...checkpointMetadata()).catch(showError);
    render();
    world.scene.locate(selected);
  };
  bind();
}
function showError(e: unknown) {
  notice = e instanceof Error ? e.message : String(e);
  if (state) render();
  else setup();
}
const tutorialCopy = [
  [
    "A place to return to",
    "Select your hero building in Places. Queue a signature component. Production uses its own queue; it does not spend the three strategic operations.",
  ],
  [
    "The first week",
    "Resolve the week. Your component completes while rivals make their own plans.",
  ],
  [
    "One hero, one slot",
    "At the hero building, queue your sole hero. The exact recipe is paid when the week resolves. Pending creation occupies the slot.",
  ],
  [
    "Time and work",
    "Resolve until the hero arrives. You can move companies and build with workers while established jobs progress.",
  ],
  [
    "The road is a choice",
    "Select a company, choose a tile on the map or coordinates, then review Move. Keep each move within the displayed allowance.",
  ],
  [
    "A costly presence",
    "Select the hero. Travel, recovery and regional support share one personal commitment; the army retains three strategic operations.",
  ],
  [
    "Keep the lights",
    "From week 8 hold at least two sites for three consecutive resolutions. Supplied companies and landed heroes qualify. Save a turn boundary before leaving.",
  ],
];
function render() {
  if (!state) return setup();
  root().classList.toggle("landscape-view", panelHidden);
  const s = state,
    p = s.players[seat],
    view = preview(s, seat),
    v = view.players[seat],
    pr = profile(p.profile);
  world.scene.setState(s, seat, selected);
  const c = capacities(view, seat);
  root().innerHTML = `<header class="topbar"><div><span class="eyebrow">The Long Keeping</span><strong>Week ${s.turn}${s.combatPhase ? ` · tactical phase ${s.combatPhase}` : ""} · ${s.scenario}</strong></div><div class="stocks">${Object.entries(
    v.stock,
  )
    .map(
      ([k, n]) =>
        `<span><b>${k} ${n}</b><small>${{ P: "Provisions", M: "Materials", K: "Lore supplies", E: "Essence" }[k]}</small></span>`,
    )
    .join(
      "",
    )}</div><div><b>${v.operations}/3 operations</b><small>${v.commitment}/1 hero commitment</small></div></header><nav class="toolbar" aria-label="Game views">${["world", "economy", "hero", "diplomacy", "chronicle", "settings", "network"].map((t) => button(t[0].toUpperCase() + t.slice(1), `tab:${t}`, `aria-pressed="${tab === t}"`)).join("")}<span class="spacer"></span>${button("− Zoom", "zoom-out", 'aria-label="Zoom out"')}${button("+ Zoom", "zoom-in", 'aria-label="Zoom in"')}${button("Locate", "locate")}${button("Rules terrain", "rules-terrain", `aria-pressed="${world.scene.getRulesTerrain()}"`)}${button(panelHidden ? "Show controls" : "View landscape", "toggle-panel", `aria-expanded="${!panelHidden}"`)}</nav><section class="objectives" aria-label="Public objectives"><b>Keep 2 of 3 · from week 8</b> ${s.sites.map((t) => `<button data-action="site:${t.id}">${esc(t.name)}: ${esc(t.owner ?? "contested / unheld")}</button>`).join("")}<span>Hold streak ${p.streak}/3</span></section><section class="sidepanel ${tab === "world" ? "compact" : ""}" id="controls" ${panelHidden ? "hidden" : ""}><div class="panel-title"><h1>${tab === "world" ? "Places & companies" : tab[0].toUpperCase() + tab.slice(1)}</h1><span>${esc(pr.faction)}</span></div>${
    tab === "world"
      ? worldPanel(view)
      : tab === "economy"
        ? economyPanel(view)
        : tab === "hero"
          ? heroPanel(view)
          : tab === "diplomacy"
            ? diplomacyPanel(view)
            : tab === "chronicle"
              ? `<h2>Known record</h2>${s.events
                  .filter(
                    (e) => e.audience === "public" || e.audience.includes(seat),
                  )
                  .slice(-30)
                  .reverse()
                  .map((e) => `<p>Week ${e.turn} · ${esc(e.text)}</p>`)
                  .join("")}`
              : tab === "settings"
                ? settingsPanel()
                : networkPanel()
  }<p class="fine">Supply ${c.supply}/${c.supplyMax} · binding ${c.binding}/${c.bindingMax}${c.greatMax ? ` · great creatures ${c.great}/${c.greatMax}` : ""}</p></section>${tutorial ? `<aside class="tutorial"><b>Tutorial ${tutorialStep + 1}/${tutorialCopy.length} · ${tutorialCopy[tutorialStep][0]}</b><p>${tutorialCopy[tutorialStep][1]}</p>${button("Next lesson", "tutorial-next")}${button("Close tutorial", "tutorial-close")}</aside>` : ""}<footer class="turnbar"><span role="status" id="status">${esc(notice)}</span><span>${s.orders.filter((o) => o.seat === seat).length} planned orders</span>${button("Save checkpoint", "save")}${button("Resolve week →", "resolve", `class="primary" ${s.phase === "finished" ? "disabled" : ""}`)}</footer>${s.phase === "finished" ? `<section class="victory"><h1>${s.winner === seat ? "Victory" : "Defeat"}</h1><p>${esc(s.players[s.winner!]?.profile)} held the basin or ended all rival recovery footholds.</p>${button("New match", "new")}</section>` : ""}`;
  document.documentElement.style.setProperty("--text-scale", String(textScale));
  bind();
  if (pending) showReview(pending);
}
function conversationPanel(s: Match) {
  return situatedScenes(s, seat, selected)
    .map(
      (scene) =>
        `<details class="conversation"><summary>${esc(scene.title)}</summary><h3>${esc(scene.speaker)}</h3><p>${esc(scene.observed)}</p><p>${esc(scene.testimony)}</p><p><b>Uncertainty:</b> ${esc(scene.uncertainty)}</p><p><b>What matters here:</b> ${esc(scene.care)}</p><p>${esc(scene.boundary)}</p>${button(scene.choice, `dialogue:${scene.id}`)}<p class="fine">Original Cross-era sandbox dialogue. Review the normal cost and consequences before committing; closing this conversation places no order.</p></details>`,
    )
    .join("");
}
function worldPanel(s: Match) {
  const entities = [
    ...Object.values(s.facilities).filter(
      (f) => f.hp > 0 && visible(s, seat, f),
    ),
    ...Object.values(s.units).filter((u) => u.alive && visible(s, seat, u)),
    ...Object.values(s.vessels).filter((v) => visible(s, seat, v)),
    ...(s.vesselContacts ?? []),
  ];
  const entity = entities.find((e) => e.id === selected);
  return `<label>Named selection<select id="entity">${entities.map((x) => `<option value="${x.id}" ${x.id === selected ? "selected" : ""}>${x.owner === seat ? "Own" : x.owner === "remnant" ? "Uncalled" : "Observed"} · ${esc(x.name)}</option>`).join("")}</select></label>${entity ? `<h2>${esc(entity.name)}</h2><p>(${entity.x}, ${entity.y}) · ${entity.hp}/${entity.maxHp} health · ${entity.owner === seat ? "Own" : "Observed this week"}</p>` : ""}${
    entity && "alive" in entity
      ? `<p>${entity.supplied ? "✓ Supplied" : "△ Unsupplied"} · move ${entity.move} tiles · attack ${entity.attack} · armor ${entity.armor}</p>${entity.effects
          .filter(
            (e) =>
              e.until > s.revision &&
              [
                "fear",
                "cohesion-loss",
                "rout",
                "orderly-fallback",
                "wound",
                "recovery-wound",
                "fatigue",
                "disable-grace",
              ].includes(e.kind),
          )
          .map(
            (e) =>
              `<p>△ ${esc(e.kind.replaceAll("-", " "))}: ${e.value}${e.kind === "rout" ? " · withdraw or rally before attacking" : ""}</p>`,
          )
          .join(
            "",
          )}<div class="form-row"><label>Destination x<input id="dest-x" type="number" min="0" max="${s.map.width - 1}" value="${selectedTile?.x ?? entity.x}"></label><label>Destination y<input id="dest-y" type="number" min="0" max="${s.map.height - 1}" value="${selectedTile?.y ?? entity.y}"></label></div>${button("Review move", "move")}<label>Observed target<select id="target">${entities
          .filter((t) => t.id !== entity.id)
          .map((t) => `<option value="${t.id}">${esc(t.name)}</option>`)
          .join(
            "",
          )}</select></label>${button("Review attack", "attack")}${button("Review prepared ranged attack", "prepare-ranged")}${button("Review capture", "capture")}${button("Review rescue own captive", "rescue")}${button("Review annexation", "annex")}<label>Nearby equipment<select id="item">${Object.values(
          s.items,
        )
          .filter((i) => !i.bearer && visible(s, seat, i))
          .map(
            (i) =>
              `<option value="${i.id}">${esc(i.name)} · (${i.x}, ${i.y})</option>`,
          )
          .join(
            "",
          )}</select></label>${button("Review equip", "equip")}${entity.owner === "remnant" ? button("Call existing creature", "call") : ""}${entity.flying ? button(entity.landed ? "Take flight" : "Land for capture", "land") : ""}`
      : ""
  }${entity && "workers" in entity ? `<p>Staff ${entity.workers} · ${entity.job ? `Queue ${esc(entity.job.recipe)}, ${entity.job.remaining} weeks remaining` : entity.repair ? `Repair ${esc(entity.repair.target)}, ${entity.repair.remaining} weeks remaining` : "Queue available"}</p>${button("Open production", "tab:economy")}` : ""}${world.scene.getRulesTerrain() ? `<p class="terrain-legend">${esc(RULES_TERRAIN_LEGEND)} The landscape painting is atmospheric; this overlay shows the simulation terrain.</p>` : ""}${conversationPanel(s)}${zonePanel(s)}${controlPowerPanel(s)}${tacticalPanel(s)}${chargePanel(s)}${fieldworkPanel(s)}${habitatPanel(s, seat)}${forestPanel(s,seat)}${shorePanel(s, seat, selectedTile)}${formationPanel(s, seat, selectedTile)}${nightPanel(s, seat, selectedTile)}${equipmentLogisticsPanel(s, seat, selectedTile)}${scoutingPanel(s)}<details><summary>Construction — provisional prices</summary><label>Building<select id="building">${Object.entries(
    buildings,
  )
    .map(
      ([id, b]) =>
        `<option value="${id}">${esc(b.name)} · ${cost(b.cost)}</option>`,
    )
    .join(
      "",
    )}</select></label><p>Choose an empty map tile within 3 tiles of an owned worker. Each building spends one operation. City and support-plot caps apply.</p>${button("Review construction", "build")}</details>`;
}
function controlPowerPanel(s: Match) {
  const id = s.players[seat].profile;
  const warning =
    s.tacticalSignals ??
    Object.values(s.tacticalOrders).filter(
      (q) => q.kind === "grapple" || q.kind === "drowsing",
    );
  return `<details><summary>Warnings, holds and alarms</summary>${warning.map((q) => `<p>${esc(q.kind)} · ${esc("target" in q ? q.target : "")} · ${esc("phase" in q ? q.phase : "")} · ${Math.max(0, q.until - s.revision)} response phases. Move out during the warning, interrupt the caster, or use an ally's counter.</p>`).join("") || "<p>No known active hold or disorientation.</p>"}${["tulkas", "irmo"].includes(id) ? `<p>${esc(profile(id).field_power.effect)} ${esc(profile(id).field_power.counter)}</p>${button("Review control power", "control-power")}` : ""}<p>Selected active ordinary party can raise an alarm for a nearby owned or mutually allied disoriented target; one operation.</p>${button("Review raise alarm", "tactical-alarm")}</details>`;
}
function equipmentServicePanel(s: Match) {
  const units = Object.values(s.units).filter(
      (u) => u.owner === seat && u.alive && u.kind === "company",
    ),
    workshops = Object.values(s.facilities).filter(
      (f) => f.owner === seat && f.hp > 0 && f.kind === "workshop",
    );
  return `<details><summary>Carried protection and armor fitting</summary><p>Use an existing armored company and staffed workshop. Kits are finite existing materials, and fittings preserve the same armor identity and wear. Only the chosen ordinary hazard is protected; magic and a physical flank bypass it.</p><label>Armored company<select id="service-unit">${units.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join("")}</select></label><label>Workshop<select id="service-facility">${workshops.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join("")}</select></label><label>Declared ordinary hazard<select id="service-hazard"><option value="arrows">Ordinary ranged projectiles</option><option value="impact">Ordinary close impact</option></select></label>${button("Review protection kit", "make-protection-kit")}${s.players[seat].profile === "dwarf_belegost" ? `${button("Review Fit the Guard", "fit-guard")}${button("Review Temper for the Threat", "temper-armor")}` : ""}${Object.values(
    s.armorFittings,
  )
    .filter((q) => q.owner === seat)
    .map(
      (q) =>
        `<p>${esc(s.units[q.unit]?.name ?? q.unit)} · ${q.percent}% ${q.hazard} protection · ${q.until === null ? "persistent fitting with one movement-point burden" : `until phase${q.until}`}.</p>`,
    )
    .join("")}</details>`;
}
function scoutingPanel(s: Match) {
  const id = s.players[seat].profile;
  return `<details><summary>Witnesses and uncertain contacts</summary><p>Silhouettes establish a position, not an identity. Physical examination costs an ordinary operation whether or not a shadow proves false.</p><div class="form-row"><label>Contact x<input id="scout-x" type="number" min="0" max="${s.map.width - 1}" value="${selectedTile?.x ?? 0}"></label><label>Contact y<input id="scout-y" type="number" min="0" max="${s.map.height - 1}" value="${selectedTile?.y ?? 0}"></label></div>${button("Review physical examination", "examine-contact")}${id === "istari_veil" ? button("Review Borrowed Shadow", "borrowed-shadow") : ""}${id === "ilmare" ? `<p>Select an identified attacker above whose actual attack was observed this encounter.</p>${button("Review Witness Flare", "witness-flare")}` : ""}${Object.values(
    s.witnessFlares,
  )
    .filter((q) => q.owner === seat)
    .map(
      (q) =>
        `<p>Dated flare at (${q.point.x},${q.point.y}), week${q.turn}, phase${q.revision}; expires phase${q.until}. This marks the witnessed position, not a moving attacker.</p>`,
    )
    .join("")}${Object.values(s.scoutShadows)
    .filter((q) => q.owner === seat)
    .map(
      (q) =>
        `<p>Your stationary scout silhouette at (${q.x},${q.y}); expires phase${q.until}. No body, actions or inventory.</p>`,
    )
    .join("")}</details>`;
}
function huntingPanel(s: Match) {
  const sites = Object.values(s.preySites).filter((q) => visible(s, seat, q)),
    units = Object.values(s.units).filter(
      (u) =>
        u.owner === seat && u.alive && ["company", "beast"].includes(u.kind),
    );
  return `<details><summary>Finite prey and habitat surveys</summary><p>Authored prey is finite and never respawns. A paid ordinary hunt takes at most2 animals, each yielding4P in this scenario. Surveying only records evidence and cannot create Provisions.</p><label>Existing hunting party<select id="hunt-unit">${units.map((u) => `<option value="${u.id}">${esc(u.name)} (${u.x},${u.y})</option>`).join("")}</select></label><label>Observed prey site<select id="hunt-prey">${sites.map((q) => `<option value="${q.id}">${esc(q.habitat)} (${q.x},${q.y}) · ${q.remaining}/${q.initial} remain</option>`).join("")}</select></label><label>Animals, limited by actual remaining inventory<input id="hunt-amount" type="number" min="1" max="2" value="1"></label>${button("Review ordinary hunt", "hunt")}${s.players[seat].profile === "wolf_pack" ? `<p>Packwarden personally surveys one connected habitat along an ordinary physical route.</p><div class="form-row"><label>Survey endpoint x<input id="hunt-x" type="number" min="0" max="${s.map.width - 1}" value="${selectedTile?.x ?? 0}"></label><label>Survey endpoint y<input id="hunt-y" type="number" min="0" max="${s.map.height - 1}" value="${selectedTile?.y ?? 0}"></label></div>${button("Review Read the Hunting Ground", "survey-prey")}` : ""}${Object.values(
    s.huntingReports,
  )
    .filter((q) => q.owner === seat)
    .map(
      (q) =>
        `<p>Week${q.turn}, phase${q.revision}: ${q.prey.map((t) => `(${t.x},${t.y}): ${t.remaining} observed prey`).join("; ") || "No prey observed along this route"}. ${q.danger.length} observed danger positions. ${esc(q.uncertainty)}</p>`,
    )
    .join("")}</details>`;
}
function fieldworkPanel(s: Match) {
  const p = s.players[seat],
    units = Object.values(s.units).filter((u) => u.owner === seat && u.alive),
    facilities = Object.values(s.facilities).filter(
      (f) => f.owner === seat && f.hp > 0,
    );
  return `<details><summary>Physical defenses and carried repair supplies</summary><p>Paid construction reserves an actual adjacent worker and a nearby staffed supply site for one weekly advance. Materials are finite; source access and routes are checked. Completed fieldworks create no extra workers.</p><label>Builder<select id="field-worker">${units
    .filter((u) => u.kind === "worker")
    .map(
      (u) => `<option value="${u.id}">${esc(u.name)} (${u.x},${u.y})</option>`,
    )
    .join(
      "",
    )}</select></label><label>Supply worksite<select id="field-facility">${facilities.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join("")}</select></label><label>Physical structure<select id="field-form">${(["cover", "barricade", "gate", "siege-brace"] as FieldworkKind[]).map((k) => `<option value="${k}">${k} · ${cost(fieldworkCost(k))}</option>`).join("")}</select></label><label>Existing material source<select id="field-material"><option value="timber">Timber</option><option value="stone">Stone</option><option value="metal">Metal</option></select></label><div class="form-row"><label>Site x<input id="field-x" type="number" min="0" max="${s.map.width - 1}" value="${selectedTile?.x ?? 0}"></label><label>Site y<input id="field-y" type="number" min="0" max="${s.map.height - 1}" value="${selectedTile?.y ?? 0}"></label></div>${button("Review staffed fieldwork", "fieldwork")}<label>Existing engineer company<select id="field-engineer">${units
    .filter((u) => u.kind === "company")
    .map((u) => `<option value="${u.id}">${esc(u.name)}</option>`)
    .join(
      "",
    )}</select></label><p>Load one compatible 5M kit beside a staffed workshop. Engineers and breach tools use ordinary paid production; a kit is carried material, not a new stock.</p>${button("Review carried repair kit", "load-repair-kit")}<label>Observed structure<select id="field-target">${Object.values(
    s.facilities,
  )
    .filter((f) => f.hp > 0 && visible(s, seat, f))
    .map(
      (f) =>
        `<option value="${f.id}">${esc(f.name)} · ${f.hp}/${f.maxHp}</option>`,
    )
    .join(
      "",
    )}</select></label>${p.profile === "human_gondor" ? button("Review Brace the Breach", "brace-breach") : ""}${p.profile === "dwarf_khazad_dum" ? button("Review Read the Fault", "read-fault") : ""}</details>`;
}
function chargePanel(s: Match) {
  const p = s.players[seat],
    enabled = ["orome", "human_rohan", "wolf_pack"].includes(p.profile);
  const warnings =
    s.chargeWarnings ??
    Object.values(s.charges)
      .filter((q) => q.owner !== seat && s.units[q.target]?.owner === seat)
      .map((q) => ({
        id: q.id,
        target: q.target,
        origin: q.targetOrigin,
        until: q.until,
      }));
  const warningText = warnings
    .map(
      (q) =>
        `<p>△ Charge warning at (${q.origin.x},${q.origin.y}), response deadline ${q.until}. Move the affected party, use physical defenses, or interrupt the approaching force. The future route is not revealed.</p>`,
    )
    .join("");
  if (!enabled) return warningText;
  const units = Object.values(s.units).filter(
    (u) => u.owner === seat && u.alive,
  );
  return `${warningText}<details><summary>Prepared charges and divided pursuit</summary><p>${esc(profile(p.profile).field_power.effect)} ${esc(profile(p.profile).field_power.counter)}</p><label>Identified hostile target<select id="charge-target">${Object.values(
    s.units,
  )
    .filter((u) => u.owner !== seat && u.alive && visible(s, seat, u))
    .map(
      (u) => `<option value="${u.id}">${esc(u.name)} (${u.x},${u.y})</option>`,
    )
    .join(
      "",
    )}</select></label>${[0, ...(p.profile === "wolf_pack" ? [1] : [])].map((i) => `<label>Approaching party ${i + 1}<select id="charge-unit-${i}">${units.map((u) => `<option value="${u.id}" ${u.id === (p.profile === "orome" ? p.hero.id : selected) ? "selected" : ""}>${esc(u.name)} (${u.x},${u.y})</option>`).join("")}</select></label><div class="form-row"><label>Endpoint x<input id="charge-x-${i}" type="number" min="0" max="${s.map.width - 1}" value="${selectedTile?.x ?? 0}"></label><label>Endpoint y<input id="charge-y-${i}" type="number" min="0" max="${s.map.height - 1}" value="${selectedTile?.y ?? 0}"></label></div>`).join("")}<p>End each real route adjacent to the target. Ordinary charges need a straight open lane; wolf groups use distinct directions. Preparation exposes a response phase and does not track a target that moves away.</p>${button("Review prepared charge", "charge-power")}${Object.values(
    s.charges,
  )
    .filter((q) => q.owner === seat)
    .map(
      (q) =>
        `<p>${esc(q.mode)} · ${q.members.map((m) => esc(s.units[m.unit]?.name ?? m.unit)).join(", ")} · response deadline ${q.until}</p>`,
    )
    .join("")}</details>`;
}
function tacticalPanel(s: Match) {
  return `<details><summary>Declared withdrawal and pursuit</summary><p>Select an ordinary party above. A fallback reserves one operation and its full ordinary route, then exposes a response phase. Pursuit reserves one stationary ordinary attack against the selected observed hostile party; it grants no movement. Another assignment requires cancellation first; cancellation does not refund preparation.</p>${button("Review declared fallback", "declare-fallback")}${button("Review prepared pursuit", "declare-pursuit")}${button("Review cancel tactical order", "cancel-tactical")}${["istari_star", "elf_fingolfin"].includes(s.players[seat].profile) ? `<p>${esc(profile(s.players[seat].profile).field_power.effect)} ${esc(profile(s.players[seat].profile).field_power.counter)}</p>${button("Review withdrawal power", "tactical-power")}` : ""}${Object.values(
    s.tacticalOrders,
  )
    .filter((q) => q.owner === seat)
    .map(
      (q) =>
        `<p>${esc(q.kind)} · ${esc(s.units[q.unit]?.name ?? q.unit)} · response deadline ${q.until}</p>`,
    )
    .join("")}</details>`;
}
function zonePanel(s: Match) {
  const zones = Object.values(s.zones).filter(
    (z) => z.until > s.revision && (z.owner === seat || visible(s, seat, z)),
  );
  const contacts = silhouetteContacts(s, seat);
  const sightings = contacts.length
    ? `<p>Unidentified silhouettes: ${contacts.map((p) => `(${p.x},${p.y})`).join("; ")}. Identity, ownership and strength unknown; not a named target.</p>`
    : "";
  return (
    sightings +
    (zones.length
      ? `<details><summary>Observed terrain effects</summary>${zones.map((z) => `<p>${esc(z.kind)} at (${z.x},${z.y}) · ${z.until - s.revision} phases · ${z.triggered ? "spent" : "active"}</p>`).join("")}<label>Physical obstacle<select id="zone">${zones
          .filter((z) => ["web", "roots", "bloomscreen"].includes(z.kind))
          .map(
            (z) =>
              `<option value="${z.id}">${esc(z.kind)} (${z.x},${z.y})</option>`,
          )
          .join(
            "",
          )}</select></label><p>Selected ordinary armed company must be adjacent. Cutting spends one operation.</p>${button("Review cutting obstacle", "clear-zone")}</details>`
      : "")
  );
}
function economyPanel(s: Match) {
  const p = s.players[seat],
    fs = Object.values(s.facilities).filter(
      (f) => f.owner === seat && f.hp > 0,
    );
  return `<p>Sources are access, not extra stocks: ${esc(p.sources.join(", "))}.</p><p>Established queues progress separately. Costs below are reserved now and paid at resolution.</p><label>Facility<select id="facility">${fs.map((f) => `<option value="${f.id}" ${f.id === selected ? "selected" : ""}>${esc(f.name)} · ${f.job ? `${f.job.recipe} (${f.job.remaining})` : f.repair ? `repair (${f.repair.remaining})` : f.rest ? `rest (${f.rest.remaining})` : "available"}</option>`).join("")}</select></label><div id="recipes">${recipeList(s, fs.find((f) => f.id === selected)?.id ?? fs[0]?.id)}</div>${repairPanel(s, fs.find((f) => f.id === selected)?.id ?? fs[0]?.id)}${equipmentServicePanel(s)}${civilianPanel(s, seat)}${restPanel(s)}${dreamPanel(s, seat)}${carePanel(s)}${cropPanel(s)}${worksitePanel(s)}${infrastructurePanel(s)}${fleetPanel(s)}${logisticsPanel(s)}${huntingPanel(s)}${crossingPanel(s)}${transportPanel(s)}<details><summary>Independent recovery economy</summary><p>Exchange 20P + 10M → 10K (provisional rate, one operation). Core ritual: 20M + 10K → 10E over 2 weeks. Missing-source component: 30M + 20K + 10E over 3 weeks.</p>${button("Review exchange", "exchange")}</details><h2>Work and identity</h2><p>${esc(economy(p.profile).production)}</p><p>${esc(economy(p.profile).magicEquipment)}</p>`;
}
function recipeList(s: Match, facility: string) {
  if (!facility)
    return "<p>No facility: rebuild a core with a surviving worker.</p>";
  const f = s.facilities[facility],
    p = s.players[seat];
  if (f.repair)
    return `<p>Paid repair: ${esc(f.repair.target)} · ${f.repair.remaining} weeks. Pauses if staff, target presence or compatible source access is lost.</p>${button("Review cancel repair", `cancel:${facility}`)}`;
  if (f.rest)
    return `<p>Paid rest: ${esc(f.rest.unit)} · ${f.rest.remaining} week. Company presence, staff and ordinary supply required.</p>${button("Review cancel rest", `cancel:${facility}`)}`;
  if (f.job)
    return `<p>Pending ${esc(f.job.recipe)} · ${f.job.remaining} weeks. Cancellation returns half stock cost; consumed hero component does not return.</p>${button("Review cancel queue", `cancel:${facility}`)}`;
  return recipeKeys
    .filter((k) => recipe(p.profile, k)?.facility === f.kind)
    .map((k) => {
      const r = recipe(p.profile, k)!;
      const a: Action = { kind: "produce", facility, recipe: k };
      const reason = validate(state!, command(a));
      return `<article class="recipe"><h3>${esc(r.name)}</h3><p>${cost(r.cost)} · ${r.turns} weeks${r.provisional ? " · provisional tuning" : ""}</p>${k === "technique" ? "<p>Ordinary company weapon drills: +2 attack to existing and future ordinary companies; excludes heroes and great creatures.</p>" : k === "defenses" ? "<p>Ordinary company protection: +1 armor to existing and future ordinary companies; excludes heroes and great creatures.</p>" : k === "sentinel" ? "<p>Living Saruman, 3 readiness and one personal commitment. One living/pending Sentinel; intercepts one adjacent ordinary ally’s weapon attack per weekly encounter. Upkeep 2M + 1E.</p>" : ""}<small>Access: ${esc(r.access.join(", ") || "none")} · supply ${r.supply} · binding ${r.binding} · great ${r.great}</small>${button("Review order", `produce:${facility}:${k}`, reason ? "disabled" : "")}<p class="reason">${esc(reason || "✓ Available")}</p></article>`;
    })
    .join("");
}
function repairPanel(s: Match, facility: string) {
  if (!facility) return "";
  const p = s.players[seat];
  const targets = [
    ...Object.values(s.items)
      .filter((i) => i.owner === seat && i.durability < i.maxDurability)
      .map((i) => ({
        id: i.id,
        name: `${i.name} · durability ${i.durability}/${i.maxDurability}`,
      })),
    ...Object.values(s.facilities)
      .filter((f) => f.owner === seat && f.hp > 0 && f.hp < f.maxHp)
      .map((f) => ({
        id: f.id,
        name: `${f.name} · structure ${f.hp}/${f.maxHp}`,
      })),
    ...Object.values(s.units)
      .filter(
        (u) =>
          u.owner === seat &&
          u.alive &&
          u.kind === "construct" &&
          u.hp < u.maxHp,
      )
      .map((u) => ({
        id: u.id,
        name: `${u.name} · condition ${u.hp}/${u.maxHp}`,
      })),
  ];
  return `<details><summary>Paid repairs and equipment wear</summary><p>Ordinary repairs: ${cost(repairCost(s, seat, "ordinary"))}, one operation, two weeks; restore up to 25%. Values are provisional. Workshop, compatible material access and target beside the worksite required. A broken item has no equipment bonuses until repaired; it is never duplicated.</p><label>Existing damaged target<select id="repair-target">${targets.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label>${button("Review ordinary repair", "repair:ordinary", targets.length ? "" : "disabled")}${repairPowerProfiles.has(p.profile) ? `<p>${esc(profile(p.profile).support_power.name)}: ${esc(profile(p.profile).support_power.cost)}. ${esc(profile(p.profile).support_power.effect)}</p>${button("Review repair power", "repair:power", targets.length ? "" : "disabled")}` : ""}</details>`;
}
function infrastructurePanel(s: Match) {
  const sites = Object.values(s.infrastructureSites).filter(
    (q) => q.owner === seat && visible(s, seat, q),
  );
  const fs = Object.values(s.facilities).filter(
      (f) => f.owner === seat && f.hp > 0,
    ),
    workers = Object.values(s.units).filter(
      (u) => u.owner === seat && u.kind === "worker" && u.alive,
    );
  return `<details><summary>Existing routes and finite salvage</summary><p>Restore an authored blocked shaft, haulway or channel, or recover one existing finite wreck. Ordinary work costs 5P + 10M, occupies real crew and a staffed receiving facility for two work steps. Salvage must then physically travel to the facility. Clearing creates no materials; no new tunnel or resource deposit appears. Ordinary timing and costs are provisional.</p><label>Observed existing site<select id="infra-site">${sites.map((q) => `<option value="${q.id}">${esc(q.kind)} (${q.x},${q.y}) · ${q.consumed ? "consumed" : q.blocked ? "blocked" : "open"}</option>`).join("")}</select></label><label>Actual crew<select id="infra-worker">${workers.map((u) => `<option value="${u.id}">${esc(u.name)} (${u.x},${u.y})</option>`).join("")}</select></label><label>Receiving worksite<select id="infra-facility">${fs.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join("")}</select></label>${button("Review funded restoration or salvage", "infrastructure-work")}<label>Existing funded job<select id="infra-job">${Object.values(
    s.infrastructureWork,
  )
    .filter((j) => j.owner === seat)
    .map(
      (j) =>
        `<option value="${j.id}">${esc(j.kind)} · ${j.remaining} steps · ${esc(j.phase)} · cargo ${cost(j.cargo)}</option>`,
    )
    .join(
      "",
    )}</select></label>${["dwarf_khazad_dum", "troll_hold", "osse", "orc_fortress_clan"].includes(s.players[seat].profile) ? `<p>${esc(profile(s.players[seat].profile).support_power.effect)} ${esc(profile(s.players[seat].profile).support_power.cost)}</p>${button("Review infrastructure power", "infrastructure-power")}` : ""}</details>`;
}
function worksitePanel(s: Match) {
  if (!["namo", "istari_ember"].includes(s.players[seat].profile)) return "";
  const fs = Object.values(s.facilities).filter(
    (f) => f.owner === seat && f.hp > 0,
  );
  return `<details><summary>Prepared worksite evacuation</summary><p>${esc(profile(s.players[seat].profile).support_power.effect)} ${esc(profile(s.players[seat].profile).support_power.cost)}</p><label>Staffed worksite<select id="worksite-source">${fs.map((f) => `<option value="${f.id}">${esc(f.name)} · ${f.workers} staff</option>`).join("")}</select></label><label>Nearby refuge<select id="worksite-refuge">${fs
    .filter((f) => f.kind === "refuge")
    .map(
      (f) =>
        `<option value="${f.id}">${esc(f.name)} · (${f.x},${f.y})</option>`,
    )
    .join(
      "",
    )}</select></label>${button("Review evacuation preparation", "worksite-support")}<label>Prepared plan<select id="worksite-plan">${Object.values(
    s.worksiteSupports,
  )
    .filter((q) => q.owner === seat && !q.used)
    .map(
      (q) =>
        `<option value="${q.id}">${esc(q.id)} · ${q.staff} existing staff</option>`,
    )
    .join(
      "",
    )}</select></label>${button("Review prepared withdrawal", "evacuate-worksite")}<p>A blocked route or occupied refuge prevents withdrawal. Existing staff transfer once; the abandoned job pauses with no remote production. Námo requires an actually observed hostile approach.</p></details>`;
}
function cropPanel(s: Match) {
  const fs = Object.values(s.facilities).filter(
    (f) => f.owner === seat && f.hp > 0,
  );
  return `<details><summary>Cultivated crop cycles</summary><p>Separate from ordinary provision farms: plant one prepared irrigated plot for 10P + 5M, then tend three growth stages for 2P each. Fixed harvest 30P. These ordinary numbers are provisional. Destroyed plot or irrigation fails the crop; lost staff pauses. Vána advances one stage once per cycle; all remaining tending costs still apply before harvest.</p><label>Prepared cultivated plot<select id="crop-plot">${fs
    .filter((f) => f.kind === "crop-plot")
    .map((f) => `<option value="${f.id}">${esc(f.name)}</option>`)
    .join(
      "",
    )}</select></label><label>Nearby irrigation<select id="crop-irrigation">${fs
    .filter((f) => f.kind === "irrigation")
    .map((f) => `<option value="${f.id}">${esc(f.name)}</option>`)
    .join(
      "",
    )}</select></label>${button("Review planting", "plant-crop")}<label>Existing crop cycle<select id="crop-cycle">${Object.values(
    s.crops,
  )
    .filter((c) => c.owner === seat)
    .map(
      (c) =>
        `<option value="${c.id}">${esc(c.id)} · ${esc(c.status)} · stage ${c.stage}/3 · harvest ${c.harvest}P · ${c.remainingCare * 2}P tending remains</option>`,
    )
    .join(
      "",
    )}</select></label>${s.players[seat].profile === "vana" ? button("Review Season Brought Forward", "advance-crop") : ""}</details>`;
}
function carePanel(s: Match) {
  const patients = Object.values(s.units).filter(
    (u) =>
      u.owner === seat &&
      u.alive &&
      u.effects.some((e) => e.kind === "recovery-wound"),
  );
  const facilities = Object.values(s.facilities).filter(
    (f) =>
      f.owner === seat &&
      f.hp > 0 &&
      ["refuge", "medicine-nursery"].includes(f.kind),
  );
  return `<details><summary>Injury recovery</summary><p>Normal care costs 5P + 2M and one operation, takes two weekly advances, and occupies a staffed refuge or nursery. Rest removes an existing recoverable injury; it never restores casualties or HP. Ordinary values are provisional. Cancel care before moving; renewed injury cancels care; missing supply or threats pause it.</p><label>Injured patient<select id="care-unit">${patients.map((u) => `<option value="${u.id}">${esc(u.name)} (${u.x},${u.y})</option>`).join("")}</select></label><label>Recovery site<select id="care-facility">${facilities.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join("")}</select></label>${button("Review normal care", "care:ordinary")}${button("Review cancel care", "cancel-care")}${s.players[seat].profile === "este" ? button("Review Rest Without Walls", "care:este") : ""}${["elf_finarfin", "istari_grove"].includes(s.players[seat].profile) ? `<p>${esc(profile(s.players[seat].profile).support_power.effect)} ${esc(profile(s.players[seat].profile).support_power.cost)}</p>${s.players[seat].profile === "istari_grove" ? `<label>Optional second patient<select id="care-unit-2"><option value="">None</option>${patients.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join("")}</select></label>` : ""}${button("Review recovery power", "care-power")}` : ""}${Object.values(
    s.recoveries,
  )
    .filter((q) => q.owner === seat)
    .map(
      (q) =>
        `<p>${esc(s.units[q.unit]?.name ?? q.unit)} · ${q.remaining} care steps remaining · ${q.accelerated ? "additional step prepared" : "ordinary schedule"}</p>`,
    )
    .join("")}</details>`;
}
function fleetPanel(s: Match) {
  const ships = Object.values(s.vessels).filter((v) => v.owner === seat);
  const passengers = Object.values(s.units).filter(
    (u) =>
      u.owner === seat &&
      u.alive &&
      ["company", "worker", "hero"].includes(u.kind),
  );
  return `<details><summary>Coastal transport</summary><p>Build a harbor beside water, then queue a paid hull with an existing free worker crew. Hulls carry 20 stock, one ordinary party and one hero. Every order spends one operation. Handling takes one week plus local delay; sailing advances three water tiles weekly. Upkeep 2P + 1M plus crew upkeep. These ordinary values are provisional.</p>${ships.map((v) => `<p>${esc(v.name)} (${v.x},${v.y}) · ${esc(v.phase)} · hull ${v.hp}/${v.maxHp} · cargo ${cost(v.cargo)} · crew ${esc(v.crew)} · party ${esc(v.passenger ?? "none")} · hero ${esc(v.aboardHero ?? "none")}</p>`).join("")}<label>Own vessel<select id="fleet-ship">${ships.map((v) => `<option value="${v.id}">${esc(v.id)} (${v.x},${v.y}) · ${esc(v.phase)}</option>`).join("")}</select></label><label>Existing party<select id="fleet-unit">${passengers.map((u) => `<option value="${u.id}">${esc(u.name)} (${u.x},${u.y})</option>`).join("")}</select></label><div class="form-row"><label>Destination / landing X<input id="fleet-x" type="number" min="0" max="${s.map.width - 1}" value="${selectedTile?.x ?? 0}"></label><label>Destination / landing Y<input id="fleet-y" type="number" min="0" max="${s.map.height - 1}" value="${selectedTile?.y ?? 0}"></label></div>${["P", "M", "K", "E"].map((k) => `<label>Cargo ${k}<input id="fleet-${k}" type="number" min="0" max="20" value="0"></label>`).join("")}${["sail", "embark", "disembark", "rescue-passenger", "load-cargo", "unload-cargo", "repair-ship"].map((k) => button("Review " + k, "fleet:" + k)).join("")}${["elf_falmari", "uinen", "osse"].includes(s.players[seat].profile) ? `<h3>Naval hero powers</h3><p>${esc(profile(s.players[seat].profile).field_power.effect)}</p>${button("Review naval field power", "naval-power:field")}${s.players[seat].profile !== "osse" ? `<p>${esc(profile(s.players[seat].profile).support_power.effect)}</p>${button("Review naval support power", "naval-power:support")}` : ""}` : ""}<h3>Observed water conditions</h3>${
    Object.entries(s.seaHazards)
      .filter(([key]) => {
        const [x, y] = key.split(",").map(Number);
        return visible(s, seat, { x, y });
      })
      .map(
        ([key, h]) =>
          `<p>(${esc(key)}) · wave severity ${h.wave} · ${h.fog ? "fog delay" : "clear air"} · handling delay ${h.handling}</p>`,
      )
      .join("") || "<p>No observed authored water hazard.</p>"
  }${s.navalEffects
    .filter((e) => e.owner === seat || e.tiles.some((p) => visible(s, seat, p)))
    .map(
      (e) =>
        `<p>${esc(e.kind)} · ${e.until === 1000000 ? "this week" : Math.max(0, e.until - s.revision) + " phases"} · ${e.used ? "consumed" : "active"}</p>`,
    )
    .join(
      "",
    )}<p>Wrecks retain finite cargo and surviving parties. Rescue requires another adjacent vessel with capacity; no unit or cargo is recreated.</p></details>`;
}
function logisticsPanel(s: Match) {
  const ships = Object.values(s.vessels).filter(
      (v) => v.owner === seat && v.hp > 0,
    ),
    harbors = Object.values(s.facilities).filter(
      (f) => f.owner === seat && f.kind === "harbor" && f.hp > 0,
    ),
    parties = Object.values(s.units).filter(
      (u) => u.alive && visible(s, seat, u),
    );
  return `<details><summary>Fleet organization and light rescue</summary><p>Redistribute only existing cargo and escorts between up to three own vessels at one staffed harbor. Per-hull capacity remains20 stock and one party; total cargo and actual party identities must be conserved. Ordinary organization plus handling takes two weeks; Númenor can bypass only organization for5P,3 readiness and a commitment.</p><label>Rendezvous harbor<select id="logistics-harbor">${harbors.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join("")}</select></label>${[
    0, 1, 2,
  ]
    .map(
      (i) =>
        `<fieldset><legend>Vessel assignment ${i + 1}</legend><label>Vessel<select id="logistics-ship-${i}"><option value="">None</option>${ships.map((v) => `<option value="${v.id}">${esc(v.id)} · ${cost(v.cargo)} · party ${esc(v.passenger ?? "none")}</option>`).join("")}</select></label><label>Existing escort after transfer<select id="logistics-passenger-${i}"><option value="">None</option>${parties
          .filter((u) => ships.some((v) => v.passenger === u.id))
          .map((u) => `<option value="${u.id}">${esc(u.name)}</option>`)
          .join(
            "",
          )}</select></label>${["P", "M", "K", "E"].map((k) => `<label>Assigned ${k}<input id="logistics-${i}-${k}" type="number" min="0" max="20" value="0"></label>`).join("")}</fieldset>`,
    )
    .join(
      "",
    )}${button("Review ordinary fleet organization", "logistics:ordinary")}${s.players[seat].profile === "human_numenor" ? button("Review Convoy Command", "logistics:power") : ""}${s.players[seat].profile === "eagle_eyrie" ? `<h3>Lift the Stranded</h3><p>One willing light nonhero ally, picked up by contact and carried along one exposed flight over two phases to a safe landing within20metres. Normal total flight allowance remains. Light classification is explicit provisional unit data; large bodies and heroes are excluded.</p><label>Existing light ally<select id="lift-unit">${parties.map((u) => `<option value="${u.id}">${esc(u.name)} · ${esc(u.loadClass ?? "standard")}</option>`).join("")}</select></label><label>Landing X<input id="lift-x" type="number" min="0" max="${s.map.width - 1}" value="${selectedTile?.x ?? 4}"></label><label>Landing Y<input id="lift-y" type="number" min="0" max="${s.map.height - 1}" value="${selectedTile?.y ?? 4}"></label>${button("Review light rescue flight", "logistics:lift")}` : ""}${Object.values(
    s.logisticsJobs,
  )
    .filter((j) => j.owner === seat)
    .map(
      (j) =>
        `<p>${esc(j.kind)} · ${esc(j.id)} · existing transport reserved</p>`,
    )
    .join("")}</details>`;
}
function crossingPanel(s: Match) {
  const anchors = Object.values(s.facilities).filter(
    (f) => f.owner === seat && f.kind === "crossing-anchor" && f.hp > 0,
  );
  const workers = Object.values(s.units).filter(
    (u) => u.owner === seat && u.kind === "worker" && u.alive,
  );
  return `<details><summary>Physical crossings</summary><p>Ent causeways and Spider silk bridges join two existing prepared bank anchors across one 6–15 metre gap. Pay 10P + 20M, 3 readiness and a hero commitment; workers construct over one weekly advance. Ent causeways require existing bank woodland and timber access. Anchors and bridge can be destroyed; ordinary movement costs remain.</p><label>Near anchor<select id="cross-from">${anchors.map((f) => `<option value="${f.id}">${esc(f.name)} (${f.x},${f.y})</option>`).join("")}</select></label><label>Far anchor<select id="cross-to">${anchors.map((f) => `<option value="${f.id}">${esc(f.name)} (${f.x},${f.y})</option>`).join("")}</select></label><label>Construction crew<select id="cross-crew">${workers.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join("")}</select></label>${button("Review crossing construction", "crossing")}${Object.values(
    s.crossings,
  )
    .filter((c) => c.owner === seat || c.tiles.some((p) => visible(s, seat, p)))
    .map(
      (c) =>
        `<p>${esc(c.kind)} · ${esc(c.phase)} · ${c.hp}/${c.maxHp} structure · ${c.tiles.map((p) => `(${p.x},${p.y})`).join(" → ")}</p>`,
    )
    .join("")}<label>Observed crossing<select id="cross-target">${Object.values(
    s.crossings,
  )
    .filter((c) => c.tiles.some((p) => visible(s, seat, p)))
    .map(
      (c) => `<option value="${c.id}">${esc(c.kind)} · ${esc(c.id)}</option>`,
    )
    .join(
      "",
    )}</select></label><p>Select your adjacent armed formation from World before attacking a hostile crossing.</p>${button("Review breaking crossing", "break-crossing")}</details>`;
}
function movementPanel(s: Match) {
  if (
    !["nessa", "elf_nandor", "eonwe", "melkor_dark_architect"].includes(
      s.players[seat].profile,
    )
  )
    return "";
  const units = Object.values(s.units).filter(
    (u) => u.alive && visible(s, seat, u),
  );
  const max =
    s.players[seat].profile === "melkor_dark_architect"
      ? 3
      : s.players[seat].profile === "eonwe"
        ? 2
        : 1;
  return `<details><summary>Declared movement power</summary><p>Choose actual formations and visible route endpoints. Preparation exposes one response phase; injury interrupts it. Ordinary movement, fatigue, terrain and supply remain. Iron Edict reserves one operation; other powers reserve one ordinary operation per selected company. All planned Eönwë movement phases must fit the remaining weekly operation budget and are reserved before commitment.</p>${Array.from({ length: max }, (_, i) => `<fieldset><legend>Formation ${i + 1}</legend><label>Formation<select id="plan-unit-${i}"><option value="">None</option>${units.map((u) => `<option value="${u.id}">${esc(u.name)} (${u.x},${u.y})</option>`).join("")}</select></label><label>Destination X<input id="plan-x-${i}" type="number" min="0" max="${s.map.width - 1}" value="6"></label><label>Destination Y<input id="plan-y-${i}" type="number" min="0" max="${s.map.height - 1}" value="5"></label></fieldset>`).join("")}${button("Review movement power", "movement-power")}${Object.values(
    s.movementPlans,
  )
    .filter((p) => p.owner === seat)
    .map(
      (p) =>
        `<p>Declared plan ${esc(p.id)} · ${p.until - s.revision} response phases remain</p>`,
    )
    .join("")}</details>`;
}
function restPanel(s: Match) {
  const companies = Object.values(s.units).filter(
    (u) => u.owner === seat && u.alive && u.kind === "company",
  );
  const refuges = Object.values(s.facilities).filter(
    (f) => f.owner === seat && f.hp > 0 && f.kind === "refuge",
  );
  return `<details><summary>Rest and travel fatigue</summary><p>Each ordinary company travel leg adds 1 fatigue, up to 6. Every 3 fatigue removes 1 movement allowance, minimum 1. A staffed refuge recovers 2 fatigue for 2P and one weekly queue advance. Provisional ordinary tuning.</p><label>Company<select id="rest-unit">${companies.map((u) => `<option value="${u.id}">${esc(u.name)} · fatigue ${fatigue(s, u)}/6</option>`).join("")}</select></label><label>Refuge<select id="rest-facility">${refuges.map((f) => `<option value="${f.id}">${esc(f.name)} (${f.x},${f.y})</option>`).join("")}</select></label>${button("Review paid rest", "rest")}</details>`;
}
function transportPanel(s: Match) {
  const fs = Object.values(s.facilities).filter(
    (f) => f.owner === seat && f.hp > 0,
  );
  const units = Object.values(s.units).filter(
    (u) =>
      u.owner === seat &&
      u.alive &&
      ["worker", "company", "beast"].includes(u.kind),
  );
  const options = fs
    .map(
      (f) => `<option value="${f.id}">${esc(f.name)} (${f.x},${f.y})</option>`,
    )
    .join("");
  return `<details><summary>Physical convoys</summary><p>Reserve existing stocks as cargo: capacity 20 total, plus 1P loading supplies and one operation. One week loading, actual carrier movement, then one week unloading. Normal upkeep continues. Carrier cannot take separate actions while committed. Provisional transport tuning; endpoint destruction or blocked roads pauses travel.</p><label>Carrier<select id="convoy-carrier">${units.map((u) => `<option value="${u.id}">${esc(u.name)} (${u.x},${u.y})</option>`).join("")}</select></label><label>Origin<select id="convoy-origin">${options}</select></label><label>Destination<select id="convoy-destination">${options}</select></label>${["P", "M", "K", "E"].map((k) => `<label>${k} cargo<input id="convoy-${k}" type="number" min="0" max="20" value="${k === "P" ? 5 : 0}"></label>`).join("")}${button("Review convoy", "convoy")}${s.players[seat].profile === "eagle_eyrie" ? button("Review Eyrie Relay", "eyrie-relay") : ""}<p>Cargo comes from the faction's existing stock; this sandbox does not yet have independent household or depot inventories.</p>${Object.values(
    s.convoys,
  )
    .filter((c) => c.owner === seat)
    .map(
      (c) =>
        `<p>${esc(c.id)} · ${esc(c.phase)} at (${c.x},${c.y}) · ${cost(c.cargo)} · ${esc(c.pauseReason ?? "following declared route")}</p>`,
    )
    .join(
      "",
    )}<label>Existing convoy<select id="existing-convoy">${Object.values(
    s.convoys,
  )
    .filter((c) => c.owner === seat)
    .map(
      (c) => `<option value="${c.id}">${esc(c.id)} · ${esc(c.phase)}</option>`,
    )
    .join(
      "",
    )}</select></label><p>Recover lost cargo with the selected carrier on its actual tile: 1P and one operation, then normal loading. Reroute toward the selected destination with a staffed relay: 2K and one operation. These normal communication prices are provisional.</p><label>Relay<select id="convoy-relay">${fs
    .filter((f) => f.kind === "relay")
    .map((f) => `<option value="${f.id}">${esc(f.name)}</option>`)
    .join(
      "",
    )}</select></label>${button("Review cargo recovery", "recover-cargo")}${button("Review relay reroute", "reroute:ordinary")}${s.players[seat].profile === "manwe" ? button("Review Heralds on the Wind", "reroute:power") : ""}${s.players[seat].profile === "sauron" ? `<label>Alternate route waypoint X<input id="supply-x" type="number" min="0" max="${s.map.width - 1}" value="6"></label><label>Waypoint Y<input id="supply-y" type="number" min="0" max="${s.map.height - 1}" value="6"></label><p>Both endpoints must be staffed depots. Every alternate tile must currently be surveyed; choose a waypoint away from the primary road.</p>${button("Review Redundant Supply", "prepare-supply")}` : ""}</details>`;
}
function intelligencePanel(s: Match) {
  const p = s.players[seat];
  if (!["istari_veil", "istari_star"].includes(p.profile)) return "";
  const quiet = p.profile === "istari_veil",
    kind = quiet ? "safehouse" : "beacon";
  const stations = Object.values(s.facilities).filter(
    (f) => f.owner === seat && f.kind === kind && f.hp > 0,
  );
  const reports = Object.values(s.intelligenceReports).filter(
    (r) => r.owner === seat,
  );
  return `<details><summary>Private intelligence network</summary><p>${quiet ? "Quiet Exchange: 10K, 3 readiness and one personal commitment. An existing courier physically carries dated evidence between two staffed safehouses; cross-checks preserve uncertainty." : "Beacon Concord: 10M + 5K, 3 readiness and one personal commitment. Three staffed linked beacons relay only attacks they actually observe during the prepared week."}</p>${Array.from({ length: quiet ? 2 : 3 }, (_, i) => `<label>Station ${i + 1}<select id="intel-station-${i}">${stations.map((f) => `<option value="${f.id}">${esc(f.name)} (${f.x},${f.y})</option>`).join("")}</select></label>`).join("")}${
    quiet
      ? `<label>Existing evidence<select id="intel-report">${reports.map((r) => `<option value="${r.id}">${esc(r.id)} · week ${r.createdTurn} · ${esc(r.status)}</option>`).join("")}</select></label><label>Existing courier<select id="intel-carrier">${Object.values(
          s.units,
        )
          .filter((u) => u.owner === seat && u.kind === "worker" && u.alive)
          .map((u) => `<option value="${u.id}">${esc(u.name)}</option>`)
          .join("")}</select></label>`
      : ""
  }${button("Review intelligence preparation", "intelligence-power")}<h3>Dated reports</h3>${reports.map((r) => `<article><b>${esc(r.id)} · ${esc(r.status)}</b><p>${r.observations.map((o) => `Week ${o.turn}, phase ${o.revision}: ${esc(o.certainty)} attack at (${o.x},${o.y})`).join("; ")}</p><p>${esc(r.uncertainty.join("; "))}</p></article>`).join("") || "<p>No observed reports yet.</p>"}</details>`;
}
function patrolPanel(s: Match) {
  if (!["varda", "vaire"].includes(s.players[seat].profile)) return "";
  const surveys = Object.values(s.routeSurveys).filter((q) => q.owner === seat),
    h = s.units[s.players[seat].hero.id];
  return `<details><summary>Dated trails and surveyed routes</summary><p>Evidence comes from actual ground travel. Dated tracks never establish identity, intentions or current position. Move Vairë onto a surviving trace site before stationary inspection. Varda watches one previously traversed open route intermittently for one week.</p>${h ? `<p>Hero position (${h.x},${h.y})</p>` : ""}${s.players[seat].profile === "vaire" ? button("Review local trace inspection", "inspect-trace") : ""}<label>Actually surveyed route<select id="patrol-survey">${surveys.map((q) => `<option value="${q.id}">Week ${q.turn} · ${q.route.map((p) => `(${p.x},${p.y})`).join(" → ")}</option>`).join("")}</select></label>${s.players[seat].profile === "varda" ? button("Review Starwatch Circuit", "prepare-starwatch") : ""}${Object.values(
    s.patrolReports,
  )
    .filter((q) => q.owner === seat)
    .map(
      (q) =>
        `<article><b>${esc(q.kind)} · evidence week ${q.turn}, phase ${q.revision}</b><p>${q.points.map((p) => `(${p.x},${p.y})`).join(" → ")}</p><p>${esc(q.uncertainty.join("; "))}</p></article>`,
    )
    .join("")}</details>`;
}
function powerRouteHint(id: string, power: string): string {
  const routes: Record<string, string> = {
    "irmo:support": "Economy → Rehearsal in Dream: prepare a company in paid rest; replace once with a fresh verified night report.",
    "orome:support": "World → Keep the Wild Road: personally patrol an actual surveyed route.",
    "melian:field": "World → Woodland roads and thresholds: veil an existing paid withdrawal with explicit allied consent.",
    "melian:support": "World → Woodland roads and thresholds: ward an existing surveyed wooded supply route.",
    "elf_avari:field":
      "World → Formation orders: synchronize two actual light companies.",
    "elf_fingolfin:support":
      "World → Formation orders: exchange two real posted garrisons.",
    "eonwe:support":
      "World → Formation orders: prepare three actual arrivals at a supplied rally.",
    "nessa:support":
      "Economy → Households and civilian stores: physically transfer an existing willing group.",
    "hobbit_shire:support":
      "Economy → Households and civilian stores: move up to10 existing household Provisions.",
    "ulmo:field":
      "World → Shallows, currents and marine landings: use an actual shallow ford.",
    "ulmo:support":
      "World → Shallows, currents and marine landings: authorize an existing loaded convoy passage.",
    "human_numenor:field":
      "World → Shallows, currents and marine landings: prepare an actual marine unloading.",
    "yavanna:support":
      "World → Living works and old trails: shape existing mature vegetation.",
    "tulkas:support":
      "World → Living works and old trails: replace a paid construction lifting role.",
    "elf_nandor:support":
      "World → Living works and old trails: restore an actually surveyed woodland route.",
    "dwarf_belegost:field":
      "Economy → Carried protection and armor fitting: consume a real carried kit against one declared ordinary hazard.",
    "dwarf_belegost:support":
      "Economy → Carried protection and armor fitting: fund a workshop refit of existing armor, preserving its wear.",
    "istari_veil:field":
      "World → Witnesses and uncertain contacts: place an original stationary silhouette at a visible point.",
    "ilmare:field":
      "World → Witnesses and uncertain contacts: mark the fixed position of an actual observed attacker.",
    "wolf_pack:support":
      "Economy → Finite prey and habitat surveys: the hero personally traverses a known habitat.",
    "human_gondor:field":
      "World → Physical defenses and carried repair supplies: spend an existing compatible engineer kit on a damaged gate or barricade.",
    "dwarf_khazad_dum:field":
      "World → Physical defenses and carried repair supplies: mark an observed unstable stone obstacle for a normal engineer breach.",
    "orome:field":
      "World → Prepared charges and divided pursuit: approach an actual prepared attacker along an open route.",
    "human_rohan:field":
      "World → Prepared charges and divided pursuit: commit an existing mounted company.",
    "wolf_pack:field":
      "World → Prepared charges and divided pursuit: commit two existing trusted formations.",
    "human_numenor:support":
      "Economy → Fleet organization and light rescue: redistribute existing loads at one harbor.",
    "eagle_eyrie:field":
      "Economy → Fleet organization and light rescue: carry one actual willing light nonhero ally.",
    "varda:support":
      "Hero → Dated trails and surveyed routes: select an actually traversed route for one weekly watch.",
    "vaire:field":
      "Hero → Dated trails and surveyed routes: inspect surviving traces at the hero’s actual position.",
    "istari_veil:support":
      "Hero → Private intelligence network: select two safehouses, existing evidence and courier.",
    "istari_star:support":
      "Hero → Private intelligence network: prepare three linked staffed beacons.",
    "este:support":
      "Economy → Injury recovery: select a sheltered injured party for Rest Without Walls.",
    "elf_finarfin:support":
      "Economy → Injury recovery: accelerate one existing funded refuge queue.",
    "istari_grove:support":
      "Economy → Injury recovery: select up to two existing nursery patients.",
    "vana:support":
      "Economy → Cultivated crop cycles: advance an existing planted crop once.",
    "elf_falmari:field":
      "Economy → Coastal transport: select an actual unloading vessel and landing.",
    "elf_falmari:support":
      "Economy → Coastal transport: protect one existing surveyed voyage against one fog delay.",
    "uinen:field":
      "Economy → Coastal transport: select a visible damaged hull for wave protection.",
    "uinen:support":
      "Economy → Coastal transport: advance a funded repair at a staffed rescue yard.",
    "osse:field":
      "Economy → Coastal transport: choose visible coastal water coordinates; surf affects friends too.",
    "tulkas:field":
      "World → Warnings, holds and alarms: choose an adjacent opponent for a telegraphed hold.",
    "irmo:field":
      "World → Warnings, holds and alarms: disorient an observed formation; its ordinary actions remain available.",
    "istari_star:field":
      "World → Declared withdrawal and pursuit: revise an existing fallback route.",
    "elf_fingolfin:field":
      "World → Declared withdrawal and pursuit: protect existing infantry withdrawal against trailing pursuit.",
    "dwarf_khazad_dum:support":
      "Economy → Existing routes and finite salvage: restore an existing funded shaft project.",
    "troll_hold:support":
      "Economy → Existing routes and finite salvage: clear an existing funded haulway.",
    "orc_fortress_clan:support":
      "Economy → Existing routes and finite salvage: advance an older funded finite salvage job.",
    "osse:support":
      "Economy → Existing routes and finite salvage: advance an existing funded channel repair.",
    "namo:support":
      "Economy → Prepared worksite evacuation: prepare a refuge route against an observed hostile approach.",
    "istari_ember:support":
      "Economy → Prepared worksite evacuation: move existing workers once; the abandoned job pauses.",
  };
  return routes[`${id}:${power}`] ?? "";
}
function heroPanel(s: Match) {
  const p = s.players[seat],
    q = profile(p.profile),
    a = art(p.profile),
    e = economy(p.profile);
  return `${portrait(p.profile)}<p class="fine">Original identity portrait · runtime edition</p><h2>${esc(q.hero)}</h2><p><b>${p.hero.status.toUpperCase()}</b> · one occupied/pending hero slot</p><p>Level ${p.hero.level} · readiness ${p.hero.readiness} · ${esc(p.hero.perks.join(", ") || "No selected perks")}</p><p>${esc(a.domains.character)}</p><p>${cost(heroRecipe(p.profile).cost)} · ${e.recipe.turns} weeks + new ${esc(e.component.name)}. Retained levels/perks; dropped gear never copies.</p>${button("Review recovery", "recover")}<details><summary>Development · provisional same-role perks</summary><p>One branch per retained level. Guard: +2 armor; Path: +2 movement; Craft: +2 ordinary attack. This is provisional progression, not an offensive redesign.</p>${["guard", "path", "craft"].map((b) => button(`Choose ${b}`, `perk:${b}`)).join("")}</details>${button("Review captive surrender", "surrender")}<label>Power target<select id="target">${[...Object.values(s.units).filter((u) => u.alive && visible(s, seat, u)), ...Object.values(s.facilities).filter((f) => f.hp > 0 && visible(s, seat, f))].map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join("")}</select></label>${zonePowerProfiles.has(p.profile) ? `<label><input id="point-cast" type="checkbox"> Target observed terrain instead of an entity</label><label>Terrain X<input id="power-x" type="number" min="0" max="${s.map.width - 1}" value="${selectedTile?.x ?? s.units[p.hero.id]?.x ?? 4}"></label><label>Terrain Y<input id="power-y" type="number" min="0" max="${s.map.height - 1}" value="${selectedTile?.y ?? s.units[p.hero.id]?.y ?? 4}"></label>` : ""}${(
    ["field", "support"] as const
  )
    .map((which) => {
      const t = q[which === "field" ? "field_power" : "support_power"];
      return `<article class="recipe"><h3>${esc(t.name)}</h3><p>${esc(t.effect)}</p><p>${esc(t.cost)}</p><p>${esc(t.range)} · ${esc(t.duration)}</p><p>Counter: ${esc(t.counter)}</p>${supportedAbilities.has(`${p.profile}:${which}`) ? button("Review power", `cast:${which}`) : ["nessa", "elf_nandor", "eonwe", "melkor_dark_architect"].includes(p.profile) && which === "field" ? `<p>Use Declared movement power below to select routes and formations.</p>` : ["ent_grove", "spider_brood"].includes(p.profile) && which === "support" ? `<p>Construct a paid physical crossing under Economy → Physical crossings.</p>` : p.profile === "eagle_eyrie" && which === "support" ? `<p>Use Eyrie Relay under Economy → Physical convoys: up to 20 existing P/K between your staffed landing ledges.</p>` : p.profile === "sauron" && which === "support" ? `<p>Prepare Redundant Supply for an existing depot convoy under Economy → Physical convoys.</p>` : p.profile === "manwe" && which === "support" ? `<p>Use Heralds on the Wind in Economy → Physical convoys to revise one existing convoy route without a relay.</p>` : repairPowerProfiles.has(p.profile) && which === "support" ? `<p>Use the paid repair action on the Economy tab. Exact target and worksite prerequisites are checked before commitment.</p>` : p.profile === "istari_saruman" && which === "support" ? `<p>Commission through the paid Resonant Sentinel recipe in an Orthanc Workshop on the Economy tab.</p>` : powerRouteHint(p.profile, which) ? `<p>${esc(powerRouteHint(p.profile, which))}</p>` : `<p class="reason">Unavailable: this adopted power needs a simulation domain not implemented yet. Source contract retained.</p>`}</article>`;
    })
    .join(
      "",
    )}${movementPanel(s)}${intelligencePanel(s)}${patrolPanel(s)}<h3>${esc(q.passive.name)} · source contract</h3><p>${esc(q.passive.effect)} ${esc(q.passive.limit)}</p><p class="fine">Older fifty kits await separate offensive review. Full effect implementation remains under verification.</p>`;
}
function diplomacyPanel(s: Match) {
  return `<p>Independent factions keep their heroes and creature authority. Treaty proposals become mutual only when both sides agree.</p><label>Faction<select id="diplomacy-target">${Object.values(
    s.players,
  )
    .filter((p) => p.seat !== seat)
    .map(
      (p) =>
        `<option value="${p.seat}">${esc(profile(p.profile).faction)} · ${effectiveRelation(s, seat, p.seat)}${s.players[seat].relations[p.seat] && s.players[seat].relations[p.seat] !== effectiveRelation(s, seat, p.seat) ? " (offer pending)" : ""}</option>`,
    )
    .join(
      "",
    )}</select></label>${["peace", "alliance", "war"].map((x) => button(`Review ${x}`, `diplomacy:${x}`)).join("")}<label>Stock transfer<select id="trade-resource"><option>P</option><option>M</option><option>K</option><option>E</option></select></label><label>Amount<input id="trade-amount" type="number" min="1" value="10"></label>${button("Review stock transfer", "trade")}<h2>The spare peg</h2><p>The boatwright turns a pale peg between two fingers. “The old letters will remain. The river can carry a name as easily as a boat.”</p><p>An original sandbox scene. The previous owner's whereabouts are unknown.</p>${button("Inspect repair", "story-repair")}${button("Ask about its owner", "story-owner")}<p>Diplomatic resource transfer: allied stocks only. Unique heroes, recipes and Melkor creatures never transfer.</p>`;
}
function settingsPanel() {
  return `<label>World motion<select id="world-motion"><option value="system" ${world.scene.getMotionMode() === "system" ? "selected" : ""}>Follow system · living world</option><option value="reduced" ${world.scene.getMotionMode() === "reduced" ? "selected" : ""}>Reduced · still world</option></select></label><p>Travel follows recorded routes. Working figures and distant birds are visual details; they do not advance turns. Reduced motion removes these effects; the Chronicle retains results.</p><label>Text size<select id="text-scale">${[1, 1.25, 1.5, 2].map((n) => `<option value="${n}" ${n === textScale ? "selected" : ""}>${n * 100}%</option>`).join("")}</select></label><p>Arrow keys pan. Mouse wheel zooms. Right-drag pans. Use the named list for keyboard selection; Escape cancels reviews. All orders have a confirmation step.</p><p>Sound is off; all warnings are visible. No camera flights or flashing effects.</p>${button("Export host checkpoint", "export")}${button("Import host checkpoint", "import")}${button("Continue saved checkpoint", "load")}${button("New match", "new")}`;
}
function networkPanel() {
  return `<h2>Private friends matches</h2><p>Host-authoritative WebRTC star, 2–4 players. The host can inspect and alter full state. Host loss stops play; restore a committed host checkpoint.</p><p id="network-status">${esc(netStatus)}</p><label><input id="local-network" type="checkbox"> Development same-device signaling (actual WebRTC, no remote reliability claim)</label><div class="button-row">${button("Host current match", "host-match")}${button("Reconnect seat", "reconnect")}${button("Close connection", "close-network")}</div><label>Private invitation<textarea id="invite" rows="5">${esc(inviteText)}</textarea></label><label>Your reserved seat<select id="seat"><option value="p2">Player 2</option><option value="p3">Player 3</option><option value="p4">Player 4</option></select></label>${button("Join private match", "join-match")}${network ? button("Commit my weekly orders", "ready") : ""}<p class="fine">Publishable Metered key supports signaling/ICE. Provider-enforced scoped room authorization requires a managed issuer; this unresolved production dependency is documented. Never expose a private provider key.</p>`;
}
function showReview(a: Action) {
  document.querySelector("dialog")?.remove();
  const d = document.createElement("dialog");
  d.setAttribute("aria-label", "Review commitment");
  const reason = validate(state!, command(a));
  const p = state!.players[seat];
  let info =
    "One strategic operation unless this is the hero’s personal commitment.";
  if(a.kind === "consent-veil") info="Grant or revoke permission for an allied Melian to veil this existing paid withdrawal. No additional operation or stock cost. Only this permission is shared, never your route. Revocation ends the current veil.";
  if(a.kind === "forest-power") info=a.mode==="departing"?"2 readiness and one tactical hero action. An existing paid ordinary withdrawal in woodland is required. Conceals only the trail for two phases; attacking or open ground ends it. Allied owners must explicitly consent to this withdrawal; great creatures are excluded.":a.mode==="wild-road"?"3 readiness, one weekly hero commitment and 1P provisional travel supplies. Personally patrol the actual survey within ordinary movement. Nearby minor convoy harassment may be deterred; real attacks are unchanged.":"3 readiness, one weekly hero commitment, 10M, 5K and one maintained Anchor. Requires continuous woodland and two owned staffed endpoints. Normal carrier capacity, cost and travel time remain. Close inspection, lost cover, captured endpoints or destroyed markers counter concealment.";
  if(a.kind === "release-forest") info="Release protection immediately without a refund or new operation. The maintained Anchor remains occupied until the week ends.";
  if(a.kind === "forest-entrance") info="One normal operation assigns Melian to remember anonymous dated passage at this existing staffed entrance. No hidden identities or future route knowledge.";
  if(a.kind === "harass-convoy") info="One ordinary operation attempts minor harassment of an identified adjacent hostile party. Convoy membership and travel outcome remain private. No extra attack, stolen stock or damage.";
  if(a.kind === "inspect-forest") info="One normal operation inspects adjacent observed ground for anonymous dated tracks. No hidden identity, numbers or future route is disclosed.";
  if(a.kind === "prepare-dream") info="3 readiness and one weekly hero commitment. Requires the existing paid 2P rest assignment and ordinary upkeep. Rest completion enables one matching coordination reduction within the following week; injury or interrupted rest cancels it. No extra action or HP protection.";
  if(a.kind === "replace-dream") info="Replace this preparation once using fresh owned nonempty verified night-patrol evidence. No additional payment or rest. Original expiry and single-use limit remain.";
  if (a.kind === "produce") {
    const r = recipe(p.profile, a.recipe)!;
    info = `${r.name}: ${cost(r.cost)}, ${r.turns} weeks. Facility queue, no strategic operation. ${a.recipe === "sentinel" ? "Also one personal commitment and 3 readiness; one active/pending construct." : ""} ${r.provisional ? "Provisional runtime tuning." : ""}`;
  }
  if (a.kind === "build") {
    info = `${buildings[a.building].name}: ${cost(buildings[a.building].cost)}; one operation; worker within 3 tiles; provisional instant construction.`;
  }
  if (a.kind === "declare-tactical" && a.order.kind === "ranged-attack")
    info =
      "One ordinary operation. Prepare one actual ordinary ranged shot for the next response phase; remain stationary with a visible target in normal weapon range. Cover, movement out of range, closing to melee, displacement or a valid interruption cancels it. No extra shot or resource refund.";
  if (a.kind === "formation-power")
    info =
      a.mode === "rendezvous"
        ? "2 readiness, tactical hero action and two ordinary movement operations. Two existing light companies synchronize actual paths. Blocking, separation or injury can interrupt; ordinary pursuit remains."
        : a.mode === "rotation"
          ? "3 readiness, weekly hero commitment and two ordinary movement operations. Two existing posted garrisons exchange physical positions along surveyed open routes; no new garrison or remote observation."
          : "3 readiness, weekly hero commitment,15P10M and three ordinary movement operations. Three existing supplied companies arrive separately at one surveyed rally to hold the declared site; no free attack or fourth operation. Written fallback preserves only its predeclared route when communication fails.";
  if (a.kind === "post-garrison" || a.kind === "release-post")
    info =
      "One normal operation. Assign or release an existing company at an existing staffed post; observations require actual local physical visibility, not remote map knowledge.";
  if (a.kind === "civilian")
    info =
      "One ordinary operation using a local real carrier and finite household inventory. People/stores use normal traversable routes, capacity and rations; foreign refuge requires mutual alliance and explicit current recipient consent. Hero methods also spend the weekly commitment and3 readiness. Read the household panel for exact method cost; no new population or stock is created.";
  if (a.kind === "surge-passage")
    info =
      "2 readiness and tactical hero action. Act on an existing shallow ford: disrupt an enemy footing or cover an actual friendly withdrawal lane. Higher ground and bracing counter it; this is not damage or a new crossing.";
  if (a.kind === "current-crossing")
    info =
      "3 readiness and weekly hero commitment. One existing loaded convoy gains one surveyed shallow river passage. Normal route length, cargo, movement, supplies and time remain; no teleportation.";
  if (a.kind === "coastal-landing")
    info =
      "2 readiness and tactical hero action. Prepare a real marine company aboard this vessel for ordinary paid unloading. Prevent only its new landing cohesion penalty, not existing losses or defensive damage.";
  if (a.kind === "habitat-power")
    info =
      a.mode === "old-trail"
        ? "3 readiness, weekly hero commitment, one worker operation,5M tools and provisional5P supplies. An actually surveyed existing woodland trail, real worker and surviving waystation are required; one weekly construction advance, light convoys only."
        : a.mode === "living-buttress"
          ? "3 readiness and weekly hero commitment. Shape existing mature woodland beside a staffed worksite into a temporary destructible barrier; support capacity applies. Provisional60 health, one week duration, no Materials salvage."
          : "3 readiness and weekly hero commitment. Tulkas replaces only the tagged lifter in an already paid construction phase. Main worker, full Materials and physical presence remain required; interruption pauses lifting.";
  if (a.kind === "assign-lifter")
    info =
      "One ordinary operation; assign a separate actual adjacent supplied worker to this paid lifting phase. Does not pay materials again or create workers.";
  if (a.kind === "block-trail")
    info =
      "One ordinary operation by an active armed party physically at this open woodland trail. Blocks subsequent convoy passage; creates no new terrain.";
  if (a.kind === "make-protection-kit")
    info =
      "5M and one ordinary operation; existing armored company beside a staffed workshop with metal access. Creates one carried consumable kit, not armor or a passive buff.";
  if (a.kind === "fit-guard")
    info =
      "Fit the Guard:2 readiness, tactical hero commitment and one ordinary company equipment operation. Consume its compatible carried kit for25% protection against one selected ordinary hazard for two phases. Flanks and other hazards bypass it.";
  if (a.kind === "temper-armor")
    info =
      "Temper for the Threat:3 readiness, weekly hero commitment,10M5K and one actual staffed workshop week. Replace the same armor's fitting with20% protection against one selected ordinary hazard and a provisional one-point movement burden. Existing durability is never restored.";
  if (a.kind === "scout-power")
    info =
      a.mode === "borrowed-shadow"
        ? "Borrowed Shadow:2 readiness,5K and a tactical hero action. One stationary silhouette at a visible point within12m for two response phases; no body, inventory, movement or attacks. Physical examination can dispel it."
        : "Witness Flare:2 readiness and a tactical hero action. An actually observed attack is required; a fixed dated location remains for two phases, never follows its attacker.";
  if (a.kind === "examine-contact")
    info =
      "One ordinary operation by the selected nearby active party. Examine this location physically; the same cost applies to a genuine or false contact. No remote hidden identity is disclosed.";
  if (a.kind === "hunting")
    info =
      a.mode === "survey"
        ? "Read the Hunting Ground:3 readiness,2P and the weekly hero commitment. Personally traverse this existing habitat using normal distance, supplies and fatigue; dated reports only, no new prey or provisions."
        : `One ordinary operation, actual normal travel and upkeep. Harvest at most${a.amount} existing animals from this finite site; no respawn. Defenders, injury or a blocked route can stop the hunt.`;
  if (a.kind === "fieldwork")
    info = `${cost(fieldworkCost(a.form))} and one ordinary operation; one staffed weekly construction advance, actual worker and open supply route. ${a.material} source access required. Durability and ordinary timing are provisional.`;
  if (a.kind === "load-repair-kit")
    info =
      "5M and one ordinary operation. An existing engineer company beside a staffed workshop carries this finite compatible kit; loading neither repairs a structure nor creates equipment.";
  if (a.kind === "brace-breach")
    info =
      "Brace the Breach:2 readiness, one tactical hero action and one ordinary engineer operation. Consume the carried compatible repair kit to restore at most15% of the existing gate or barricade's maximum integrity.";
  if (a.kind === "read-fault")
    info =
      "Read the Fault:2 readiness and one tactical hero action. Mark an observed damaged stone obstacle within3tiles (provisional unstable-surface interpretation). An actual engineer's normal equipped breach is required; no automatic destruction.";
  if (a.kind === "plant-crop")
    info =
      "10P seed + 5M tending inputs, one operation. Existing staffed plot and nearby irrigation; three paid 2P growth steps yield a fixed 30P. Failed crops yield nothing. Provisional ordinary economy.";
  if (a.kind === "advance-crop")
    info =
      "Season Brought Forward: 3 readiness and one personal commitment. Advance an existing crop by exactly one stage once this cycle. Fixed yield and remaining tending costs stay unchanged; unpaid tending is settled before harvest.";
  if (a.kind === "care")
    info = `5P + 2M normal care supplies; ${a.method === "este" ? "3 readiness and a personal commitment, one weekly result at existing shelter" : "one operation and two weekly care steps at a staffed recovery site"}. Existing injury only, no HP or casualty restoration. Movement and renewed injury cancel; threats or supply loss pause.`;
  if (a.kind === "care-power")
    info = `${profile(p.profile).support_power.name}: ${profile(p.profile).support_power.cost}. ${profile(p.profile).support_power.effect} Existing funded care remains occupied for at least a full weekly advance.`;
  if (a.kind === "logistics")
    info =
      a.mode === "lift"
        ? "Lift the Stranded:2 readiness and one tactical hero action; one existing willing light nonhero ally, exposed physical flight over two phases. Guarded or blocked landing pauses; no extra range, replacement body or cargo duplication."
        : `${a.method === "power" ? "Convoy Command:5P,3 readiness and personal commitment; bypass one ordinary organization step" : "One ordinary operation; organization and handling require two weekly steps"}. Only selected existing ships, unchanged total cargo and escort identities, normal capacities and no voyage speed bonus.`;
  if (a.kind === "inspect-trace")
    info =
      "Read the Broken Pattern: 2 readiness and one tactical hero action. Stationary inspection of a recent surviving trace at Vairë's actual location. A dated reconstruction cannot identify a unit or reveal its current position.";
  if (a.kind === "prepare-starwatch")
    info =
      "Starwatch Circuit: 3 readiness and one weekly personal commitment. Intermittently observe one existing physically surveyed open route this week. Cover and concealed crossings remain uncertain; no continuous tracking.";
  if (a.kind === "infrastructure-work")
    info =
      "5P + 10M and one operation; reserve existing crew and staffed receiving facility for two work steps. Existing obstruction or finite wreck only. Salvage then travels physically before stocks are credited; lost crew leaves lost cargo, never a refund.";
  if (a.kind === "infrastructure-power")
    info = `${profile(p.profile).support_power.name}: ${profile(p.profile).support_power.cost}. ${profile(p.profile).support_power.effect} Existing funded inputs and worker route remain required.`;
  if (a.kind === "worksite-support")
    info = `${profile(p.profile).support_power.name}: ${profile(p.profile).support_power.cost}. Reserve this surveyed route for one week; no new workers are created. Existing job pauses if workers withdraw.`;
  if (a.kind === "evacuate-worksite")
    info =
      "Use the existing one-use evacuation preparation. Transfer the site's existing staff along the still-open route to the refuge; no additional strategic operation. Blocked routes and occupied refuges prevent it.";
  if (a.kind === "declare-tactical" && a.order.kind !== "ranged-attack")
    info =
      a.order.kind === "fallback"
        ? `Reserve one operation for this physical fallback: ${a.order.route.map((p) => `(${p.x},${p.y})`).join(" → ")}. One response phase; normal movement costs and possible pursuit attacks apply.`
        : "Reserve one operation for one stationary normal pursuit attack; it only triggers if the observed target withdraws through an adjacent segment. No free movement or extra attack.";
  if (a.kind === "tactical-alarm")
    info =
      "One ordinary operation: raise an alarm for a nearby owned or mutually allied formation under a prepared or active Drowsing Veil. No extra movement or attack.";
  if (a.kind === "cancel-tactical")
    info =
      "Cancel the existing declaration without refunding its reserved operation. The party can then receive another legal order.";
  if (a.kind === "charge-power")
    info = `${profile(p.profile).field_power.name}: 2 readiness and one tactical hero commitment, plus ${a.mode === "hunter-interception" ? 0 : a.mode === "relief-charge" ? 1 : 2} reserved ordinary operations. Actual routes: ${a.members.map((m) => m.route.map((p) => `(${p.x},${p.y})`).join(" → ")).join("; ")}. ${profile(p.profile).field_power.counter} Moving the target or damaging participants interrupts the declaration; no preparation refund.`;
  if (a.kind === "tactical-power")
    info = `${profile(p.profile).field_power.name}: 2 readiness and one tactical hero action within the weekly commitment. ${profile(p.profile).field_power.effect} ${profile(p.profile).field_power.counter}`;
  if (a.kind === "naval-power") {
    const power = profile(p.profile)[
      a.power === "field" ? "field_power" : "support_power"
    ];
    info = `${power.name}: ${power.cost}. ${power.effect} ${power.counter}`;
  }
  if (a.kind === "intelligence-power")
    info = `${a.mode}: ${a.mode === "quiet-exchange" ? "10K and a real courier between two safehouses" : "10M + 5K and three linked beacons"}, 3 readiness and one weekly hero commitment. Records observed coordinates and dates only; silence is not proof of safety. Lost staffing, blocked routes or hidden activity can prevent delivery.`;
  if (a.kind === "sail")
    info = `One operation. Follow this declared water route at three tiles weekly: ${a.route.map((p) => `(${p.x},${p.y})`).join(" → ")}. Fog, waves, hostile shores and lost crew supply can delay or damage the voyage. Upkeep 2P + 1M weekly.`;
  if (a.kind === "load-cargo" || a.kind === "unload-cargo")
    info = `One operation; ${cost(a.cargo)} existing stocks. Staffed adjacent harbor required; one week handling plus local delay. Loading reserves cargo immediately, unloading returns it only after completed handling.`;
  if (
    a.kind === "embark" ||
    a.kind === "disembark" ||
    a.kind === "rescue-passenger"
  )
    info =
      "One operation and at least one handling week. Move the existing party physically; occupied slots, hostile landings and transport assignments are checked. No duplicate units.";
  if (a.kind === "repair-ship")
    info =
      "20M + 5K and one operation; two calm weeks at a staffed harbor or rescue yard restore 20 existing hull HP. Lost crew supply or waves pause repair.";
  if (a.kind === "trade")
    info = `Transfer ${a.amount}${a.resource} to ${a.target}; one operation; mutual alliance required.`;
  if (a.kind === "call")
    info =
      "Call this discovered existing living ID: 3 readiness + 20P + 20M + 10E, hero commitment, full supply/great-creature reservation. It remains at its real location; subsequent movement uses real routes.";
  if (a.kind === "surrender")
    info =
      "End this captive incarnation. Equipment drops once; the slot opens for a full paid recreation. This is not free release.";
  if (a.kind === "recover-cargo")
    info =
      "Reach the lost cargo tile with the selected free ordinary carrier. Pay 1P and one operation; reuse the same cargo identity, then load for one week and travel normally.";
  if (a.kind === "reroute-convoy")
    info =
      a.method === "power"
        ? "Heralds on the Wind: 3 readiness and one personal commitment. Manwë replaces the staffed relay; cargo, route, carrier movement and normal upkeep remain."
        : "Revised route: staffed connected relay, 2K and one operation. No immediate movement or cargo refund.";
  if (a.kind === "eyrie-relay")
    info = `Eyrie Relay: carry up to 20 existing P/K, pay 10P + 5M plus 3 readiness and one hero commitment. Skywarden must physically fly the complete route within normal movement between owned staffed landing ledges. Contested landings pause; cargo loss is recoverable, never duplicated. Reserved cargo: ${cost(a.cargo)}.`;
  if (a.kind === "movement-power")
    info = `Prepare ${profile(p.profile).field_power.name}: ${p.profile === "melkor_dark_architect" ? 3 : 2} readiness and ${p.profile === "melkor_dark_architect" ? "weekly hero commitment" : "one tactical hero action within the encounter"}; reserve ${reason ? "the full route’s" : movementPowerOperations(state!, seat, a)} ordinary operations across all planned phases. One response phase before physical movement; preparation can be interrupted. ${a.members.map((m) => `${m.unit} → (${m.to.x},${m.to.y})`).join("; ")}`;
  if (a.kind === "crossing")
    info =
      "Physical crossing: 10P + 20M, 3 readiness and one weekly hero commitment. Existing prepared anchors, surveyed 6–15 metre gap and a real worker required. One weekly construction advance (provisional); loss of anchors or staff disables travel. No extra movement.";
  if (a.kind === "break-crossing")
    info =
      "Strike a hostile crossing beside your selected armed formation: one strategic operation, ordinary attack strength damages its structure. Destroyed crossings no longer provide a route.";
  if (a.kind === "rest")
    info =
      "Paid rest: 2P and one operation; occupy a staffed refuge for one weekly queue advance. Recover 2 existing fatigue, with source-specific local hero bonuses. No HP healing; absence or lost supply pauses. Cancellation returns 1P. Provisional ordinary tuning.";
  if (a.kind === "convoy")
    info = `Physical convoy ${a.carrier}: reserve ${cost(a.cargo)} as real cargo plus 1P consumed loading supplies; one operation, loading one week, ordinary travel, unloading one week. Carrier is busy; loss leaves cargo at its location, never an automatic refund.`;
  if (a.kind === "prepare-supply")
    info = `Redundant Supply: 10M + 5K, 3 readiness and one hero commitment. Reserve this surveyed alternate route for the existing convoy this week; it activates once only if the original route closes. No free movement or replacement cargo. Route: ${a.route.map((p) => `(${p.x},${p.y})`).join(" → ")}`;
  if (a.kind === "repair")
    info = `Repair ${a.target} at ${a.facility}: ${cost(repairCost(state!, seat, a.method))}. ${a.method === "power" ? "3 readiness and one personal commitment. " + profile(p.profile).support_power.effect : "One operation, two weeks; up to 25% existing durability."} Requires staff, matching sources and target beside worksite; interruption pauses the occupied queue.`;
  if (a.kind === "cast") {
    const q = powerCost(p, a.power);
    info = `${q.source.name}: ${q.source.cost}. ${q.source.duration}. Counter: ${q.source.counter}`;
  }
  if (a.kind === "move")
    info = `Move ${a.unit} to (${a.x}, ${a.y}). ${a.unit === p.hero.id ? "One hero commitment" : "One strategic operation"}. Other orders may change the route before resolution.`;
  info = nightDescription(a) ?? equipmentLogisticsDescription(a) ?? info;
  d.innerHTML = `<h2>Review ${esc(a.kind)}</h2><p>${esc(info)}</p><p>${esc(reason || "Ready to reserve. Final legality is checked at resolution; invalidated orders charge nothing.")}</p><div class="button-row"><button id="confirm" class="primary" ${reason ? "disabled" : ""}>Confirm order</button><button id="cancel-review">Cancel</button></div>`;
  document.body.append(d);
  d.showModal();
  d.querySelector("#cancel-review")!.addEventListener("click", () => {
    pending = undefined;
    d.close();
    d.remove();
    opener?.focus();
  });
  d.addEventListener("cancel", (event) => {
    event.preventDefault();
    pending = undefined;
    d.close();
    d.remove();
    opener?.focus();
  });
  d.querySelector("#confirm")!.addEventListener("click", () => {
    try {
      if (network) {
        notice = network.order(command(a));
      } else {
        const r = submit(state!, command(a));
        state = r.state;
        notice = r.reason;
      }
      pending = undefined;
      d.close();
      d.remove();
      render();
    } catch (e) {
      d.close();
      d.remove();
      pending = undefined;
      showError(e);
    }
  });
}
function review(a: Action) {
  pending = a;
  opener = document.activeElement as HTMLElement;
  showReview(a);
}
function bind() {
  root()
    .querySelectorAll<HTMLButtonElement>("[data-action]")
    .forEach((b) => (b.onclick = () => handle(b.dataset.action!)));
  const entity = root().querySelector<HTMLSelectElement>("#entity");
  if (entity)
    entity.onchange = () => {
      selected = entity.value;
      selectedTile = undefined;
      render();
      root().querySelector<HTMLSelectElement>("#entity")?.focus();
      world.scene.locate(selected);
    };
  const facility = root().querySelector<HTMLSelectElement>("#facility");
  if (facility)
    facility.onchange = () => {
      selected = facility.value;
      render();
      root().querySelector<HTMLSelectElement>("#facility")?.focus();
    };
  const motion = root().querySelector<HTMLSelectElement>("#world-motion");
  if (motion) motion.onchange = () => {
    world.scene.setMotionMode(motion.value === "reduced" ? "reduced" : "system");
    try { localStorage.setItem("silmarillion:motion", world.scene.getMotionMode()); } catch { /* In-memory preference works when storage is unavailable. */ }
    render();
    root().querySelector<HTMLSelectElement>("#world-motion")?.focus();
  };
  const scale = root().querySelector<HTMLSelectElement>("#text-scale");
  if (scale)
    scale.onchange = () => {
      textScale = Number(scale.value);
      render();
      root().querySelector<HTMLSelectElement>("#text-scale")?.focus();
    };
}
const value = (id: string) =>
  (document.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement)
    ?.value;
async function handle(action: string) {
  try {
    if (action === "rules-terrain") {
      world.scene.setRulesTerrain(!world.scene.getRulesTerrain());
      render();
      document.querySelector<HTMLButtonElement>('[data-action="rules-terrain"]')?.focus();
      return;
    }
    if (action === "toggle-panel") {
      panelHidden = !panelHidden;
      render();
      return;
    }
    if (action.startsWith("tab:")) {
      panelHidden = false;
      tab = action.slice(4);
      render();
      return;
    }
    if (action === "network") {
      tab = "network";
      if (state) render();
      else {
        notice =
          "Multiplayer adapter setup is documented in docs/guides/MULTIPLAYER.md; local play needs no credentials.";
        setup();
      }
      return;
    }
    if (action === "load") {
      const saved = await loadCheckpoint();
      if (!saved) throw new Error("No committed checkpoint found");
      network?.close();
      network = undefined;
      state = saved.state;
      restoredTokens = saved.seatTokens;
      restoredAssignments = saved.assignments;
      selected = "p1:core";
      seat = "p1";
      tab = "world";
      notice =
        "Restored committed checkpoint. Guest seats must reauthenticate.";
      render();
      world.scene.locate(selected);
      return;
    }
    if (action === "import") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async () => {
        try {
          const file = input.files?.[0];
          if (!file) return;
          if (file.size > 8_000_000) throw new Error("Checkpoint too large");
          const saved = decodeCheckpoint(await file.text());
          network?.close();
          network = undefined;
          state = saved.state;
          restoredTokens = saved.seatTokens;
          restoredAssignments = saved.assignments;
          await saveCheckpoint(state, saved.assignments, saved.seatTokens);
          notice = "Imported compatible authoritative checkpoint";
          render();
        } catch (e) {
          showError(e);
        }
      };
      input.click();
      return;
    }
    if (!state) return;
    if (action.startsWith("dialogue:")) {
      const scene = situatedScenes(preview(state, seat), seat, selected).find(
        (s) => s.id === action.slice(9),
      );
      if (!scene)
        throw new Error(
          "This conversation's circumstances have changed; inspect the place again.",
        );
      review(scene.action);
      return;
    }
    if (action === "host-match" || action === "join-match") {
      const dev = (document.querySelector("#local-network") as HTMLInputElement)
        ?.checked;
      const invitation = value("invite");
      const targetSeat = value("seat");
      network?.close();
      network = new MatchSession(
        (next, identity) => {
          state = next;
          seat = identity;
          if (!state.units[selected] && !state.facilities[selected])
            selected = `${seat}:core`;
          render();
        },
        (message) => {
          netStatus = message;
          notice = message;
          render();
        },
      );
      if (action === "host-match")
        inviteText = await network.host(state, dev, restoredTokens);
      else {
        inviteText = invitation;
        await network.join(invitation, targetSeat);
      }
      render();
      return;
    }
    if (action === "reconnect") {
      await network?.reconnect();
      return;
    }
    if (action === "close-network") {
      network?.close();
      network = undefined;
      state = undefined;
      netStatus = "Connection closed; restore checkpoint to resume multiplayer";
      render();
      return;
    }
    if (action === "ready") {
      notice =
        network?.order(command({ kind: "ready" })) ?? "No match connection";
      render();
      return;
    }
    if (action === "resolve" && network) {
      await network.resolve();
      return;
    }
    if (action === "resolve") {
      for (const p of Object.values(state.players).filter(
        (p) => p.ai && !p.eliminated,
      )) {
        for (const a of planAI(state, p.seat)) {
          const o: Order = {
            id: `${p.seat}:${state.turn}:${state.nextSeq[p.seat]}`,
            seat: p.seat,
            seq: state.nextSeq[p.seat],
            turn: state.turn,
            revision: state.revision,
            action: a,
          };
          const r = submit(state, o);
          if (!r.ok) throw new Error(`AI rejected: ${r.reason}`);
          state = r.state;
        }
      }
      state = resolveWeek(state);
      if (!state.combatPhase)
        await saveCheckpoint(state, ...checkpointMetadata());
      notice = state.combatPhase
        ? `Tactical phase ${state.combatPhase}: counter warnings; production waits.`
        : `Week ${state.turn} committed and saved.`;
      render();
      return;
    }
    if (action === "save" && network && !network.authority)
      throw new Error(
        "Guests receive filtered views; only host checkpoints restore a match",
      );
    if (action === "save") {
      await saveCheckpoint(state, ...checkpointMetadata());
      notice = "Committed turn checkpoint saved atomically.";
      render();
      return;
    }
    if (action === "export") {
      download(
        network && !network.authority
          ? network.guestExport(state)
          : encodeCheckpoint(state, ...checkpointMetadata()),
        "silmarillion-checkpoint.json",
      );
      return;
    }
    if (action === "new") {
      network?.close();
      network = undefined;
      state = undefined;
      tab = "world";
      setup();
      return;
    }
    if (action === "zoom-in" || action === "zoom-out") {
      world.scene.zoom(action === "zoom-in" ? 0.15 : -0.15);
      return;
    }
    if (action === "locate") {
      world.scene.locate(selected);
      return;
    }
    if (action.startsWith("site:")) {
      world.scene.locate(action.slice(5));
      return;
    }
    if (action === "tutorial-next") {
      tutorialStep = Math.min(tutorialStep + 1, tutorialCopy.length - 1);
      render();
      return;
    }
    if (action === "tutorial-close") {
      tutorial = false;
      render();
      return;
    }
    if (action.startsWith("produce:")) {
      const parts = action.split(":");
      const recipeId = parts.pop()!;
      const facility = parts.slice(1).join(":");
      review({ kind: "produce", facility, recipe: recipeId });
      return;
    }
    if (action.startsWith("cancel:")) {
      review({ kind: "cancel", facility: action.slice(7) });
      return;
    }
    if (action === "plant-crop") {
      review({
        kind: "plant-crop",
        plot: value("crop-plot"),
        irrigation: value("crop-irrigation"),
      });
      return;
    }
    if (action === "advance-crop") {
      review({ kind: "advance-crop", crop: value("crop-cycle") });
      return;
    }
    if (action === "cancel-care") {
      review({ kind: "cancel-care", unit: value("care-unit") });
      return;
    }
    if (action.startsWith("care:")) {
      const method = action === "care:este" ? "este" : "ordinary";
      review({
        kind: "care",
        unit: value("care-unit"),
        method,
        ...(method === "ordinary" ? { facility: value("care-facility") } : {}),
      });
      return;
    }
    if (action === "care-power") {
      review({
        kind: "care-power",
        mode:
          state!.players[seat].profile === "istari_grove"
            ? "grove"
            : "finarfin",
        facility: value("care-facility"),
        units: [value("care-unit"), value("care-unit-2")].filter(Boolean),
      });
      return;
    }
    if (action === "intelligence-power") {
      const quiet = state!.players[seat].profile === "istari_veil";
      review({
        kind: "intelligence-power",
        mode: quiet ? "quiet-exchange" : "beacon-concord",
        stations: Array.from({ length: quiet ? 2 : 3 }, (_, i) =>
          value("intel-station-" + i),
        ),
        ...(quiet
          ? { report: value("intel-report"), carrier: value("intel-carrier") }
          : {}),
      });
      return;
    }
    if (action === "logistics:lift") {
      review({
        kind: "logistics",
        mode: "lift",
        unit: value("lift-unit"),
        to: { x: Number(value("lift-x")), y: Number(value("lift-y")) },
      });
      return;
    }
    if (action === "logistics:ordinary" || action === "logistics:power") {
      const loads = [0, 1, 2]
        .map((i) => ({
          ship: value("logistics-ship-" + i),
          passenger: value("logistics-passenger-" + i) || null,
          cargo: Object.fromEntries(
            ["P", "M", "K", "E"].map((k) => [
              k,
              Number(value(`logistics-${i}-${k}`)),
            ]),
          ) as Stock,
        }))
        .filter((x) => x.ship);
      review({
        kind: "logistics",
        mode: "redistribute",
        method: action === "logistics:power" ? "power" : "ordinary",
        harbor: value("logistics-harbor"),
        loads,
      });
      return;
    }
    if (action === "prepare-ranged") {
      review({
        kind: "declare-tactical",
        order: {
          kind: "ranged-attack",
          unit: selected,
          target: value("target"),
        },
      });
      return;
    }
    const domainOrder = forestAction(action,state,seat,value) ?? dreamAction(action, preview(state, seat), value) ?? nightAction(action, state, seat, value) ?? equipmentLogisticsAction(action, state, seat, value);
    if (domainOrder) { review(domainOrder); return; }
    const formationOrder = formationAction(action, state, seat, value);
    if (formationOrder) {
      review(formationOrder);
      return;
    }
    const civilianOrder = civilianAction(action, state, seat, value);
    if (civilianOrder) {
      review(civilianOrder);
      return;
    }
    const shoreOrder = shoreAction(action, state, seat, value);
    if (shoreOrder) {
      review(shoreOrder);
      return;
    }
    const habitatOrder = habitatAction(action, value);
    if (habitatOrder) {
      review(habitatOrder);
      return;
    }
    if (action === "make-protection-kit" || action === "temper-armor") {
      review({
        kind: action,
        unit: value("service-unit"),
        facility: value("service-facility"),
        hazard: value("service-hazard") as OrdinaryHazard,
      });
      return;
    }
    if (action === "fit-guard") {
      review({
        kind: "fit-guard",
        unit: value("service-unit"),
        hazard: value("service-hazard") as OrdinaryHazard,
      });
      return;
    }
    if (action === "borrowed-shadow" || action === "witness-flare") {
      review(
        action === "borrowed-shadow"
          ? {
              kind: "scout-power",
              mode: "borrowed-shadow",
              point: {
                x: Number(value("scout-x")),
                y: Number(value("scout-y")),
              },
            }
          : {
              kind: "scout-power",
              mode: "witness-flare",
              target: value("target"),
            },
      );
      return;
    }
    if (action === "examine-contact") {
      review({
        kind: "examine-contact",
        unit: selected,
        point: { x: Number(value("scout-x")), y: Number(value("scout-y")) },
      });
      return;
    }
    if (action === "hunt" || action === "survey-prey") {
      const s = preview(state!, seat),
        survey = action === "survey-prey",
        unit = survey ? s.players[seat].hero.id : value("hunt-unit"),
        u = s.units[unit],
        site = s.preySites[value("hunt-prey")];
      if (!u || (!survey && !site))
        throw new Error("Select an existing party and observed prey site");
      const to = survey
          ? { x: Number(value("hunt-x")), y: Number(value("hunt-y")) }
          : site,
        route = path(s, u, to, u.flying, u);
      if (!route) throw new Error("No physical route to this destination");
      review(
        survey
          ? { kind: "hunting", mode: "survey", unit, route }
          : {
              kind: "hunting",
              mode: "hunt",
              unit,
              prey: site.id,
              amount: Number(value("hunt-amount")),
              route,
            },
      );
      return;
    }
    if (action === "fieldwork") {
      review({
        kind: "fieldwork",
        worker: value("field-worker"),
        facility: value("field-facility"),
        form: value("field-form") as FieldworkKind,
        material: value("field-material") as StructuralMaterial,
        x: Number(value("field-x")),
        y: Number(value("field-y")),
      });
      return;
    }
    if (action === "load-repair-kit") {
      review({
        kind: "load-repair-kit",
        unit: value("field-engineer"),
        facility: value("field-facility"),
        material: value("field-material") as StructuralMaterial,
      });
      return;
    }
    if (action === "brace-breach") {
      review({
        kind: "brace-breach",
        unit: value("field-engineer"),
        target: value("field-target"),
      });
      return;
    }
    if (action === "read-fault") {
      review({ kind: "read-fault", target: value("field-target") });
      return;
    }
    if (action === "charge-power") {
      const view = preview(state!, seat),
        id = view.players[seat].profile;
      const mode =
        id === "orome"
          ? "hunter-interception"
          : id === "human_rohan"
            ? "relief-charge"
            : "split-pursuit";
      const members = [0, ...(mode === "split-pursuit" ? [1] : [])].map((i) => {
        const unit = value(`charge-unit-${i}`),
          u = view.units[unit];
        if (!u) throw new Error("Select an existing approaching party");
        const route = path(
          view,
          u,
          {
            x: Number(value(`charge-x-${i}`)),
            y: Number(value(`charge-y-${i}`)),
          },
          u.flying,
          u,
        );
        if (!route) throw new Error("No physical route to that endpoint");
        return { unit, route };
      });
      review({
        kind: "charge-power",
        mode,
        target: value("charge-target"),
        members,
      });
      return;
    }
    if (action === "inspect-trace") {
      const h = state!.units[state!.players[seat].hero.id];
      if (!h) throw new Error("Living hero required");
      review({ kind: "inspect-trace", x: h.x, y: h.y });
      return;
    }
    if (action === "prepare-starwatch") {
      review({ kind: "prepare-starwatch", survey: value("patrol-survey") });
      return;
    }
    if (action === "control-power") {
      review({
        kind: "tactical-power",
        mode:
          state!.players[seat].profile === "tulkas"
            ? "grapple"
            : "drowsing-veil",
        target: value("target"),
      });
      return;
    }
    if (action === "tactical-alarm") {
      review({
        kind: "tactical-alarm",
        unit: selected,
        target: value("target"),
      });
      return;
    }
    if (action === "infrastructure-work") {
      review({
        kind: "infrastructure-work",
        site: value("infra-site"),
        worker: value("infra-worker"),
        facility: value("infra-facility"),
      });
      return;
    }
    if (action === "infrastructure-power") {
      review({ kind: "infrastructure-power", job: value("infra-job") });
      return;
    }
    if (action === "worksite-support") {
      const site = value("worksite-source"),
        refuge = value("worksite-refuge"),
        from = state!.facilities[site],
        to = state!.facilities[refuge];
      if (!from || !to)
        throw new Error("Choose existing staffed site and refuge");
      const route = path(state!, from, to);
      if (!route) throw new Error("No physical route to refuge");
      review({ kind: "worksite-support", site, refuge, route });
      return;
    }
    if (action === "evacuate-worksite") {
      review({ kind: "evacuate-worksite", id: value("worksite-plan") });
      return;
    }
    if (action === "cancel-tactical") {
      review({ kind: "cancel-tactical", unit: selected });
      return;
    }
    if (action === "declare-pursuit") {
      review({
        kind: "declare-tactical",
        order: { kind: "pursuit", unit: selected, target: value("target") },
      });
      return;
    }
    if (action === "declare-fallback" || action === "tactical-power") {
      const u = state!.units[selected];
      if (!u) throw new Error("Select an ordinary party first");
      if (
        action === "tactical-power" &&
        state!.players[seat].profile === "elf_fingolfin"
      )
        review({
          kind: "tactical-power",
          mode: "shielded-withdrawal",
          unit: selected,
        });
      else {
        const route = path(
          state!,
          u,
          { x: Number(value("dest-x")), y: Number(value("dest-y")) },
          u.flying,
          u,
        );
        if (!route) throw new Error("No physical route to that endpoint");
        if (action === "declare-fallback")
          review({
            kind: "declare-tactical",
            order: { kind: "fallback", unit: selected, route },
          });
        else
          review({
            kind: "tactical-power",
            mode: "signal-flash",
            unit: selected,
            route,
          });
      }
      return;
    }
    if (action.startsWith("naval-power:")) {
      review({
        kind: "naval-power",
        power: action.endsWith("field") ? "field" : "support",
        ship: value("fleet-ship") || undefined,
        x: Number(value("fleet-x")),
        y: Number(value("fleet-y")),
      });
      return;
    }
    if (action.startsWith("fleet:")) {
      const kind = action.slice(6),
        ship = value("fleet-ship"),
        unit = value("fleet-unit");
      const destination = {
        x: Number(value("fleet-x")),
        y: Number(value("fleet-y")),
      };
      if (kind === "sail") {
        const vessel = state!.vessels[ship];
        const route = vessel && navalRoute(state!, vessel, destination);
        if (!route)
          throw new Error("No continuous water route to this destination");
        review({ kind, ship, route });
      } else if (kind === "load-cargo" || kind === "unload-cargo") {
        const cargo = Object.fromEntries(
          ["P", "M", "K", "E"].map((k) => [k, Number(value("fleet-" + k))]),
        ) as Stock;
        review({ kind, ship, cargo });
      } else if (kind === "embark" || kind === "rescue-passenger")
        review({ kind, ship, unit });
      else if (kind === "disembark")
        review({ kind, ship, unit, landing: destination });
      else if (kind === "repair-ship") review({ kind, ship });
      return;
    }
    if (action === "rescue") {
      review({ kind: "rescue", unit: selected, target: seat });
      return;
    }
    if (action === "clear-zone") {
      review({ kind: "clear-zone", unit: selected, zone: value("zone") });
      return;
    }
    if (action === "recover-cargo") {
      review({
        kind: "recover-cargo",
        convoy: value("existing-convoy"),
        carrier: value("convoy-carrier"),
      });
      return;
    }
    if (action.startsWith("reroute:")) {
      review({
        kind: "reroute-convoy",
        convoy: value("existing-convoy"),
        destination: value("convoy-destination"),
        method: action === "reroute:power" ? "power" : "ordinary",
        ...(value("convoy-relay") ? { relay: value("convoy-relay") } : {}),
      });
      return;
    }
    if (action === "movement-power") {
      const members = [0, 1, 2]
        .filter((i) => value(`plan-unit-${i}`))
        .map((i) => ({
          unit: value(`plan-unit-${i}`),
          to: {
            x: Number(value(`plan-x-${i}`)),
            y: Number(value(`plan-y-${i}`)),
          },
        }));
      review({ kind: "movement-power", members });
      return;
    }
    if (action === "crossing") {
      review({
        kind: "crossing",
        from: value("cross-from"),
        to: value("cross-to"),
        crew: value("cross-crew"),
      });
      return;
    }
    if (action === "break-crossing") {
      review({
        kind: "break-crossing",
        unit: selected,
        crossing: value("cross-target"),
      });
      return;
    }
    if (action === "rest") {
      review({
        kind: "rest",
        unit: value("rest-unit"),
        facility: value("rest-facility"),
      });
      return;
    }
    if (action === "prepare-supply") {
      const c = state!.convoys[value("existing-convoy")];
      const carrier = c && state!.units[c.carrier];
      const destination = c && state!.facilities[c.destination];
      const waypoint = {
        x: Number(value("supply-x")),
        y: Number(value("supply-y")),
      };
      const first = carrier && path(state!, carrier, waypoint, carrier.flying);
      const second =
        carrier &&
        destination &&
        path(state!, waypoint, destination, carrier.flying);
      review({
        kind: "prepare-supply",
        convoy: value("existing-convoy"),
        route: first && second ? [...first, ...second.slice(1)] : [],
      });
      return;
    }
    if (action === "eyrie-relay") {
      review({
        kind: "eyrie-relay",
        origin: value("convoy-origin"),
        destination: value("convoy-destination"),
        cargo: {
          P: Number(value("convoy-P")),
          M: Number(value("convoy-M")),
          K: Number(value("convoy-K")),
          E: Number(value("convoy-E")),
        },
      });
      return;
    }
    if (action === "convoy") {
      review({
        kind: "convoy",
        carrier: value("convoy-carrier"),
        origin: value("convoy-origin"),
        destination: value("convoy-destination"),
        cargo: {
          P: Number(value("convoy-P")),
          M: Number(value("convoy-M")),
          K: Number(value("convoy-K")),
          E: Number(value("convoy-E")),
        },
      });
      return;
    }
    if (action.startsWith("repair:")) {
      review({
        kind: "repair",
        facility: value("facility"),
        target: value("repair-target"),
        method: action === "repair:power" ? "power" : "ordinary",
      });
      return;
    }
    if (action === "equip") {
      review({ kind: "equip", unit: selected, item: value("item") });
      return;
    }
    if (action === "annex") {
      review({ kind: "annex", unit: selected, facility: value("target") });
      return;
    }
    if (action === "trade") {
      review({
        kind: "trade",
        target: value("diplomacy-target"),
        resource: value("trade-resource") as keyof Stock,
        amount: Number(value("trade-amount")),
      });
      return;
    }
    if (action.startsWith("perk:")) {
      review({
        kind: "perk",
        branch: action.slice(5) as "guard" | "path" | "craft",
      });
      return;
    }
    if (action === "move") {
      review({
        kind: "move",
        unit: selected,
        x: Number(value("dest-x")),
        y: Number(value("dest-y")),
      });
      return;
    }
    if (action === "build") {
      const at =
        selectedTile ?? state.units[selected] ?? state.facilities[selected];
      if (!at) throw new Error("Select a construction tile");
      review({ kind: "build", building: value("building"), x: at.x, y: at.y });
      return;
    }
    if (action === "attack" || action === "capture") {
      const target = value("target");
      if (
        action === "attack" &&
        (state!.vessels[target] ||
          state!.vesselContacts?.some((v) => v.id === target))
      )
        review({ kind: "attack-ship", unit: selected, ship: target });
      else review({ kind: action, unit: selected, target });
      return;
    }
    if (
      action === "recover" ||
      action === "surrender" ||
      action === "exchange"
    ) {
      review({ kind: action });
      return;
    }
    if (action === "call" || action === "land") {
      review({ kind: action, unit: selected });
      return;
    }
    if (action.startsWith("cast:")) {
      review({
        kind: "cast",
        power: action.slice(5) as "field" | "support",
        target:
          document.querySelector<HTMLInputElement>("#point-cast")?.checked &&
          action === "cast:field"
            ? "terrain"
            : value("target"),
        ...(document.querySelector<HTMLInputElement>("#point-cast")?.checked &&
        action === "cast:field"
          ? { x: Number(value("power-x")), y: Number(value("power-y")) }
          : {}),
      });
      return;
    }
    if (action.startsWith("diplomacy:")) {
      review({
        kind: "diplomacy",
        target: value("diplomacy-target"),
        relation: action.slice(10) as "peace" | "alliance" | "war",
      });
      return;
    }
    if (action === "story-repair")
      notice =
        "Observed: the repair bears weight. No resources or commitments spent.";
    if (action === "story-owner")
      notice =
        "Testimony: a household left upstream. Its present location is unknown. No hidden reward.";
    if (action === "network-help")
      notice =
        "See docs/guides/MULTIPLAYER.md for public configuration, trust boundary and unverified service gates.";
    render();
  } catch (e) {
    showError(e);
  }
}
export function start() {
  window.addEventListener("pagehide", () => network?.close());
  world = bootWorld(
    (id) => {
      selected = id;
      selectedTile = undefined;
      render();
    },
    (pos) => {
      selectedTile = pos;
      if (tab === "world") render();
    },
  );
  try { world.scene.setMotionMode(localStorage.getItem("silmarillion:motion") === "reduced" ? "reduced" : "system"); } catch { /* System setting remains available. */ }
  setup();
}

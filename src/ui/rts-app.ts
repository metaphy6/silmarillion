import "./rts-style.css";
import { profile, limits } from "../content/catalog";
import {
  createRTS,
  stepRTS,
  commandRTS,
  serializeRTS,
  parseRTS,
  isVisible,
  placementReason,
  buildingSpec,
  unitSpec,
  type RTSState,
  type RTSCommand,
  type RTSOrder,
  type BuildingKind,
  type UnitKind,
} from "../simulation/rts";
import { createRtsWorld } from "../render/rts-world";
import {
  changeSelection,
  defaultHotkeys,
  parseHotkeys,
  TickClock,
  type Hotkeys,
} from "./rts-controls";
import type { Stock } from "../simulation/types";

const saveKey = "silmarillion-rts-save-v1";
const hotkeyKey = "silmarillion-rts-hotkeys-v1";
const stockNames = {
  P: "Provisions",
  M: "Materials",
  K: "Lore supplies",
  E: "Essence",
};
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const price = (s: Stock) =>
  Object.entries(s)
    .filter(([, v]) => v)
    .map(([k, v]) => `${v}${k}`)
    .join(" + ") || "No stock cost";
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;

export function startRTS() {
  document.body.classList.add("rts");
  let state: RTSState = createRTS(1947),
    selected: string[] = [],
    paused = true,
    started = false,
    buildMode: BuildingKind | undefined,
    attackMode = false,
    rallyMode = false,
    abilityMode = false;
  let keys: Hotkeys = { ...defaultHotkeys },
    scale = "1",
    reduced = false;
  try {
    keys =
      parseHotkeys(JSON.parse(localStorage.getItem(hotkeyKey) || "null")) ||
      keys;
    scale = localStorage.getItem("rts-text-scale") || "1";
    reduced = localStorage.getItem("rts-reduced") === "true";
  } catch {
    /* Broken preferences use defaults. */
  }
  const groups = new Map<string, string[]>();
  const app = $("app");
  app.innerHTML = `<header class="rts-top"><div class="rts-brand"><div class="eyebrow">THE LONG KEEPING</div><div id="rts-clock" class="rts-tick">Paused · 0:00</div><small id="rts-supply"></small></div><div class="rts-stocks">${Object.entries(
    stockNames,
  )
    .map(
      ([k, v]) =>
        `<div class="rts-stock"><strong id="stock-${k}">${k} 0</strong><span>${v}</span></div>`,
    )
    .join(
      "",
    )}</div><button id="rts-pause">Pause</button><button id="rts-save">Save skirmish</button><button id="rts-settings">Settings</button></header>
 <aside class="rts-objective"><strong>Cross-era sandbox · The Two Fords</strong><small id="rts-objective">Gondor vs Saruman's White Tower · Destroy every rival stronghold.</small><button id="rts-alert" hidden></button></aside>
 <details class="rts-help"><summary>Battlefield guide</summary><p>Workers carry stocks home. Use the mustering hall, then build a workshop for siege. Protect your deliveries; raid the rival's workers.</p><p>Drag to select · Shift adds / queues · Right-click orders · A then click: attack-move · S: stop · H: hold · Ctrl+1–9: save group · 1–9: recall · arrows / middle-drag: pan · wheel: zoom.</p><p>Two river crossings offer alternate approaches. Scout before committing your siege engines.</p><p>All ordinary prices and seconds are provisional.</p></details>
 <div class="rts-notice" id="rts-feedback" role="status" aria-live="polite"></div>
 <section class="rts-dock" id="controls" aria-label="Battlefield commands"><div><canvas class="rts-map" id="rts-minimap" width="288" height="192" tabindex="0" aria-label="Tactical minimap. Click to center; right-click to order. Keyboard coordinates below."></canvas><span class="rts-map-label">◆ Own · ▲ Hostile · shaded: unseen</span><div class="rts-keyboard"><label>X <input id="order-x" type="number" min="0" max="47" value="16" aria-label="Order X coordinate"></label><label>Y <input id="order-y" type="number" min="0" max="31" value="16" aria-label="Order Y coordinate"></label></div></div>
 <div class="rts-selection"><label for="rts-entity">Named battlefield selection</label><select id="rts-entity"></select><h2 id="rts-name">Your settlement</h2><p id="rts-detail"></p><p id="rts-hero"></p><button id="rts-locate">Locate selection</button></div>
 <div><div class="rts-actions" id="rts-actions"></div><div class="rts-queue" id="rts-queue"></div></div></section>
 <dialog id="rts-intro" class="rts-intro"><div class="eyebrow">A LIVING BATTLEFIELD</div><h1>The Two Fords</h1><p><strong>Gondor against Saruman's White Tower.</strong> Raise a settlement, defend its workers and take the river crossings. Train a shield line and bring siege engines to the rival stronghold.</p><p>Cross-era sandbox · Original invented basin · Real-time local skirmish. The 54 factions / 55 identities remain available in the weekly game; this is the first two-profile real-time conversion.</p><p>Workers begin gathering. Stocks arrive only when carried home. Your mustering hall trains troops; build a workshop for siege. The first raid gives you time to prepare.</p><div class="rts-row"><button id="rts-begin" class="rts-primary">Begin real-time skirmish</button><button id="rts-continue">Continue skirmish</button><a href="?mode=weekly">Weekly game · all 55 profiles</a></div></dialog>
 <dialog id="rts-options"><h2>Battlefield settings</h2><div class="rts-settings"><label>Text scale<select id="rts-scale"><option value="1">100%</option><option value="1.5">150%</option><option value="2">200%</option></select></label><label>Reduced motion<input id="rts-motion" type="checkbox"></label>${Object.keys(
   keys,
 )
   .map(
     (k) =>
       `<label>${k[0].toUpperCase() + k.slice(1)} hotkey<input aria-label="${k} hotkey" data-key="${k}" maxlength="4"></label>`,
   )
   .join(
     "",
   )}</div><p>Use unique lowercase letters or Home. Ctrl+1–9 and arrows remain reserved. Changes apply immediately; text fields never issue battlefield orders.</p><div class="rts-row"><button id="rts-close-options">Close settings</button><button id="rts-export">Export skirmish</button><label>Import skirmish<input id="rts-import" type="file" accept="application/json"></label><a href="?mode=weekly">Weekly game / private multiplayer</a></div><p>RTS networking is not enabled. Weekly checkpoints stay separate and cannot be imported into this simulation.</p></dialog>`;
  const feedback = (text: string) => {
    $("rts-feedback").textContent = text;
  };
  const world = createRtsWorld($("world"), {
    select(ids, additive) {
      if (abilityMode || buildMode || attackMode) {
        const e = state.units[ids[0]] || state.buildings[ids[0]];
        if (e) {
          ground(e.x, e.y, additive);
          return;
        }
      }
      selected = changeSelection(selected, ids, additive);
      buildMode = undefined;
      attackMode = false;
      rallyMode = false;
      refresh(true);
    },
    order(x, y, target, queued) {
      contextOrder(x, y, target, queued);
    },
    ground(x, y, queued) {
      ground(x, y, queued);
    },
    hover(x, y) {
      if (buildMode) {
        const reason = placementReason(state, "p1", buildMode, x, y);
        feedback(
          reason
            ? `✕ ${reason}`
            : `✓ Place ${buildingSpec(buildMode).name} at ${x}, ${y}`,
        );
      }
    },
  });
  const firstCore = () =>
    Object.values(state.buildings).find(
      (b) => b.owner === "p1" && b.kind === "keep",
    );
  function select(ids: string[]) {
    selected = ids;
    buildMode = undefined;
    attackMode = false;
    refresh(true);
  }
  function issue(command: RTSCommand) {
    const start = performance.now();
    const result = commandRTS(state, "p1", command);
    feedback(
      result.ok
        ? `✓ ${result.reason || "Order acknowledged"}`
        : `✕ ${result.reason}`,
    );
    lastCommandMs = performance.now() - start;
    refresh(true);
    return result.ok;
  }
  function order(order: RTSOrder, queued = false) {
    issue({
      kind: "order",
      units: selected.filter((id) => !!state.units[id]),
      order,
      queued,
    });
  }
  function contextOrder(x: number, y: number, target?: string, queued = false) {
    if (!started) return;
    const b = selected.length === 1 ? state.buildings[selected[0]] : undefined;
    if (b?.owner === "p1") {
      issue({ kind: "rally", building: b.id, x, y });
      return;
    }
    const unit = target ? state.units[target] : undefined,
      building = target ? state.buildings[target] : undefined;
    const resource = target ? state.resources[target] : undefined;
    order(
      unit?.owner === "p1" &&
        unit.kind === "siege" &&
        selected.some((id) => state.units[id]?.kind === "worker")
        ? { kind: "supply", target }
        : resource
          ? { kind: "gather", target }
          : building?.owner === "p1" && building.progress < 1
            ? { kind: "build", target }
            : unit?.owner === "p2" || building?.owner === "p2"
              ? { kind: "attack", target }
              : { kind: attackMode ? "attackMove" : "move", x, y },
      queued,
    );
    attackMode = false;
  }
  function ground(x: number, y: number, queued = false) {
    x = Math.round(x);
    y = Math.round(y);
    if (abilityMode) {
      issue({ kind: "ability", x, y });
      abilityMode = false;
    } else if (buildMode) {
      if (
        issue({
          kind: "build",
          building: buildMode,
          x,
          y,
          workers: selected.filter((id) => state.units[id]?.kind === "worker"),
        })
      )
        buildMode = undefined;
    } else if (rallyMode && selected[0]) {
      issue({ kind: "rally", building: selected[0], x, y });
      rallyMode = false;
    } else if (attackMode) {
      order({ kind: "attackMove", x, y }, queued);
      attackMode = false;
    }
    refresh(true);
  }
  let lastCommandMs = 0,
    lastPaint = 0,
    lastList = "",
    lastActions = "",
    lastEvent = 0;
  const frameSamples: number[] = [];
  let alertAt = { x: 6, y: 9 };
  let alertTick = -100;
  function refresh(force = false) {
    selected = selected.filter((id) => {
      const e = state.units[id] || state.buildings[id];
      return e && e.hp > 0 && (e.owner === "p1" || isVisible(state, "p1", e));
    });
    world.setCommandMode(attackMode || rallyMode || abilityMode);
    world.setState(state, selected, buildMode);
    for (const k of ["P", "M", "K", "E"] as const)
      $(`stock-${k}`).textContent =
        `${k} ${Math.floor(state.players.p1.stock[k])}`;
    const seconds = Math.floor(state.tick / 10);
    $("rts-clock").textContent =
      `${paused ? "Paused · " : ""}${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    $("rts-pause").textContent = paused ? "Resume" : "Pause";
    $("rts-supply").textContent =
      `Supply ${Object.values(state.units).filter((u) => u.owner === "p1" && u.hp > 0 && u.kind !== "hero").length}/${limits(state.players.p1.profile).supply}`;
    const own = [
      ...Object.values(state.buildings),
      ...Object.values(state.units),
    ].filter((e) => e.hp > 0 && e.owner === "p1");
    const known = [
      ...Object.values(state.buildings),
      ...Object.values(state.units),
    ].filter((e) => e.hp > 0 && e.owner !== "p1" && isVisible(state, "p1", e));
    const list = own
      .concat(known)
      .map(
        (e) =>
          `<option value="${e.id}">${e.owner === "p1" ? "Own" : "Hostile"} · ${escape(e.name)}</option>`,
      )
      .join("");
    if (list !== lastList) {
      $("rts-entity").innerHTML = list;
      lastList = list;
    }
    if (selected[0]) $("rts-entity").setAttribute("data-selected", selected[0]);
    ($("rts-entity") as HTMLSelectElement).value = selected[0] || "";
    const unit = state.units[selected[0]],
      building = state.buildings[selected[0]],
      entity = unit || building;
    $("rts-name").textContent =
      selected.length > 1
        ? `${selected.length} selected`
        : entity?.name || "Your settlement";
    $("rts-detail").textContent = entity
      ? `${Math.ceil(entity.hp)}/${entity.maxHp} health · ${unit ? unit.state : building.progress < 1 ? `Building ${Math.floor(building.progress * 100)}%` : "Ready"} · ${Math.round(entity.x)}, ${Math.round(entity.y)}${unit?.owner === "p1" && unit.orders.length ? ` · ${unit.orders.length} orders` : ""}${unit?.owner === "p1" && unit.kind === "worker" ? ` · Carrying ${price(unit.cargo)}` : ""}${unit?.owner === "p1" && unit.kind === "siege" ? ` · ${unit.ammo}/3 rounds` : ""}`
      : "Select a unit, building or group.";
    $("rts-hero").textContent =
      `${profile(state.players.p1.profile).hero} · ${state.players.p1.hero.status} · ${state.players.p1.component} components · ${state.players.p1.hero.readiness}/6 readiness · ${Math.max(0, (state.players.p1.abilityReady - state.tick) / 10).toFixed(1)}s commitment cooldown`;
    let html = "";
    const button = (label: string, action: string, detail = "") =>
      `<button data-action="${action}">${label}${detail ? `<small>${escape(detail)}</small>` : ""}</button>`;
    if (entity?.owner === "p1" && unit) {
      html +=
        button(`Attack-move [${keys.attack.toUpperCase()}]`, "attack") +
        button(`Stop [${keys.stop.toUpperCase()}]`, "stop") +
        button(`Hold [${keys.hold.toUpperCase()}]`, "hold") +
        button("Move to X,Y", "move-coordinate") +
        button("Attack-move to X,Y", "attack-coordinate");
      if (unit.kind === "hero")
        html +=
          button(
            "Supply Refit",
            "ability",
            "10M · nearby worker · 4s · restores up to 25%",
          ) +
          button("Recover hero", "recover", "Rest 10s · restores 3 readiness");
      if (selected.some((id) => state.units[id]?.kind === "worker"))
        for (const kind of [
          "barracks",
          "workshop",
          "farm",
          "lore",
          "tower",
          "wall",
          "keep",
        ] as BuildingKind[]) {
          const spec = buildingSpec(kind);
          html += button(
            `Build ${spec.name}`,
            `build:${kind}`,
            `${price(spec.cost)} · ${spec.seconds}s · worker${spec.prerequisite ? ` · requires ${spec.prerequisite}` : ""}`,
          );
        }
      if (selected.some((id) => state.units[id]?.kind === "worker"))
        for (const k of ["P", "M", "K", "E"])
          html += button(
            `Gather ${stockNames[k as keyof Stock]}`,
            `gather:${k}`,
          );
    } else if (building?.owner === "p1") {
      const products: (UnitKind | "component")[] =
        building.kind === "keep"
          ? ["worker", "component", "hero"]
          : building.kind === "barracks"
            ? ["soldier", "archer"]
            : building.kind === "workshop"
              ? ["siege"]
              : [];
      for (const product of products) {
        const spec =
          product === "component"
            ? {
                name: "Signature component",
                cost: { P: 0, M: 10, K: 5, E: 0 },
                seconds: 25,
              }
            : unitSpec(product, state.players.p1.profile);
        html += button(
          product === "component"
            ? "Craft signature component"
            : `Recruit ${product === "worker" ? "Worker · " : ""}${spec.name}`,
          `produce:${product}`,
          `${price(spec.cost)} · ${spec.seconds}s${product === "hero" ? " · requires new component and empty slot" : ""}`,
        );
      }
      html +=
        button("Set rally point", "rally") +
        button("Rally to X,Y", "rally-coordinate");
      if (building.queue.length)
        html += button(
          "Cancel last queued job",
          "cancel",
          "Returns half stocks; component is lost",
        );
    }
    if (!html)
      html =
        button(`Select workers [${keys.worker.toUpperCase()}]`, "workers") +
        button(`Select army [${keys.army.toUpperCase()}]`, "army") +
        button("Locate stronghold", "home");
    const actionStamp = html;
    if (force || actionStamp !== lastActions) {
      const focusedAction = (document.activeElement as HTMLElement)?.dataset
        .action;
      $("rts-actions").innerHTML = html;
      if (focusedAction)
        Array.from(
          $("rts-actions").querySelectorAll<HTMLButtonElement>("button"),
        )
          .find((b) => b.dataset.action === focusedAction)
          ?.focus({ preventScroll: true });
      lastActions = actionStamp;
    }
    $("rts-queue").textContent =
      entity?.owner !== "p1"
        ? "Observed opponent. Orders, cargo and production are private."
        : building?.queue.length
          ? `Production queue: ${building.queue.map((j) => `${j.product} (${Math.ceil(j.remaining / 10)}s / ${Math.round(100 * (1 - j.remaining / j.total))}%)`).join(" → ")}`
          : unit
            ? `Orders: ${unit.orders.map((o) => o.kind).join(" → ") || "Idle"} · Shift-right-click to queue.`
            : "Pay upfront · workers deliver stocks · provisional prices";
    drawMinimap();
    if (state.winner) {
      paused = true;
      feedback(
        state.winner === "p1"
          ? "Victory — all rival strongholds have fallen. Your settlement endures."
          : "Defeat — your last stronghold has fallen. Restart to try a different opening.",
      );
      $("rts-objective").textContent =
        state.winner === "p1"
          ? "Victory · Gondor holds the basin."
          : "Defeat · Saruman holds the basin.";
    }
    const warning = state.events
      .filter(
        (e) =>
          e.id > lastEvent &&
          e.audience.includes("p1") &&
          isVisible(state, "p1", e) &&
          ((e.kind === "attack" &&
            e.target &&
            own.some(
              (u) => Math.hypot(u.x - e.target!.x, u.y - e.target!.y) < 1,
            )) ||
            e.kind === "warning" ||
            e.kind === "death"),
      )
      .at(-1);
    if (warning && state.tick - alertTick > 30) {
      alertTick = state.tick;
      alertAt = warning.target || warning;
      $("rts-alert").hidden = false;
      $("rts-alert").textContent =
        `⚠ ${warning.kind === "attack" ? "Under attack" : warning.text} · Locate`;
    }
    lastEvent = state.events.at(-1)?.id || lastEvent;
  }
  function drawMinimap() {
    const c = $<HTMLCanvasElement>("rts-minimap"),
      ctx = c.getContext("2d")!;
    const sx = c.width / state.width,
      sy = c.height / state.height;
    const colors: Record<string, string> = {
      grass: "#415c49",
      water: "#376776",
      forest: "#233e36",
      woodland: "#233e36",
      road: "#9b8968",
      stone: "#7b8580",
      cliff: "#454858",
      ford: "#b6a486",
    };
    for (let y = 0; y < state.height; y++)
      for (let x = 0; x < state.width; x++) {
        ctx.fillStyle = colors[state.terrain[y * state.width + x]] || "#415c49";
        ctx.fillRect(x * sx, y * sy, sx + 1, sy + 1);
        if (!isVisible(state, "p1", { x, y })) {
          ctx.fillStyle = "#101c2299";
          ctx.fillRect(x * sx, y * sy, sx + 1, sy + 1);
        }
      }
    for (const e of [
      ...Object.values(state.units),
      ...Object.values(state.buildings),
    ])
      if (e.hp > 0 && (e.owner === "p1" || isVisible(state, "p1", e))) {
        ctx.fillStyle = e.owner === "p1" ? "#f2e8d5" : "#ffb4a4";
        ctx.beginPath();
        if (e.owner === "p1") {
          ctx.moveTo(e.x * sx, e.y * sy - 3);
          ctx.lineTo(e.x * sx + 3, e.y * sy);
          ctx.lineTo(e.x * sx, e.y * sy + 3);
          ctx.lineTo(e.x * sx - 3, e.y * sy);
        } else {
          ctx.moveTo(e.x * sx, e.y * sy - 4);
          ctx.lineTo(e.x * sx + 4, e.y * sy + 3);
          ctx.lineTo(e.x * sx - 4, e.y * sy + 3);
        }
        ctx.closePath();
        ctx.fill();
      }
  }
  $("rts-actions").onclick = (e) => {
    const action = (e.target as HTMLElement).closest("button")?.dataset.action;
    if (!action) return;
    const [kind, arg] = action.split(":");
    if (kind === "ability") {
      abilityMode = true;
      feedback(
        "Supply Refit: click an owned damaged fortification or siege engine near hero and worker.",
      );
    }
    if (kind === "recover") issue({ kind: "recover-hero" });
    if (kind === "gather") {
      const worker = state.units[selected[0]];
      const resource = Object.values(state.resources)
        .filter(
          (r) => r.kind === arg && r.amount > 0 && isVisible(state, "p1", r),
        )
        .sort(
          (a, b) =>
            Math.hypot(a.x - (worker?.x || 6), a.y - (worker?.y || 9)) -
            Math.hypot(b.x - (worker?.x || 6), b.y - (worker?.y || 9)),
        )[0];
      if (resource) order({ kind: "gather", target: resource.id });
      else feedback("No visible source. Scout further.");
    }
    if (kind === "cancel") issue({ kind: "cancel", building: selected[0] });
    if (kind === "produce")
      issue({
        kind: "produce",
        building: selected[0],
        product: arg as UnitKind | "component",
      });
    if (kind === "build") {
      buildMode = arg as BuildingKind;
      attackMode = false;
      feedback(
        `Choose a clear site for ${buildingSpec(buildMode).name}; click the map or use X,Y and Enter.`,
      );
    }
    if (kind === "attack") {
      attackMode = true;
      buildMode = undefined;
      feedback(
        "Attack-move: click a destination. Units engage visible threats on the way.",
      );
    }
    if (kind === "stop" || kind === "hold") order({ kind });
    if (kind === "rally") {
      rallyMode = true;
      feedback("Click a rally destination.");
    }
    const x = Number($<HTMLInputElement>("order-x").value),
      y = Number($<HTMLInputElement>("order-y").value);
    if (kind === "move-coordinate" || kind === "attack-coordinate")
      order({ kind: kind === "move-coordinate" ? "move" : "attackMove", x, y });
    if (kind === "rally-coordinate")
      issue({ kind: "rally", building: selected[0], x, y });
    if (kind === "workers")
      select(
        Object.values(state.units)
          .filter((u) => u.owner === "p1" && u.kind === "worker" && u.hp > 0)
          .map((u) => u.id),
      );
    if (kind === "army")
      select(
        Object.values(state.units)
          .filter((u) => u.owner === "p1" && u.kind !== "worker" && u.hp > 0)
          .map((u) => u.id),
      );
    if (kind === "home") {
      const b = firstCore();
      if (b) {
        select([b.id]);
        world.center(b.x, b.y);
      }
    }
  };
  $("rts-entity").onchange = () =>
    select([$<HTMLSelectElement>("rts-entity").value]);
  $("rts-alert").onclick = () => world.center(alertAt.x, alertAt.y);
  $("rts-locate").onclick = () => {
    const e =
      state.units[selected[0]] || state.buildings[selected[0]] || firstCore();
    if (e) world.center(e.x, e.y);
  };
  $("rts-pause").onclick = () => {
    paused = !paused;
    refresh();
  };
  $("rts-save").onclick = () => {
    try {
      localStorage.setItem(saveKey, serializeRTS(state));
      feedback("Saved skirmish at this simulation tick.");
    } catch (e) {
      feedback(`Save failed: ${(e as Error).message}`);
    }
  };
  function applySettings() {
    world.setReducedMotion(reduced);
    document.body.style.setProperty("--rts-scale", scale);
    document.body.classList.toggle("rts-large", Number(scale) > 1);
    document.body.classList.toggle("rts-reduced", reduced);
  }
  applySettings();
  $("rts-settings").onclick = () => {
    paused = true;
    $<HTMLSelectElement>("rts-scale").value = scale;
    $<HTMLInputElement>("rts-motion").checked = reduced;
    for (const el of app.querySelectorAll<HTMLInputElement>("[data-key]"))
      el.value = keys[el.dataset.key as keyof Hotkeys];
    $<HTMLDialogElement>("rts-options").showModal();
    refresh();
  };
  $("rts-close-options").onclick = () =>
    $<HTMLDialogElement>("rts-options").close();
  $("rts-scale").onchange = () => {
    scale = $<HTMLSelectElement>("rts-scale").value;
    localStorage.setItem("rts-text-scale", scale);
    applySettings();
  };
  $("rts-motion").onchange = () => {
    reduced = $<HTMLInputElement>("rts-motion").checked;
    localStorage.setItem("rts-reduced", String(reduced));
    applySettings();
  };
  for (const el of app.querySelectorAll<HTMLInputElement>("[data-key]"))
    el.onchange = () => {
      const next = parseHotkeys({ ...keys, [el.dataset.key!]: el.value });
      if (!next) {
        el.value = keys[el.dataset.key as keyof Hotkeys];
        feedback("Hotkey must be unique: a–z or Home.");
      } else {
        keys = next;
        localStorage.setItem(hotkeyKey, JSON.stringify(keys));
      }
    };
  $("rts-export").onclick = () => {
    const a = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob([serializeRTS(state)], { type: "application/json" }),
    );
    a.href = url;
    a.download = "two-fords-rts.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("rts-import").onchange = async () => {
    const file = $<HTMLInputElement>("rts-import").files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("Checkpoint exceeds 2 MB");
      state = parseRTS(await file.text());
      paused = true;
      selected = [];
      refresh(true);
      feedback("Imported skirmish, paused.");
    } catch (e) {
      feedback(`Import rejected: ${(e as Error).message}`);
    }
  };
  const map = $<HTMLCanvasElement>("rts-minimap");
  const mapPoint = (e: MouseEvent) => {
    const r = map.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(
          state.width - 1,
          Math.floor(((e.clientX - r.left) / r.width) * state.width),
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          state.height - 1,
          Math.floor(((e.clientY - r.top) / r.height) * state.height),
        ),
      ),
    };
  };
  map.onclick = (e) => {
    const p = mapPoint(e);
    if (attackMode || buildMode || rallyMode || abilityMode) ground(p.x, p.y);
    else world.center(p.x, p.y);
  };
  map.oncontextmenu = (e) => {
    e.preventDefault();
    const p = mapPoint(e);
    contextOrder(p.x, p.y, undefined, e.shiftKey);
  };
  document.addEventListener("keydown", (e) => {
    if (
      !started ||
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLSelectElement ||
      e.target instanceof HTMLTextAreaElement ||
      document.querySelector("dialog[open]")
    )
      return;
    if (e.key === "Escape") {
      buildMode = undefined;
      attackMode = false;
      rallyMode = false;
      abilityMode = false;
      feedback("Command targeting cancelled.");
      refresh();
      return;
    }
    if (/^[1-9]$/.test(e.key)) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        groups.set(e.key, [...selected]);
        feedback(`Control group ${e.key} saved.`);
      } else {
        select(
          (groups.get(e.key) || []).filter(
            (id) => state.units[id]?.hp > 0 || state.buildings[id]?.hp > 0,
          ),
        );
        feedback(`Control group ${e.key}: ${selected.length} selected.`);
      }
      return;
    }
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === keys.pause) {
      paused = !paused;
      refresh();
    }
    if (e.key === keys.stop) order({ kind: "stop" });
    if (e.key === keys.hold) order({ kind: "hold" });
    if (e.key === keys.attack) {
      attackMode = true;
      feedback("Attack-move: choose destination.");
    }
    if (e.key === keys.build) {
      buildMode = "barracks";
      feedback("Place Barracks: choose clear ground near a worker.");
    }
    if (e.key === keys.worker)
      select(
        Object.values(state.units)
          .filter((u) => u.owner === "p1" && u.kind === "worker" && u.hp > 0)
          .map((u) => u.id),
      );
    if (e.key === keys.army)
      select(
        Object.values(state.units)
          .filter((u) => u.owner === "p1" && u.kind !== "worker" && u.hp > 0)
          .map((u) => u.id),
      );
    if (e.key === keys.home) {
      e.preventDefault();
      const b = firstCore();
      if (b) {
        select([b.id]);
        world.center(b.x, b.y);
      }
    }
  });
  for (const id of ["order-x", "order-y"])
    $(id).onkeydown = (e) => {
      if (e.key === "Enter") {
        ground(
          Number($<HTMLInputElement>("order-x").value),
          Number($<HTMLInputElement>("order-y").value),
        );
      }
    };
  $("rts-begin").onclick = () => {
    started = true;
    paused = false;
    $<HTMLDialogElement>("rts-intro").close();
    const core = firstCore();
    if (core) {
      selected = [core.id];
      world.center(core.x, core.y);
    }
    feedback(
      "Workers are gathering. Recruit guards and protect the deliveries.",
    );
    refresh(true);
  };
  $("rts-continue").onclick = () => {
    try {
      state = parseRTS(localStorage.getItem(saveKey) || "");
      started = true;
      paused = true;
      $<HTMLDialogElement>("rts-intro").close();
      const core = firstCore();
      selected = core ? [core.id] : [];
      if (core) world.center(core.x, core.y);
      refresh(true);
      feedback("Checkpoint restored, paused.");
    } catch (e) {
      feedback(`Cannot continue: ${(e as Error).message}`);
    }
  };
  $<HTMLButtonElement>("rts-continue").disabled =
    !localStorage.getItem(saveKey);
  $<HTMLDialogElement>("rts-intro").showModal();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      paused = true;
      refresh();
    }
  });
  const clock = new TickClock();
  let previous = performance.now();
  function frame(now: number) {
    const dt = now - previous;
    previous = now;
    if (started && !paused && !document.hidden) {
      frameSamples.push(dt);
      if (frameSamples.length > 600) frameSamples.shift();
    }
    const ticks = clock.advance(dt, paused || !started || !!state.winner);
    if (ticks) stepRTS(state, ticks);
    world.setCommandMode(attackMode || rallyMode || abilityMode);
    world.setState(state, selected, buildMode);
    if (now - lastPaint > 200) {
      lastPaint = now;
      refresh();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // Read-only diagnostics expose only already visible own/observed information.
  Object.defineProperty(window, "__rtsDiagnostics", {
    configurable: true,
    value: () => ({
      tick: state.tick,
      paused,
      selected: [...selected],
      selectedPositions: selected
        .map((id) => state.units[id] || state.buildings[id])
        .filter((e) => e && (e.owner === "p1" || isVisible(state, "p1", e)))
        .map((e) => ({
          id: e.id,
          x: e.x,
          y: e.y,
          screen: world.worldToScreen(e.x, e.y),
        })),
      units: Object.values(state.units).filter(
        (u) => u.hp > 0 && (u.owner === "p1" || isVisible(state, "p1", u)),
      ).length,
      frameSamples: [...frameSamples],
      lastCommandMs,
      world: world.diagnostics(),
    }),
  });
  refresh(true);
}

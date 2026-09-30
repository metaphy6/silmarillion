import Phaser from "phaser";
import type { RTSState, RTSUnit, RTSBuilding } from "../simulation/rts";
import { isVisible, placementReason } from "../simulation/rts";
import {
  DIRECTIONAL_SHEETS,
  paintMotionAtlas,
  motionFrame,
  type PaintedFigure,
  type FigureDirection,
} from "./figure-motion";
import {
  boxSelection,
  constructionStage,
  facingRTS,
  projectRTS,
  unprojectRTS,
} from "./rts-presentation";

export interface RTSWorldCallbacks {
  select(ids: string[], additive: boolean): void;
  order(x: number, y: number, targetId?: string, queued?: boolean): void;
  ground(x: number, y: number, queued?: boolean): void;
  hover(x: number, y: number): void;
}
type Point = { x: number; y: number };
type Actor = {
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  damaged: number;
  hp: number;
  deathAt?: number;
};
type Flight = {
  start: Point;
  end: Point;
  time: number;
  duration: number;
  siege: boolean;
  owner: string;
};
const BASE = import.meta.env.BASE_URL + "assets/";
const paper = 0xf2e8d5,
  friendly = 0xa1dce6,
  enemy = 0xffb4a4;
const archetypes = [
  "porter",
  "infantry",
  "orc-guard",
  "elven-archer",
  "wizard",
  "herald",
];
const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName) ||
    target.isContentEditable);

/** A real-time scene consumes observed snapshots; it never advances game rules. */
class RTSWorld extends Phaser.Scene {
  snapshot?: RTSState;
  selected: string[] = [];
  placement?: RTSBuilding["kind"];
  placementValid = false;
  private commandMode = false;
  loaded = false;
  private land?: Phaser.GameObjects.Image;
  private terrainSignature = "";
  private actors = new Map<string, Actor>();
  private sites = new Map<string, Phaser.GameObjects.Image>();
  private resources = new Map<string, Phaser.GameObjects.Container>();
  private details!: Phaser.GameObjects.Graphics;
  private fog!: Phaser.GameObjects.Image;
  private terrainMetrics = { width: 1, height: 1, offset: 0 };
  private overlay!: Phaser.GameObjects.Graphics;
  private effects!: Phaser.GameObjects.Graphics;
  private drag!: Phaser.GameObjects.Graphics;
  private ghost?: Phaser.GameObjects.Image;
  private tooltip!: Phaser.GameObjects.Text;
  private hoverPoint?: Point;
  private hoverEntity?: string;
  private press?: { screen: Point; world: Point; button: number };
  private panKeys = new Set<string>();
  private flights: Flight[] = [];
  private impacts: { p: Point; at: number; siege: boolean }[] = [];
  private commands: { p: Point; at: number }[] = [];
  private seenEvents = new Set<string | number>();
  private lastStateAt = 0;
  private cameraReady = false;
  private frameTimes: number[] = [];
  private reduced = false;
  private mapVersion = -1;
  private motionQuery?: MediaQueryList;
  private motionChanged?: () => void;
  private motionPreference = false;
  private visibilityCache = new Map<string, boolean>();
  constructor(private callbacks: RTSWorldCallbacks) {
    super("rts-world");
  }

  preload() {
    this.load.atlas(
      "rts-buildings",
      BASE + "sm-building-atlas-v1.webp",
      BASE + "building-atlas.json",
    );
    this.load.atlas(
      "rts-figures",
      BASE + "sm-world-figures-v1.webp",
      BASE + "world-figures.json",
    );
    this.load.image("rts-ground", BASE + "sm-terrain-materials-v1.png");
    this.load.atlas(
      "rts-siege",
      BASE + "sm-rts-siege-atlas-v2.png",
      BASE + "rts-siege-atlas.json",
    );
    this.load.image("rts-trees", BASE + "sm-rts-forest-atlas-v1.png");
    for (const sheet of DIRECTIONAL_SHEETS.slice(0, 2))
      this.load.image("rts-" + sheet.key, BASE + `sm-${sheet.key}-v1.png`);
  }
  create() {
    this.cameras.main.setBackgroundColor("#182e33");
    this.cameras.main.setZoom(0.9);
    this.details = this.add.graphics().setDepth(3500);
    this.fog = this.add
      .image(0, 0, "__WHITE")
      .setDepth(5000)
      .setVisible(false)
      .setOrigin(0, 0);
    this.overlay = this.add.graphics().setDepth(7000);
    this.effects = this.add.graphics().setDepth(6000);
    this.drag = this.add.graphics().setScrollFactor(0).setDepth(10000);
    this.tooltip = this.add
      .text(0, 0, "", {
        fontFamily: "Noto Sans, Arial",
        fontSize: "14px",
        color: "#f2e8d5",
        backgroundColor: "#192a30",
        padding: { x: 7, y: 5 },
      })
      .setDepth(10001)
      .setVisible(false);
    this.buildFigureAtlases();
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.motionChanged = () => {
      this.reduced = this.motionPreference || !!this.motionQuery?.matches;
    };
    this.motionChanged();
    this.motionQuery.addEventListener("change", this.motionChanged);
    this.input.mouse?.disableContextMenu();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.setAttribute(
      "aria-label",
      "Real-time battlefield. Left click or drag to select. Right click orders. Shift adds selection or queues orders. Arrow keys pan. Mouse wheel zooms. Use the army list for alternate selection.",
    );
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (p.event?.target !== this.game.canvas) return;
      this.game.canvas.focus({ preventScroll: true });
      this.press = {
        screen: { x: p.x, y: p.y },
        world: this.pointerWorld(p),
        button: p.button,
      };
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      const point = this.pointerWorld(p),
        tile = unprojectRTS(point.x, point.y);
      this.hoverPoint = tile;
      this.hoverEntity = this.entityAt(point);
      this.callbacks.hover(tile.x, tile.y);
      if (this.press?.button === 1 && p.isDown) {
        this.cameras.main.scrollX -=
          (p.x - p.prevPosition.x) / this.cameras.main.zoom;
        this.cameras.main.scrollY -=
          (p.y - p.prevPosition.y) / this.cameras.main.zoom;
      }
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.press) return;
      const down = this.press;
      this.press = undefined;
      this.drag.clear();
      const point = this.pointerWorld(p),
        tile = unprojectRTS(point.x, point.y),
        target = this.entityAt(point);
      if (down.button === 2) {
        this.callbacks.order(tile.x, tile.y, target, p.event.shiftKey);
        this.commands.push({ p: point, at: this.time.now });
      } else if (down.button === 0) {
        const length = Math.hypot(p.x - down.screen.x, p.y - down.screen.y);
        if (
          length > 7 &&
          this.snapshot &&
          !this.placement &&
          !this.commandMode
        ) {
          const selected = boxSelection(
            Object.values(this.snapshot.units).filter((e) =>
              this.visible(e.x, e.y, e.owner),
            ),
            down.world,
            point,
            "p1",
          );
          this.callbacks.select(selected, p.event.shiftKey);
        } else if (this.placement || this.commandMode)
          this.callbacks.ground(tile.x, tile.y, p.event.shiftKey);
        else if (target) this.callbacks.select([target], p.event.shiftKey);
        else this.callbacks.ground(tile.x, tile.y, p.event.shiftKey);
      }
    });
    this.input.on(
      "wheel",
      (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
        const camera = this.cameras.main,
          before = this.pointerWorld(p);
        camera.setZoom(
          Phaser.Math.Clamp(camera.zoom * (dy > 0 ? 0.9 : 1.1), 0.45, 1.65),
        );
        const after = this.pointerWorld(p);
        camera.scrollX += before.x - after.x;
        camera.scrollY += before.y - after.y;
      },
    );
    const keydown = (e: KeyboardEvent) => {
      if (
        !isEditable(e.target) &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        this.panKeys.add(e.key);
        e.preventDefault();
      }
    };
    const keyup = (e: KeyboardEvent) => this.panKeys.delete(e.key);
    const blur = () => {
      this.panKeys.clear();
      this.press = undefined;
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      if (this.motionChanged)
        this.motionQuery?.removeEventListener("change", this.motionChanged);
    });
    this.loaded = true;
    if (this.snapshot)
      this.accept(this.snapshot, this.selected, this.placement);
  }
  private pointerWorld(p: Phaser.Input.Pointer): Point {
    return p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
  }
  private visible(x: number, y: number, owner?: string) {
    if (owner === "p1") return true;
    const s = this.snapshot;
    if (!s) return false;
    const key = `${x}:${y}`,
      cached = this.visibilityCache.get(key);
    if (cached !== undefined) return cached;
    const result = isVisible(s, "p1", { x, y });
    this.visibilityCache.set(key, result);
    return result;
  }
  private entityAt(point: Point) {
    if (!this.snapshot) return undefined;
    const zoom = this.cameras.main.zoom;
    let nearest: { id: string; distance: number } | undefined;
    for (const e of Object.values(this.snapshot.units)) {
      if (e.hp <= 0 || !this.visible(e.x, e.y, e.owner)) continue;
      const p = projectRTS(e.x, e.y),
        distance = Math.hypot(p.x - point.x, p.y - 12 - point.y);
      if (
        distance < Math.max(22 / zoom, 20) &&
        (!nearest || distance < nearest.distance)
      )
        nearest = { id: e.id, distance };
    }
    if (nearest) return nearest.id;
    for (const b of Object.values(this.snapshot.buildings)) {
      if (b.hp <= 0 || !this.visible(b.x, b.y, b.owner)) continue;
      const p = projectRTS(b.x, b.y),
        distance = Math.hypot((p.x - point.x) * 0.7, p.y - 25 - point.y);
      if (distance < 40 && (!nearest || distance < nearest.distance))
        nearest = { id: b.id, distance };
    }
    if (nearest) return nearest.id;
    for (const r of Object.values(this.snapshot.resources)) {
      const p = projectRTS(r.x, r.y),
        distance = Math.hypot(p.x - point.x, p.y - point.y);
      if (
        r.amount > 0 &&
        distance < 30 &&
        this.visible(r.x, r.y) &&
        (!nearest || distance < nearest.distance)
      )
        nearest = { id: r.id, distance };
    }
    return nearest?.id;
  }
  private buildFigureAtlases() {
    const directions: FigureDirection[] = ["north", "east", "south", "west"];
    for (const archetype of archetypes) {
      const sheet = DIRECTIONAL_SHEETS.find((s) =>
        (s.archetypes as readonly string[]).includes(archetype),
      );
      if (!sheet) continue;
      const source = this.textures
        .get("rts-" + sheet.key)
        .getSourceImage() as HTMLImageElement;
      if (!source?.width) continue;
      const canvas = document.createElement("canvas");
      canvas.width = source.width;
      canvas.height = source.height;
      const context = canvas.getContext("2d", { willReadFrequently: true })!;
      context.drawImage(source, 0, 0);
      const pixels = context.getImageData(
        0,
        0,
        source.width,
        source.height,
      ).data;
      const row = (sheet.archetypes as readonly string[]).indexOf(archetype),
        rowHeight = source.height / sheet.archetypes.length;
      const masters: PaintedFigure["directions"] = {};
      directions.forEach((direction, col) => {
        const x0 = Math.floor((col * source.width) / 4),
          x1 = Math.floor(((col + 1) * source.width) / 4),
          y0 = Math.floor(row * rowHeight),
          y1 = Math.floor((row + 1) * rowHeight);
        let left = x1,
          right = x0,
          top = y1,
          bottom = y0;
        for (let y = y0; y < y1; y++)
          for (let x = x0; x < x1; x++)
            if (pixels[(y * source.width + x) * 4 + 3] > 48) {
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
        masters[direction] = {
          image: source,
          x: left,
          y: top,
          width: right - left + 1,
          height: bottom - top + 1,
          archetype,
        };
      });
      const texture = this.textures.createCanvas(
        "rts-motion-" + archetype,
        512,
        384,
      )!;
      paintMotionAtlas(
        texture.context,
        archetype === "orc-guard" ? "dominion-works" : "mortal-works",
        { ...masters.east!, directions: masters },
      );
      for (let i = 0; i < 48; i++)
        texture.add(i, 0, (i % 8) * 64, Math.floor(i / 8) * 64, 64, 64);
      texture.refresh();
    }
  }
  private drawTerrain(s: RTSState) {
    this.land?.destroy();
    if (this.textures.exists("rts-land")) this.textures.remove("rts-land");
    const w = (s.width + s.height + 2) * 36,
      h = (s.width + s.height + 2) * 18 + 150,
      offset = s.height * 36 + 36;
    const texture = this.textures.createCanvas("rts-land", w, h)!,
      ctx = texture.context;
    const material = this.textures
      .get("rts-ground")
      .getSourceImage() as HTMLImageElement;
    const tileIndex: Record<string, number> = {
      grass: 0,
      forest: 1,
      water: 2,
      road: 5,
      cliff: 4,
      ford: 3,
    };
    const paints = Array.from({ length: 6 }, (_, n) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      canvas
        .getContext("2d")!
        .drawImage(
          material,
          (n % 3) * 512,
          Math.floor(n / 3) * 512,
          512,
          512,
          0,
          0,
          256,
          256,
        );
      return ctx.createPattern(canvas, "repeat")!;
    });
    ctx.fillStyle = paints[0];
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < s.height; y++)
      for (let x = 0; x < s.width; x++) {
        const p = projectRTS(x, y),
          kind = s.terrain[y * s.width + x],
          index = tileIndex[kind] ?? 0;
        const px = p.x + offset,
          py = p.y + 40;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(px, py - 18.5);
        ctx.lineTo(px + 36.5, py);
        ctx.lineTo(px, py + 18.5);
        ctx.lineTo(px - 36.5, py);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = paints[index];
        ctx.fillRect(px - 37, py - 19, 74, 38);
        ctx.fillStyle =
          kind === "grass"
            ? "rgba(38,75,49,.16)"
            : kind === "water"
              ? "rgba(25,83,107,.22)"
              : "rgba(31,43,51,.08)";
        ctx.fillRect(px - 37, py - 19, 74, 38);
        ctx.restore();
        if (kind === "cliff") {
          ctx.fillStyle = "#263643";
          ctx.beginPath();
          ctx.moveTo(px - 33, py + 2);
          ctx.lineTo(px, py + 17);
          ctx.lineTo(px + 30, py + 1);
          ctx.lineTo(px + 30, py + 16);
          ctx.lineTo(px, py + 31);
          ctx.lineTo(px - 33, py + 17);
          ctx.fill();
          ctx.strokeStyle = "#9daaa7";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px - 29, py - 1);
          ctx.lineTo(px, py - 14);
          ctx.lineTo(px + 29, py);
          ctx.stroke();
        }
        if (kind === "forest") {
          if (this.textures.exists("rts-trees")) {
            const tree = this.textures
                .get("rts-trees")
                .getSourceImage() as HTMLImageElement,
              variant = (x * 3 + y * 7) % 4,
              scale = 0.8 + ((x * 5 + y) % 7) / 12,
              tw = 69 * scale,
              th = 76 * scale;
            const crops = [
                [0, 0, 0.54, 0.51],
                [0.54, 0, 0.46, 0.51],
                [0, 0.49, 0.53, 0.51],
                [0.53, 0.51, 0.47, 0.49],
              ],
              cut = crops[variant];
            ctx.drawImage(
              tree,
              cut[0] * tree.width,
              cut[1] * tree.height,
              cut[2] * tree.width,
              cut[3] * tree.height,
              px - tw / 2,
              py - th + 12,
              tw,
              th,
            );
          } else this.paintTree(ctx, px, py, ((x * 3 + y * 7) % 7) / 10 + 0.75);
        }
        if (kind === "ford") {
          ctx.strokeStyle = "rgba(195,188,150,.65)";
          ctx.lineWidth = 3;
          for (let n = -2; n <= 2; n++) {
            ctx.beginPath();
            ctx.moveTo(px + n * 10 - 10, py + n * 4);
            ctx.lineTo(px + n * 10 + 7, py + n * 4 - 8);
            ctx.stroke();
          }
        }
      }
    texture.refresh();
    this.land = this.add
      .image(-offset, -40, "rts-land")
      .setOrigin(0, 0)
      .setDepth(-100);
    this.terrainMetrics = { width: w, height: h, offset };
    if (this.textures.exists("rts-fog")) this.textures.remove("rts-fog");
    this.textures.createCanvas("rts-fog", Math.ceil(w / 4), Math.ceil(h / 4));
    this.fog
      .setTexture("rts-fog")
      .setPosition(-offset, -40)
      .setDisplaySize(w, h)
      .setVisible(true);
  }
  /** Code-authored canopy brush clusters follow blocked forest, never hide road cells. */
  private paintTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(10,27,30,.45)";
    ctx.beginPath();
    ctx.ellipse(8, 6, 23, 10, 0, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "#514a39";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-2, -28);
    ctx.stroke();
    for (let layer = 0; layer < 3; layer++)
      for (let i = 0; i < 7; i++) {
        const angle = i * 2.4,
          dx = Math.cos(angle) * (16 - layer * 3),
          dy = -18 - layer * 9 + Math.sin(angle) * 8;
        ctx.fillStyle = ["#1c3b34", "#315846", "#577454"][layer];
        ctx.beginPath();
        ctx.ellipse(dx, dy, 13 - layer * 2, 9 - layer, angle, 0, 7);
        ctx.fill();
        ctx.fillStyle = ["#335846", "#648060", "#849371"][layer];
        ctx.beginPath();
        ctx.ellipse(dx - 3, dy - 3, 5, 2.5, -0.5, 0, 7);
        ctx.fill();
      }
    ctx.restore();
  }
  accept(state: RTSState, selected: string[], placement?: RTSBuilding["kind"]) {
    const previous = this.snapshot;
    this.visibilityCache.clear();
    this.snapshot = state;
    this.selected = selected;
    this.placement = placement;
    this.lastStateAt = this.time?.now ?? 0;
    if (!this.loaded) return;
    const signature = `${state.width}:${state.height}:${state.terrain.join(",")}`;
    if (signature !== this.terrainSignature) {
      this.terrainSignature = signature;
      this.drawTerrain(state);
    }
    if (previous && state.tick < this.mapVersion) {
      this.seenEvents.clear();
      this.flights = [];
      this.impacts = [];
    }
    this.mapVersion = state.tick;
    if (!this.cameraReady) {
      const keep = Object.values(state.buildings).find(
        (b) => b.owner === "p1" && b.kind === "keep",
      );
      if (keep) {
        this.center(keep.x + 4, keep.y + 2);
        this.cameraReady = true;
      }
    }
    for (const event of state.events) {
      if (this.seenEvents.has(event.id)) continue;
      this.seenEvents.add(event.id);
      if (
        event.kind === "attack" &&
        event.target &&
        event.audience.includes("p1") &&
        this.visible(event.x, event.y) &&
        this.visible(event.target.x, event.target.y)
      ) {
        const start = projectRTS(event.x, event.y),
          end = projectRTS(event.target.x, event.target.y);
        const unit = Object.values(state.units).find(
          (u) => Math.hypot(u.x - event.x, u.y - event.y) < 0.3,
        );
        if (
          unit?.kind === "soldier" ||
          unit?.kind === "worker" ||
          unit?.kind === "hero" ||
          (unit?.kind === "siege" && unit.owner === "p2")
        )
          this.impacts.push({
            p: { x: end.x, y: end.y - 10 },
            at: this.time.now,
            siege: unit.kind === "siege",
          });
        else
          this.flights.push({
            start: { x: start.x, y: start.y - 18 },
            end: { x: end.x, y: end.y - 10 },
            time: this.time.now,
            duration: unit?.kind === "siege" ? 650 : 220,
            siege: unit?.kind === "siege",
            owner: unit?.owner ?? "p1",
          });
      }
    }
    if (this.seenEvents.size > 2000) {
      const recent = state.events.map((e) => e.id);
      this.seenEvents = new Set(recent);
    }
    this.refreshResources();
    this.refreshBuildings();
    this.paintFog();
  }
  center(x: number, y: number) {
    const p = projectRTS(x, y);
    if (this.loaded) this.cameras.main.centerOn(p.x, p.y);
  }
  private refreshResources() {
    const s = this.snapshot!;
    for (const r of Object.values(s.resources)) {
      let c = this.resources.get(r.id);
      if (!c) {
        const p = projectRTS(r.x, r.y);
        const source = r.kind === "E" ? "rts-buildings" : "rts-siege";
        const frame =
          r.kind === "M"
            ? 10
            : r.kind === "P"
              ? 11
              : r.kind === "K"
                ? 9
                : "grove-refuge";
        const image = this.add
          .image(0, 3, source, frame)
          .setOrigin(0.5, 0.85)
          .setDisplaySize(r.kind === "P" ? 78 : 65, r.kind === "K" ? 43 : 57);
        const text = this.add
          .text(0, 12, r.kind, {
            fontFamily: "Noto Sans",
            fontSize: "14px",
            color: "#f2e8d5",
            backgroundColor: "#192a30",
            padding: { x: 4, y: 1 },
          })
          .setOrigin(0.5, 0);
        c = this.add.container(p.x, p.y, [image, text]).setDepth(p.y);
        this.resources.set(r.id, c);
      }
      c.setVisible(r.amount > 0 && this.visible(r.x, r.y));
    }
  }
  private buildingAppearance(b: RTSBuilding) {
    const hostile = b.owner === "p2",
      stage = constructionStage(b.progress, b.hp);
    if (this.textures.exists("rts-siege")) {
      if (stage === "destroyed")
        return { texture: "rts-siege", frame: 9, width: 95, height: 76 };
      if (stage === "foundation" || stage === "frame")
        return { texture: "rts-siege", frame: 8, width: 108, height: 96 };
      if (b.kind === "tower")
        return {
          texture: "rts-siege",
          frame: hostile ? 2 : 0,
          width: 94,
          height: 106,
        };
      if (b.kind === "wall")
        return {
          texture: "rts-siege",
          frame: hostile ? 3 : 1,
          width: 86,
          height: 77,
        };
      if (b.kind === "farm")
        return { texture: "rts-siege", frame: 11, width: 110, height: 95 };
    }
    const frame =
      b.kind === "keep"
        ? hostile
          ? "binding-workshop"
          : "muster-house"
        : b.kind === "barracks"
          ? hostile
            ? "orc-workhall"
            : "sea-storehouse"
          : b.kind === "workshop"
            ? hostile
              ? "orc-workhall"
              : "dwarf-foundry"
            : b.kind === "lore"
              ? hostile
                ? "wizard-workshop"
                : "archive-house"
              : "provision-cellar";
    return {
      texture: "rts-buildings",
      frame,
      width: b.kind === "keep" ? 126 : 96,
      height: b.kind === "keep" ? 136 : 99,
    };
  }
  private refreshBuildings() {
    const state = this.snapshot!;
    for (const b of Object.values(state.buildings)) {
      let sprite = this.sites.get(b.id);
      const look = this.buildingAppearance(b),
        p = projectRTS(b.x, b.y);
      if (!sprite) {
        sprite = this.add
          .image(p.x, p.y, look.texture, look.frame)
          .setOrigin(0.5, 0.84);
        this.sites.set(b.id, sprite);
      }
      sprite
        .setTexture(look.texture, look.frame)
        .setDisplaySize(look.width, look.height)
        .setPosition(p.x, p.y)
        .setDepth(p.y + 2)
        .setVisible(this.visible(b.x, b.y, b.owner));
      if (b.hp > 0 && b.hp < b.maxHp * 0.35) sprite.setTint(0xb3a39b);
      else sprite.clearTint();
      if (b.progress >= 0.65 && b.progress < 1) sprite.setAlpha(0.7);
      else sprite.setAlpha(1);
      if (b.hp > 0 && b.progress < 0.65) {
        const revealed = 0.3 + (0.7 * b.progress) / 0.65;
        sprite.setCrop(
          0,
          Math.floor(sprite.frame.height * (1 - revealed)),
          sprite.frame.width,
          Math.ceil(sprite.frame.height * revealed),
        );
      } else sprite.setCrop();
    }
    for (const [id, sprite] of this.sites)
      if (!state.buildings[id]) {
        sprite.destroy();
        this.sites.delete(id);
      }
  }
  private paintFog() {
    const s = this.snapshot!,
      texture = this.textures.get("rts-fog") as Phaser.Textures.CanvasTexture,
      ctx = texture.context,
      { width, height, offset } = this.terrainMetrics;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, texture.width, texture.height);
    ctx.fillStyle = "rgba(16,28,34,.94)";
    ctx.fillRect(0, 0, texture.width, texture.height);
    ctx.scale(0.25, 0.25);
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,.3)";
    for (const index of s.explored.p1) {
      const p = projectRTS(index % s.width, Math.floor(index / s.width)),
        x = p.x + offset,
        y = p.y + 40;
      ctx.beginPath();
      ctx.moveTo(x, y - 19);
      ctx.lineTo(x + 37, y);
      ctx.lineTo(x, y + 19);
      ctx.lineTo(x - 37, y);
      ctx.fill();
    }
    const observers = [
      ...Object.values(s.units)
        .filter((u) => u.owner === "p1" && u.hp > 0)
        .map((u) => ({ ...u, radius: 8 })),
      ...Object.values(s.buildings)
        .filter((b) => b.owner === "p1" && b.hp > 0)
        .map((b) => ({ ...b, radius: 7 })),
    ];
    const occupied = new Set<string>();
    for (const observer of observers) {
      const bucket = `${Math.floor(observer.x)}:${Math.floor(observer.y)}:${observer.radius}`;
      if (occupied.has(bucket)) continue;
      occupied.add(bucket);
      const p = projectRTS(observer.x, observer.y),
        radius = observer.radius * 36 * Math.SQRT2;
      ctx.save();
      ctx.translate(p.x + offset, p.y + 40);
      ctx.scale(1, 0.5);
      const gradient = ctx.createRadialGradient(
        0,
        0,
        radius * 0.5,
        0,
        0,
        radius * 1.25,
      );
      gradient.addColorStop(0, "rgba(0,0,0,1)");
      gradient.addColorStop(0.62, "rgba(0,0,0,.94)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(-radius * 1.25, -radius * 1.25, radius * 2.5, radius * 2.5);
      ctx.restore();
    }
    ctx.restore();
    texture.refresh();
    this.fog.setDisplaySize(width, height);
  }
  private unitArchetype(u: RTSUnit) {
    return u.kind === "worker"
      ? "porter"
      : u.kind === "hero"
        ? u.owner === "p2"
          ? "wizard"
          : "herald"
        : u.kind === "archer"
          ? "elven-archer"
          : u.owner === "p2"
            ? "orc-guard"
            : "infantry";
  }
  private renderUnits(time: number, delta: number) {
    const s = this.snapshot!;
    for (const u of Object.values(s.units)) {
      const p = projectRTS(u.x, u.y),
        arch = this.unitArchetype(u),
        texture =
          u.kind === "siege" && this.textures.exists("rts-siege")
            ? "rts-siege"
            : "rts-motion-" + arch;
      let a = this.actors.get(u.id);
      if (!a) {
        a = {
          sprite: this.add
            .image(p.x, p.y, texture, 0)
            .setOrigin(0.5, u.kind === "siege" ? 0.8 : 54 / 64),
          x: p.x,
          y: p.y,
          hp: u.hp,
          damaged: 0,
        };
        this.actors.set(u.id, a);
      }
      if (u.hp < a.hp) a.damaged = time + 180;
      a.hp = u.hp;
      const direction = facingRTS(u.facing),
        moving = u.state === "moving",
        action =
          u.state === "attacking"
            ? "attack"
            : u.state === "working"
              ? "work"
              : "walk";
      const frame =
        this.reduced || u.state === "idle"
          ? 0
          : Math.floor(time / (moving ? 100 : 150));
      const blend = Math.min(1, delta / 65);
      a.x += (p.x - a.x) * blend;
      a.y += (p.y - a.y) * blend;
      a.sprite
        .setPosition(a.x, a.y)
        .setDepth(a.y + 4)
        .setVisible(this.visible(u.x, u.y, u.owner));
      if (texture === "rts-siege")
        a.sprite
          .setTexture(
            texture,
            u.owner === "p2"
              ? direction === "west" || direction === "north"
                ? 7
                : 6
              : direction === "west" || direction === "north"
                ? 5
                : 4,
          )
          .setDisplaySize(67, 59);
      else
        a.sprite
          .setTexture(texture, motionFrame(action, direction, frame))
          .setScale(
            u.kind === "hero" ? 0.91 : u.kind === "worker" ? 0.65 : 0.76,
          );
      if (u.hp <= 0) {
        a.deathAt ??= time;
        const age = (time - a.deathAt) / 650;
        a.sprite
          .setRotation(-Math.min(1, age) * 1.2)
          .setAlpha(Math.max(0, 1 - age));
      } else {
        a.deathAt = undefined;
        a.sprite.setAlpha(1).setRotation(0);
        if (u.kind === "siege" && u.state === "attacking" && !this.reduced)
          a.sprite.setRotation(Math.sin(time / 110) * 0.025);
        if (a.damaged > time) a.sprite.setTint(0xffb4a4);
        else a.sprite.clearTint();
      }
    }
    for (const [id, a] of this.actors)
      if (!s.units[id]) {
        a.sprite.destroy();
        this.actors.delete(id);
      }
  }
  private renderDetails(time: number) {
    const s = this.snapshot!,
      g = this.details;
    g.clear();
    for (const b of Object.values(s.buildings)) {
      if (!this.visible(b.x, b.y, b.owner) || b.hp <= 0) continue;
      const p = projectRTS(b.x, b.y),
        selected = this.selected.includes(b.id);
      if (b.progress < 1) {
        g.fillStyle(0x101c22, 0.9);
        g.fillRect(p.x - 27, p.y + 8, 54, 6);
        g.fillStyle(0xedbe73);
        g.fillRect(p.x - 26, p.y + 9, 52 * b.progress, 4);
      }
      if (b.owner === "p1" && b.queue.length && b.progress >= 1) {
        const q = b.queue[0];
        g.fillStyle(0x101c22, 0.9);
        g.fillRect(p.x - 27, p.y + 8, 54, 6);
        g.fillStyle(0xa1dce6);
        g.fillRect(p.x - 26, p.y + 9, 52 * (1 - q.remaining / q.total), 4);
        if (!this.reduced)
          for (let i = 0; i < 3; i++) {
            const age = (time / 1200 + i * 0.33) % 1;
            g.fillStyle(0xd3c8b4, 0.18 * (1 - age));
            g.fillEllipse(
              p.x + 18 + age * 12,
              p.y - 58 - age * 22,
              5 + age * 12,
              5 + age * 9,
            );
          }
      }
      if (b.hp < b.maxHp || selected)
        this.health(g, p.x, p.y - 68, b.hp / b.maxHp, b.owner, 50);
    }
    for (const u of Object.values(s.units)) {
      if (u.hp <= 0 || !this.visible(u.x, u.y, u.owner)) continue;
      const a = this.actors.get(u.id);
      if (!a) continue;
      if (u.hp < u.maxHp || this.selected.includes(u.id))
        this.health(g, a.x, a.y - 37, u.hp / u.maxHp, u.owner, 28);
      if (u.owner === "p1" && Object.values(u.cargo).some((n) => n > 0)) {
        g.fillStyle(0xc6ab72);
        g.fillRoundedRect(a.x + 6, a.y - 15, 8, 9, 2);
        g.lineStyle(1, 0x57493e);
        g.lineBetween(a.x + 6, a.y - 12, a.x + 14, a.y - 12);
      }
      g.fillStyle(u.owner === "p1" ? friendly : enemy);
      if (u.owner === "p1") g.fillCircle(a.x - 9, a.y + 4, 2);
      else
        g.fillTriangle(a.x - 12, a.y + 6, a.x - 9, a.y + 1, a.x - 6, a.y + 6);
      if (u.state === "working" && !this.reduced) {
        const phase = Math.sin(time / 110);
        g.lineStyle(2, 0xd5c299);
        g.lineBetween(
          a.x + 6,
          a.y - 14,
          a.x + 14 + phase * 3,
          a.y - 22 + phase * 5,
        );
      }
    }
  }
  private health(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    ratio: number,
    owner: string,
    width: number,
  ) {
    g.fillStyle(0x101c22, 0.95);
    g.fillRect(x - width / 2 - 1, y - 1, width + 2, 6);
    g.fillStyle(owner === "p1" ? friendly : enemy);
    g.fillRect(x - width / 2, y, width * Math.max(0, ratio), 4);
    g.lineStyle(1, 0x101c22);
    for (let i = 1; i < 4; i++)
      g.lineBetween(
        x - width / 2 + (width * i) / 4,
        y,
        x - width / 2 + (width * i) / 4,
        y + 4,
      );
  }
  private renderOverlay(time: number) {
    const s = this.snapshot!,
      g = this.overlay;
    g.clear();
    for (const id of this.selected) {
      const e = s.units[id] ?? s.buildings[id];
      if (!e || e.hp <= 0 || !this.visible(e.x, e.y, e.owner)) continue;
      const p = projectRTS(e.x, e.y),
        building = !!s.buildings[id];
      g.lineStyle(5, 0x101c22, 0.8);
      g.strokeEllipse(p.x, p.y + 3, building ? 78 : 30, building ? 36 : 15);
      g.lineStyle(2, e.owner === "p1" ? friendly : enemy);
      g.strokeEllipse(p.x, p.y + 3, building ? 78 : 30, building ? 36 : 15);
      const unit = s.units[id];
      if (unit?.owner === "p1" && unit.path.length) {
        const route = [p, ...unit.path.map((at) => projectRTS(at.x, at.y))];
        g.lineStyle(4, 0x101c22, 0.7);
        g.strokePoints(route, false);
        g.lineStyle(1, paper, 0.75);
        g.strokePoints(route, false);
        const end = route.at(-1)!;
        g.strokeCircle(end.x, end.y, 5);
      }
      if (s.buildings[id]?.owner === "p1") {
        const rally = s.buildings[id].rally,
          r = projectRTS(rally.x, rally.y);
        g.lineStyle(1, friendly, 0.5);
        g.lineBetween(p.x, p.y, r.x, r.y);
        g.lineStyle(2, paper);
        g.lineBetween(r.x, r.y, r.x, r.y - 25);
        g.fillStyle(friendly);
        g.fillTriangle(r.x, r.y - 25, r.x + 13, r.y - 19, r.x, r.y - 13);
      }
    }
    this.commands = this.commands.filter((c) => time - c.at < 850);
    for (const c of this.commands) {
      const age = (time - c.at) / 850;
      g.lineStyle(2, friendly, 1 - age);
      g.strokeEllipse(c.p.x, c.p.y, 18 + age * 24, 9 + age * 12);
      g.lineBetween(c.p.x - 5, c.p.y, c.p.x + 5, c.p.y);
      g.lineBetween(c.p.x, c.p.y - 4, c.p.x, c.p.y + 4);
    }
    if (this.placement && this.hoverPoint) {
      const x = Math.round(this.hoverPoint.x),
        y = Math.round(this.hoverPoint.y),
        p = projectRTS(x, y);
      const reason = placementReason(s, "p1", this.placement, x, y);
      this.placementValid = !reason;
      const valid = this.placementValid;
      g.lineStyle(3, valid ? friendly : enemy);
      g.strokePoints(
        [
          { x: p.x, y: p.y - 22 },
          { x: p.x + 44, y: p.y },
          { x: p.x, y: p.y + 22 },
          { x: p.x - 44, y: p.y },
        ],
        true,
      );
      if (!valid) {
        g.lineBetween(p.x - 12, p.y - 8, p.x + 12, p.y + 8);
        g.lineBetween(p.x + 12, p.y - 8, p.x - 12, p.y + 8);
      }
      const look = this.buildingAppearance({
        kind: this.placement,
        owner: "p1",
        hp: 1,
        progress: 1,
      } as RTSBuilding);
      this.ghost ??= this.add
        .image(p.x, p.y, look.texture, look.frame)
        .setOrigin(0.5, 0.84)
        .setDepth(8000);
      this.ghost
        .setTexture(look.texture, look.frame)
        .setDisplaySize(look.width, look.height)
        .setPosition(p.x, p.y)
        .setAlpha(0.5)
        .setVisible(true)
        .setTint(valid ? 0xb8d6a4 : 0xffb4a4);
      this.tooltip
        .setText(valid ? "Place foundation · left click" : reason)
        .setPosition(p.x, p.y + 30)
        .setVisible(true);
    } else {
      this.ghost?.setVisible(false);
      const e = this.hoverEntity
        ? (s.units[this.hoverEntity] ??
          s.buildings[this.hoverEntity] ??
          s.resources[this.hoverEntity])
        : undefined;
      if (e && this.visible(e.x, e.y, "owner" in e ? e.owner : undefined)) {
        const p = projectRTS(e.x, e.y);
        this.tooltip
          .setText(e.name)
          .setPosition(p.x + 18, p.y + 12)
          .setVisible(true);
      } else this.tooltip.setVisible(false);
    }
    this.tooltip.setScale(1 / this.cameras.main.zoom);
    this.drag.clear();
    if (this.press?.button === 0 && !this.placement) {
      const p = this.input.activePointer,
        a = this.press.screen;
      if (Math.hypot(p.x - a.x, p.y - a.y) > 7) {
        this.drag.fillStyle(friendly, 0.08);
        this.drag.fillRect(a.x, a.y, p.x - a.x, p.y - a.y);
        this.drag.lineStyle(1, friendly);
        this.drag.strokeRect(a.x, a.y, p.x - a.x, p.y - a.y);
      }
    }
  }
  private renderEffects(time: number) {
    const g = this.effects;
    g.clear();
    this.flights = this.flights.filter((f) => {
      const age = (time - f.time) / f.duration;
      if (age >= 1) {
        this.impacts.push({ p: f.end, at: time, siege: f.siege });
        return false;
      }
      const x = f.start.x + (f.end.x - f.start.x) * age,
        y =
          f.start.y +
          (f.end.y - f.start.y) * age -
          Math.sin(age * Math.PI) * (f.siege ? 70 : 12);
      if (f.siege) {
        g.fillStyle(0xc1b59d);
        g.fillCircle(x, y, 4);
      } else {
        g.lineStyle(2, paper);
        const dx = f.end.x - f.start.x,
          dy = f.end.y - f.start.y,
          d = Math.max(1, Math.hypot(dx, dy));
        g.lineBetween(x, y, x - (dx / d) * 10, y - (dy / d) * 10);
      }
      return true;
    });
    this.impacts = this.impacts.filter((e) => time - e.at < 450);
    for (const effect of this.impacts) {
      const age = (time - effect.at) / 450;
      for (let n = 0; n < 6; n++) {
        const angle = (n * Math.PI) / 3,
          r = age * (effect.siege ? 26 : 11);
        g.fillStyle(n % 2 ? 0xd5c29c : 0x92786c, (1 - age) * 0.8);
        g.fillCircle(
          effect.p.x + Math.cos(angle) * r,
          effect.p.y + Math.sin(angle) * r * 0.6,
          effect.siege ? 3 : 1.5,
        );
      }
    }
  }
  update(time: number, delta: number) {
    if (!this.snapshot) return;
    this.frameTimes.push(delta);
    if (this.frameTimes.length > 600) this.frameTimes.shift();
    const camera = this.cameras.main,
      speed = (Math.min(delta, 50) * 0.7) / camera.zoom,
      p = this.input.activePointer;
    const edge = p.event?.target === this.game.canvas && !this.press;
    if (this.panKeys.has("ArrowLeft") || (edge && p.x < 12))
      camera.scrollX -= speed;
    if (this.panKeys.has("ArrowRight") || (edge && p.x > this.scale.width - 12))
      camera.scrollX += speed;
    if (this.panKeys.has("ArrowUp") || (edge && p.y < 12))
      camera.scrollY -= speed;
    if (this.panKeys.has("ArrowDown") || (edge && p.y > this.scale.height - 12))
      camera.scrollY += speed;
    this.renderUnits(time, Math.min(delta, 50));
    this.renderDetails(time);
    this.renderOverlay(time);
    this.renderEffects(time);
  }
  diagnostics() {
    const times = [...this.frameTimes].sort((a, b) => a - b);
    return {
      renderer: "Phaser Canvas",
      frames: times.length,
      p50: times[Math.floor(times.length * 0.5)] ?? 0,
      p95: times[Math.floor(times.length * 0.95)] ?? 0,
      actors: this.actors.size,
      buildings: this.sites.size,
      zoom: this.loaded ? this.cameras.main.zoom : 0,
      lastSnapshotAge: this.time ? this.time.now - this.lastStateAt : 0,
    };
  }
  setReducedMotion(reduced: boolean) {
    this.motionPreference = reduced;
    this.motionChanged?.();
  }
  setCommandMode(active: boolean) {
    this.commandMode = active;
  }
  worldToScreen(x: number, y: number) {
    const p = projectRTS(x, y),
      c = this.cameras.main;
    return {
      x: (p.x - c.scrollX) * c.zoom + ((1 - c.zoom) * c.width) / 2,
      y: (p.y - c.scrollY) * c.zoom + ((1 - c.zoom) * c.height) / 2,
    };
  }
}

export function createRtsWorld(
  parent: HTMLElement,
  callbacks: RTSWorldCallbacks,
) {
  const scene = new RTSWorld(callbacks);
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    backgroundColor: "#182e33",
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth || 960,
      height: parent.clientHeight || 640,
    },
    scene,
    render: {
      antialias: true,
      antialiasGL: false,
      powerPreference: "low-power",
    },
    fps: { target: 60 },
    audio: { noAudio: true },
  });
  return {
    setState: (
      s: RTSState,
      selected: string[],
      placement?: RTSBuilding["kind"],
    ) => scene.accept(s, selected, placement),
    center: (x: number, y: number) => scene.center(x, y),
    setReducedMotion: (reduced: boolean) => scene.setReducedMotion(reduced),
    setCommandMode: (active: boolean) => scene.setCommandMode(active),
    destroy: () => game.destroy(true),
    diagnostics: () => scene.diagnostics(),
    worldToScreen: (x: number, y: number) => scene.worldToScreen(x, y),
    scene,
    game,
  };
}

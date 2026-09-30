import Phaser from "phaser";
import type { Match, Pos } from "../simulation/types";
import { art } from "../content/catalog";
import {
  directionFor,
  motionFamily,
  motionAppearance,
  COMPANION_FRAMES,
  directionalMaster,
  type PaintedFigure,
  motionFrame,
  paintMotionAtlas,
  MOTION_ATLAS,
  type FigureAction,
  type FigureDirection,
} from "./figure-motion";
import {
  captureView,
  transitionCues,
  walkPosition,
  visualSeed,
  MAX_CUES,
  type ViewFrame,
  type VisualCue,
} from "./presentation";

type Walk = { route: Pos[]; age: number; duration: number };
type Effect = { cue: VisualCue; age: number; text?: Phaser.GameObjects.Text };
/** Bounded, disposable presentation. Owns no rule state, transport or RNG. */
export class LivingWorld {
  private frame?: ViewFrame;
  private walks = new Map<string, Walk>();
  private effects: Effect[] = [];
  private ambient: Phaser.GameObjects.Graphics;
  private action: Phaser.GameObjects.Graphics;
  private clock = 0;
  private paintAt = -1;
  private enabled = true;
  private motionSprites = new Map<string, Phaser.GameObjects.Image>();
  private motionTextures = new Set<string>();
  constructor(
    private scene: Phaser.Scene,
    private project: (x: number, y: number) => Pos,
  ) {
    this.ambient = scene.add.graphics().setDepth(4000);
    this.action = scene.add.graphics().setDepth(9000);
  }
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.walks.clear();
      this.clearEffects();
      this.ambient.clear();
      this.action.clear();
      for (const sprite of this.motionSprites.values())
        sprite.setVisible(false);
    }
  }
  getEnabled() {
    return this.enabled;
  }
  accept(s: Match, seat: string) {
    const frame = captureView(s, seat);
    if (
      this.frame &&
      (this.frame.match !== frame.match ||
        this.frame.seat !== seat ||
        frame.revision < this.frame.revision ||
        frame.turn < this.frame.turn)
    ) {
      this.walks.clear();
      this.clearEffects();
    }
    const cues = transitionCues(this.frame, frame, s);
    this.frame = frame;
    for (const [id, walk] of this.walks) {
      const e = frame.entities[id],
        end = walk.route.at(-1)!;
      if (!e?.alive || e.x !== end.x || e.y !== end.y) this.walks.delete(id);
    }
    // Becoming hidden cancels effects as well as sprites. Never finish a stale reveal.
    this.effects = this.effects.filter((e) => {
      const keep = ["capture", "magic"].includes(e.cue.kind)
        ? e.cue.kind === "capture" || !!frame.zones[e.cue.entity]
        : !!frame.entities[e.cue.entity];
      if (!keep) e.text?.destroy();
      return keep;
    });
    if (!this.enabled) return;
    for (const cue of cues) {
      if (cue.kind === "travel" && cue.route) {
        if (this.walks.size >= MAX_CUES)
          this.walks.delete(this.walks.keys().next().value!);
        this.walks.set(cue.entity, {
          route: cue.route,
          age: 0,
          duration: Math.min(2600, 600 + (cue.route.length - 1) * 220),
        });
        continue;
      }
      if (this.effects.length >= MAX_CUES)
        this.effects.shift()?.text?.destroy();
      const p = this.project(cue.x, cue.y);
      const label =
        cue.kind === "impact"
          ? `−${cue.amount}`
          : cue.kind === "work"
            ? "Work changed"
            : cue.kind === "arrival"
              ? "Arrived"
              : cue.kind === "capture"
                ? "Control changed"
                : cue.kind === "loss"
                  ? "Lost"
                  : "";
      const text = label
        ? this.scene.add
            .text(p.x, p.y - 48, label, {
              fontFamily: "Noto Sans, Arial, sans-serif",
              fontSize: "15px",
              color:
                cue.kind === "impact" || cue.kind === "loss"
                  ? "#ffb4a4"
                  : "#f2e8d5",
              backgroundColor: "#192a30",
              padding: { x: 5, y: 3 },
            })
            .setOrigin(0.5, 1)
            .setDepth(10002)
        : undefined;
      this.effects.push({ cue, age: 0, text });
    }
  }
  isWalking(id: string) {
    return this.walks.has(id);
  }
  /** Diagnostics contain counts only, never hidden state. */
  stats() {
    return {
      enabled: this.enabled,
      walks: this.walks.size,
      effects: this.effects.length,
      ambientActors: this.enabled ? 8 : 0,
      clock: this.clock,
      motionSprites: this.motionSprites.size,
      motionAtlases: this.motionTextures.size,
    };
  }
  private animateFigure(
    id: string,
    profile: string,
    kind: string,
    at: Pos,
    action: FigureAction,
    direction: FigureDirection,
    frame: number,
    active: Set<string>,
  ) {
    if (active.size >= MAX_CUES * 3) return;
    const family = motionFamily(
      profile,
      kind,
      profile ? art(profile).family : "embodied-wild",
    );
    const entity = this.frame?.entities[id];
    const appearance = motionAppearance(
      profile,
      kind,
      entity?.companion,
      entity?.secondary,
    );
    const idleMaster = directionalMaster(appearance.frame, "east");
    const paintedSource =
      idleMaster && this.scene.textures.exists(idleMaster.texture)
        ? this.scene.textures.getFrame(idleMaster.texture, idleMaster.frame)
        : this.scene.textures.getFrame(
            COMPANION_FRAMES[appearance.frame]
              ? "companion-figures"
              : "world-figures",
            appearance.frame,
          );
    const targetHeight =
      action === "work"
        ? 20
        : kind === "company"
          ? 24
          : kind === "hero"
            ? 34
            : 32;
    const pixelScale = paintedSource
      ? Math.min(
          40 / paintedSource.cutWidth,
          targetHeight / paintedSource.cutHeight,
        ) / Math.min(52 / paintedSource.cutWidth, 50 / paintedSource.cutHeight)
      : 0.64;
    const key = `figure-motion:${family === "dragon" ? "dragon" : appearance.frame}`;
    if (!this.scene.textures.exists(key)) {
      const atlas = this.scene.textures.createCanvas(
        key,
        MOTION_ATLAS.width,
        MOTION_ATLAS.height,
      )!;
      const source = paintedSource;
      const masters: PaintedFigure["directions"] = {};
      for (const direction of ["north", "east", "south", "west"] as const) {
        const entry = directionalMaster(appearance.frame, direction);
        const frame =
          entry && this.scene.textures.exists(entry.texture)
            ? this.scene.textures.getFrame(entry.texture, entry.frame)
            : undefined;
        if (frame)
          masters[direction] = {
            image: frame.source.image as CanvasImageSource,
            x: frame.cutX,
            y: frame.cutY,
            width: frame.cutWidth,
            height: frame.cutHeight,
            archetype: appearance.frame,
          };
      }

      paintMotionAtlas(
        atlas.context,
        family,
        source
          ? {
              image: source.source.image as CanvasImageSource,
              x: source.cutX,
              y: source.cutY,
              width: source.cutWidth,
              height: source.cutHeight,
              archetype: appearance.frame,
              directions: masters,
            }
          : undefined,
      );
      for (let i = 0; i < MOTION_ATLAS.framesPerFamily; i++)
        atlas.add(i, 0, (i % 8) * 64, Math.floor(i / 8) * 64, 64, 64);
      atlas.refresh();
      this.motionTextures.add(key);
    }
    const view = this.scene.cameras.main.worldView;
    const offsets =
      kind === "company" && action !== "work" ? [0, -10, 10] : [0];
    for (const offset of offsets) {
      const actor = offset === 0 ? id : `${id}:rank:${offset}`;
      let sprite = this.motionSprites.get(actor);
      if (!sprite) {
        sprite = this.scene.add.image(at.x, at.y, key).setOrigin(0.5, 54 / 64);
        this.motionSprites.set(actor, sprite);
      }
      sprite
        .setPosition(at.x + offset, at.y + Math.abs(offset) / 5)
        .setTexture(
          key,
          motionFrame(
            action,
            direction,
            frame + (offset === 0 ? 0 : offset < 0 ? 1 : 2),
          ),
        )
        .setScale(pixelScale)
        .setDepth(at.y + Math.abs(offset) / 5 + 1)
        .setVisible(
          at.x >= view.x - 64 &&
            at.x <= view.right + 64 &&
            at.y >= view.y - 64 &&
            at.y <= view.bottom + 64,
        );
      active.add(actor);
    }
  }
  update(
    delta: number,
    marks: Map<string, Phaser.GameObjects.Container>,
    selected: string,
  ) {
    const dt = Math.min(50, Math.max(0, delta));
    if (this.enabled) this.clock += dt;
    const animated = new Set<string>();
    for (const [id, c] of marks) {
      const sprite = c.list[0] as Phaser.GameObjects.Image;
      const walk = this.walks.get(id);
      const entity = this.frame?.entities[id];
      const attack = this.effects.find(
        (e) => e.cue.entity === id && e.cue.kind === "attack" && e.age < 640,
      );
      sprite.setVisible(true).setY(-4).setRotation(0);
      if (walk && this.enabled) {
        walk.age += dt;
        const at = walkPosition(walk.route, walk.age / walk.duration),
          p = this.project(at.x, at.y);
        c.setPosition(p.x, p.y);
        const segment = Math.min(
          walk.route.length - 2,
          Math.floor((walk.age / walk.duration) * (walk.route.length - 1)),
        );
        if (entity && walk.age < walk.duration)
          this.animateFigure(
            id,
            entity.profile,
            entity.kind,
            p,
            "walk",
            directionFor(walk.route[segment], walk.route[segment + 1]),
            Math.floor(walk.age / 110),
            animated,
          );
        sprite.setVisible(false);
        if (walk.age >= walk.duration) {
          this.walks.delete(id);
          sprite.setVisible(true);
        }
      } else {
        c.setPosition(c.getData("targetX"), c.getData("targetY"));
        if (this.enabled && attack && entity && !entity.building) {
          const direction = attack.cue.target
            ? directionFor(entity, attack.cue.target)
            : "east";
          this.animateFigure(
            id,
            entity.profile,
            entity.kind,
            { x: c.x, y: c.y },
            "attack",
            direction,
            Math.floor(attack.age / 160),
            animated,
          );
          sprite.setVisible(false);
        }
      }
      c.setDepth(id === selected ? 10000 : c.y);
    }
    if (this.enabled && this.frame) {
      let works = 0;
      for (const e of Object.values(this.frame.entities)) {
        if (e.building && e.alive && e.working && works++ < 16) {
          const p = this.project(e.x, e.y);
          this.animateFigure(
            `work:${e.id}`,
            e.profile,
            "worker",
            { x: p.x + 22, y: p.y + 8 },
            "work",
            "east",
            Math.floor(this.clock / 180),
            animated,
          );
        }
      }
    }
    for (const [id, image] of this.motionSprites)
      if (!animated.has(id)) {
        image.destroy();
        this.motionSprites.delete(id);
      }
    if (!this.enabled || !this.frame) return;
    for (const e of this.effects) e.age += dt;
    this.effects = this.effects.filter((e) => {
      if (e.age < 1800) return true;
      e.text?.destroy();
      return false;
    });
    if (this.clock - this.paintAt < 32) return;
    this.paintAt = this.clock;
    const camera = this.scene.cameras.main,
      view = camera.worldView;
    const within = (p: Pos) =>
      p.x >= view.x - 100 &&
      p.x <= view.right + 100 &&
      p.y >= view.y - 100 &&
      p.y <= view.bottom + 100;
    const g = this.ambient;
    g.clear();
    const t = this.clock / 1000;
    // Distant birds and broad drifting vapour are atmospheric decoration, not actors.
    for (let i = 0; i < 5; i++) {
      const x = ((t * 22 + i * 417) % 2300) - 1100,
        y = 180 + i * 112 + Math.sin(t * 0.3 + i) * 28,
        p = { x, y };
      if (!within(p)) continue;
      const wing = 3 + Math.sin(t * 4 + i) * 3;
      g.lineStyle(1.5, 0x263c42, 0.7);
      g.strokePoints(
        [
          { x: x - 8, y: y - wing },
          { x, y: y + 1 },
          { x: x + 8, y: y - wing },
        ],
        false,
      );
    }
    for (let i = 0; i < 3; i++) {
      const x = ((t * 7 + i * 630) % 2600) - 1300,
        y = 380 + i * 330;
      if (!within({ x, y })) continue;
      for (let layer = 0; layer < 3; layer++) {
        g.fillStyle(0xc4d8d2, 0.009);
        g.fillEllipse(x, y, 360 - layer * 70, 42 - layer * 8);
      }
    }
    let works = 0;
    for (const e of Object.values(this.frame.entities)) {
      if (!e.building || !e.alive || !e.working || works >= 16) continue;
      const p = this.project(e.x, e.y);
      if (!within(p)) continue;
      works++;
      const seed = visualSeed(e.id),
        cycle = (t + (seed % 31)) % 4;
      // Existing queue effort: a small moving tool/worker at its actual footprint.
      // Craft activity stays local; no universal smoke over living habitats.
      if (
        e.hearth &&
        ["workshop", "forge", "core", "training"].includes(e.kind)
      ) {
        for (let j = 0; j < 3; j++) {
          const age = (cycle + j * 1.3) % 4;
          g.fillStyle(0xc1c6bb, (1 - age / 4) * 0.12);
          g.fillEllipse(
            p.x + 8 + age * 5,
            p.y - 37 - age * 11,
            5 + age * 4,
            8 + age * 5,
          );
        }
      }
    }
    const a = this.action;
    a.clear();
    // Ownership remains a separate, stable glyph while the painted idle marker
    // is replaced by articulated frames; hit areas stay on the original marker.
    a.lineStyle(2, 0xf2e8d5, 0.95);
    for (const [id, sprite] of this.motionSprites)
      if (!id.startsWith("work:") && !id.includes(":rank:") && sprite.visible)
        a.strokeTriangle(
          sprite.x - 17,
          sprite.y + 7,
          sprite.x - 13,
          sprite.y + 1,
          sprite.x - 9,
          sprite.y + 7,
        );
    for (const e of this.effects) {
      const p = this.project(e.cue.x, e.cue.y),
        phase = e.age / 1800,
        alpha = 1 - phase;
      e.text
        ?.setVisible(within(p))
        .setAlpha(Math.min(1, alpha * 2))
        .setPosition(p.x, p.y - 48 - phase * 18)
        .setScale(1 / camera.zoom);
      if (!within(p)) continue;
      a.lineStyle(
        2,
        e.cue.kind === "impact" || e.cue.kind === "loss" ? 0xffb4a4 : 0xedbe73,
        alpha,
      );
      if (e.cue.kind === "impact") {
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5,
            r = 7 + phase * 28;
          a.lineBetween(
            p.x + Math.cos(angle) * r,
            p.y - 10 + Math.sin(angle) * r * 0.55,
            p.x + Math.cos(angle) * (r + 9),
            p.y - 10 + Math.sin(angle) * (r + 9) * 0.55,
          );
        }
      } else if (e.cue.kind === "attack") {
        // Actual actor articulation already carries the attack; no invented bolt.
      } else if (e.cue.kind === "loss") {
        a.lineBetween(p.x - 12, p.y - 24, p.x + 12, p.y);
        a.lineBetween(p.x + 12, p.y - 24, p.x - 12, p.y);
      } else if (e.cue.kind === "capture") {
        a.lineBetween(p.x, p.y, p.x, p.y - 65);
        a.strokeTriangle(p.x, p.y - 65, p.x + 25, p.y - 57, p.x, p.y - 48);
      } else if (e.cue.kind === "work") {
        a.lineBetween(p.x - 12, p.y, p.x + 9, p.y - 28);
        a.strokeRect(p.x + 2, p.y - 30, 16, 7);
      } else {
        for (const side of [-1, 1])
          a.strokePoints(
            [
              { x: p.x + side * (24 + phase * 18), y: p.y + 8 },
              { x: p.x + side * (30 + phase * 18), y: p.y - 7 },
              { x: p.x + side * (20 + phase * 18), y: p.y - 24 },
            ],
            false,
          );
      }
    }
  }
  private clearEffects() {
    for (const e of this.effects) e.text?.destroy();
    this.effects = [];
  }
  destroy() {
    this.clearEffects();
    this.walks.clear();
    this.ambient.destroy();
    this.action.destroy();
    for (const sprite of this.motionSprites.values()) sprite.destroy();
    this.motionSprites.clear();
    for (const key of this.motionTextures) this.scene.textures.remove(key);
    this.motionTextures.clear();
  }
}

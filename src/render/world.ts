import { LivingWorld } from "./living-world";
import {
  motionAppearance,
  COMPANION_FRAMES,
  DIRECTIONAL_SHEETS,
  directionalMaster,
} from "./figure-motion";
import { buildingFrame, figureFrame } from "./building-art";
import { isAboard, isNavalCrew } from "../simulation/naval";
import Phaser from "phaser";
import type { Match, Pos } from "../simulation/types";
import type { Zone } from "../simulation/zones";
import { visible, silhouetteContacts } from "../simulation/engine";
import { art, economy } from "../content/catalog";
import { createBasinScenario } from "../content/scenario";
const TILE_X = 68,
  TILE_Y = 34;
export const iso = (x: number, y: number) => ({
  x: (x - y) * TILE_X,
  y: (x + y) * TILE_Y,
});
/** Diamond bounds for an 8×8 chunk or a smaller edge chunk. */
export function chunkBounds(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const left = iso(x, y + height - 1).x - TILE_X;
  const top = iso(x, y).y - TILE_Y;
  return {
    x: left,
    y: top,
    width: (width + height) * TILE_X,
    height: (width + height) * TILE_Y,
  };
}
export const markerTargetSize = (zoom: number) => Math.max(44 / zoom, 44);
/** Original code-authored pigment studies. Every stroke remains inside its
 * terrain diamond; these are not sampled landmarks from the independent plate.
 * Six broad strokes per cell are baked into the existing bounded chunk cache.
 */
export function terrainPaint(kind: string, x: number, y: number) {
  const palette: Record<
    string,
    { base: number; light: number; shadow: number; feature: string }
  > = {
    meadow: {
      base: 0x344d43,
      light: 0x718475,
      shadow: 0x293f42,
      feature: "grass",
    },
    woodland: {
      base: 0x214b48,
      light: 0x59786b,
      shadow: 0x19343e,
      feature: "canopy",
    },
    water: {
      base: 0x28505c,
      light: 0x96b7bc,
      shadow: 0x253e59,
      feature: "flow",
    },
    stone: {
      base: 0x4d5962,
      light: 0x939caa,
      shadow: 0x383d59,
      feature: "mineral",
    },
    cliff: {
      base: 0x343342,
      light: 0x7c7d8e,
      shadow: 0x252738,
      feature: "strata",
    },
  };
  const paint = palette[kind] ?? {
    base: 0x192a30,
    light: 0x7e9699,
    shadow: 0x101c22,
    feature: "unknown",
  };
  const hash = ((x * 73856093) ^ (y * 19349663)) >>> 0;
  const strokes = Array.from({ length: 6 }, (_, i) => {
    const yy = -22 + i * 8,
      half = 68 * (1 - Math.abs(yy) / 34) - 5;
    const shift = ((hash >>> (i * 3)) % 7) - 3;
    return {
      color: i % 3 ? paint.light : paint.shadow,
      alpha: i % 3 ? 0.16 : 0.24,
      width: 4 + ((hash + i) % 5),
      points: [
        { x: -half + 4 + shift, y: yy },
        { x: half - 4 + shift, y: yy },
      ],
    };
  });
  return { ...paint, opacity: 1, strokes };
}
export const displayedZones = (s: Match, seat: string) =>
  Object.values(s.zones).filter(
    (z) => z.until > s.revision && (z.owner === seat || visible(s, seat, z)),
  );
/** Fixed-size outline following the same circle, capsule and cone footprints as rules. */
export function zoneOutline(z: Zone): Pos[] {
  const angle = Math.atan2(z.dy, z.dx);
  if (z.kind === "flare")
    return [
      iso(z.x, z.y),
      ...Array.from({ length: 13 }, (_, i) => {
        const a = angle - Math.PI / 6 + (i * Math.PI) / 36;
        return iso(z.x + Math.cos(a) * z.radius, z.y + Math.sin(a) * z.radius);
      }),
    ];
  const round = !["web", "threshold", "flare"].includes(z.kind);
  return Array.from({ length: 26 }, (_, i) => {
    const end = !round && i < 13;
    const a = round
      ? (i * Math.PI * 2) / 26
      : angle +
        (end
          ? -Math.PI / 2 + (i * Math.PI) / 12
          : Math.PI / 2 + ((i - 13) * Math.PI) / 12);
    return iso(
      z.x + (end ? z.dx : 0) + Math.cos(a) * z.radius,
      z.y + (end ? z.dy : 0) + Math.sin(a) * z.radius,
    );
  });
}
export const isEditingTarget = (target: Element | null) =>
  Boolean(
    target?.closest(
      'input,textarea,select,button,[contenteditable="true"],[role="dialog"]',
    ),
  );
export const TERRAIN_CACHE_LIMIT = 16;
export const TERRAIN_CACHE_MAX_BYTES = 16 * 1148 * 634 * 4;
/** Inspection layer reads only the public terrain array, never entity state. */
export const RULES_TERRAIN_LEGEND =
  "Rules terrain: Meadow = three grass strokes; Woodland = tree triangle; Water = parallel waves; Stone = square; Cliff = double chevrons; Unknown = cross. Tile type alone does not promise a clear route.";
export function rulesTerrainStyle(terrain: string): {
  fill: number;
  symbol: string;
} {
  switch (terrain) {
    case "meadow":
      return { fill: 0x304e42, symbol: "grass" };
    case "woodland":
      return { fill: 0x163f3b, symbol: "tree" };
    case "water":
      return { fill: 0x284d60, symbol: "waves" };
    case "stone":
      return { fill: 0x454955, symbol: "square" };
    case "cliff":
      return { fill: 0x302e40, symbol: "chevrons" };
    default:
      return { fill: 0x192a30, symbol: "unknown" };
  }
}
function drawRuleMark(
  g: Phaser.GameObjects.Graphics,
  p: Pos,
  symbol: string,
): void {
  g.lineStyle(3, 0xf2e8d5, 1);
  if (symbol === "grass") {
    for (const dx of [-12, 0, 12])
      g.lineBetween(p.x + dx - 3, p.y + 8, p.x + dx + 3, p.y - 8);
  } else if (symbol === "tree") {
    g.strokeTriangle(p.x, p.y - 13, p.x - 15, p.y + 8, p.x + 15, p.y + 8);
    g.lineBetween(p.x, p.y + 8, p.x, p.y + 14);
  } else if (symbol === "waves") {
    for (const dy of [-7, 5])
      g.strokePoints(
        [
          { x: p.x - 20, y: p.y + dy },
          { x: p.x - 10, y: p.y + dy - 4 },
          { x: p.x, y: p.y + dy },
          { x: p.x + 10, y: p.y + dy - 4 },
          { x: p.x + 20, y: p.y + dy },
        ],
        false,
      );
  } else if (symbol === "square") g.strokeRect(p.x - 11, p.y - 10, 22, 20);
  else if (symbol === "chevrons") {
    for (const dy of [-7, 7])
      g.strokePoints(
        [
          { x: p.x - 17, y: p.y + dy + 5 },
          { x: p.x, y: p.y + dy - 5 },
          { x: p.x + 17, y: p.y + dy + 5 },
        ],
        false,
      );
  } else {
    g.lineBetween(p.x - 9, p.y - 9, p.x + 9, p.y + 9);
    g.lineBetween(p.x - 9, p.y + 9, p.x + 9, p.y - 9);
  }
}
type Chunk = {
  image?: Phaser.GameObjects.Image;
  texture?: string;
  failed?: boolean;
  graphics: Phaser.GameObjects.Graphics;
  bounds: Phaser.Geom.Rectangle;
  cells: { x: number; y: number; terrain: string }[];
};

export class World extends Phaser.Scene {
  private state?: Match;
  private seat = "p1";
  private selected = "";
  private marks = new Map<string, Phaser.GameObjects.Container>();
  private chunks: Chunk[] = [];
  private terrainSerial = 0;
  private rulesTerrain = false;
  private terrainStamp = "";
  private pool: Phaser.GameObjects.Container[] = [];
  private reducedMotion = false;
  private motionMode: "system" | "reduced" = "system";
  private life?: LivingWorld;
  private motionQuery?: MediaQueryList;
  private selection?: Phaser.GameObjects.Graphics;
  private textureKeys = new Set<string>();
  private materialPaint = new Map<string, HTMLCanvasElement>();
  private labels?: Phaser.GameObjects.Graphics;
  private keys?: Phaser.Types.Input.Keyboard.CursorKeys;
  private loaded = false;
  private onSelect: (id: string) => void;
  private onTile: (p: Pos) => void;
  constructor(select: (id: string) => void, tile: (p: Pos) => void) {
    super("world");
    this.onSelect = select;
    this.onTile = tile;
  }
  preload() {
    for (const sheet of DIRECTIONAL_SHEETS) {
      this.load.image(
        sheet.key,
        `${import.meta.env.BASE_URL}assets/sm-${sheet.key}-v1.png`,
      );
    }

    this.load.image(
      "companion-paint",
      `${import.meta.env.BASE_URL}assets/sm-companion-figures-color-v1.png`,
    );
    this.load.image(
      "companion-matte",
      `${import.meta.env.BASE_URL}assets/sm-companion-figures-matte-v1.png`,
    );
    this.load.image(
      "basin-materials",
      `${import.meta.env.BASE_URL}assets/sm-terrain-materials-v1.png`,
    );
    this.load.atlas(
      "buildings",
      `${import.meta.env.BASE_URL}assets/sm-building-atlas-v1.webp`,
      `${import.meta.env.BASE_URL}assets/building-atlas.json`,
    );
    this.load.atlas(
      "world-figures",
      `${import.meta.env.BASE_URL}assets/sm-world-figures-v1.webp`,
      `${import.meta.env.BASE_URL}assets/world-figures.json`,
    );
    this.load.on("loaderror", () => {
      /* Procedural terrain remains available if optional plate is absent. */
    });
  }
  create() {
    for (const sheet of DIRECTIONAL_SHEETS) {
      if (!this.textures.exists(sheet.key)) continue;
      const original = this.textures
        .get(sheet.key)
        .getSourceImage() as HTMLImageElement;
      const canvas = document.createElement("canvas");
      canvas.width = original.width;
      canvas.height = original.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(original, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.putImageData(pixels, 0, 0);
      this.textures.remove(sheet.key);
      const atlas = this.textures.addCanvas(sheet.key, canvas)!;
      // Generated paintings use measured gutters, not assumed perfect equal cells.
      const count = (x: number, y: number) =>
        pixels.data[(y * canvas.width + x) * 4 + 3] > 32 ? 1 : 0;
      const rowCuts = [0];
      for (let row = 1; row < sheet.archetypes.length; row++) {
        const ideal = (canvas.height * row) / sheet.archetypes.length,
          radius = (canvas.height / sheet.archetypes.length) * 0.4;
        let best = Math.round(ideal),
          score = Infinity;
        for (let y = Math.ceil(ideal - radius); y < ideal + radius; y++) {
          let ink = 0;
          for (let x = 0; x < canvas.width; x++) ink += count(x, y);
          const cost = ink + Math.abs(y - ideal) * 0.001;
          if (cost < score) {
            score = cost;
            best = y;
          }
        }
        rowCuts.push(best);
      }
      rowCuts.push(canvas.height);
      sheet.archetypes.forEach((name, row) => {
        const cuts = [0],
          y0 = rowCuts[row],
          y1 = rowCuts[row + 1];
        for (let col = 1; col < 4; col++) {
          const ideal = (canvas.width * col) / 4,
            radius = canvas.width * 0.045;
          let best = Math.round(ideal),
            score = Infinity;
          for (let x = Math.ceil(ideal - radius); x < ideal + radius; x++) {
            let ink = 0;
            for (let y = y0; y < y1; y++) ink += count(x, y);
            const cost = ink + Math.abs(x - ideal) * 0.001;
            if (cost < score) {
              score = cost;
              best = x;
            }
          }
          cuts.push(best);
        }
        cuts.push(canvas.width);
        ["north", "east", "south", "west"].forEach((direction, col) => {
          let left = cuts[col + 1],
            top = y1,
            right = cuts[col],
            bottom = y0;
          for (let y = y0; y < y1; y++)
            for (let x = cuts[col]; x < cuts[col + 1]; x++)
              if (count(x, y)) {
                left = Math.min(left, x);
                right = Math.max(right, x);
                top = Math.min(top, y);
                bottom = Math.max(bottom, y);
              }
          if (right >= left && bottom >= top)
            atlas.add(
              `${name}:${direction}`,
              0,
              left,
              top,
              right - left + 1,
              bottom - top + 1,
            );
        });
      });
    }

    if (
      this.textures.exists("companion-paint") &&
      this.textures.exists("companion-matte")
    ) {
      const canvas = document.createElement("canvas");
      canvas.width = 1536;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        this.textures
          .get("companion-matte")
          .getSourceImage() as CanvasImageSource,
        0,
        0,
      );
      const mask = ctx.getImageData(0, 0, 1536, 1024);
      ctx.clearRect(0, 0, 1536, 1024);
      ctx.drawImage(
        this.textures
          .get("companion-paint")
          .getSourceImage() as CanvasImageSource,
        0,
        0,
      );
      const paint = ctx.getImageData(0, 0, 1536, 1024);
      for (let i = 0; i < paint.data.length; i += 4)
        paint.data[i + 3] = Math.max(
          0,
          Math.min(255, ((mask.data[i] - 32) * 255) / 191),
        );
      ctx.putImageData(paint, 0, 0);
      const atlas = this.textures.addCanvas("companion-figures", canvas)!;
      for (const [name, [x, y, w, h]] of Object.entries(COMPANION_FRAMES))
        atlas.add(name, 0, x, y, w, h);
      this.textures.remove("companion-paint");
      this.textures.remove("companion-matte");
    }

    this.cameras.main.setBackgroundColor("#203d45");
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.life = new LivingWorld(this, iso);
    const motionChanged = () => this.setMotionMode(this.motionMode);
    this.motionQuery.addEventListener("change", motionChanged);
    motionChanged();
    if (this.state) this.life.accept(this.state, this.seat);
    this.game.canvas.tabIndex = 0;
    this.game.canvas.setAttribute(
      "aria-label",
      "Isometric world. Use the entity list for accessible selection; arrow keys pan when map is focused.",
    );
    this.labels = this.add.graphics().setDepth(5000);
    this.selection = this.add.graphics().setDepth(10001);
    this.keys = this.input.keyboard?.createCursorKeys();
    // Phaser cursor capture otherwise prevents arrow navigation inside DOM forms.
    this.input.keyboard?.removeCapture([37, 38, 39, 40]);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.motionQuery?.removeEventListener("change", motionChanged);
      this.life?.destroy();
      this.life = undefined;
      this.marks.clear();
      this.pool = [];
      for (const chunk of this.chunks) {
        if (chunk.texture) this.textures.remove(chunk.texture);
      }
      this.chunks = [];
      this.loaded = false;
      for (const key of this.textureKeys) this.textures.remove(key);
      this.textureKeys.clear();
      this.materialPaint.clear();
    });
    this.input.on(
      "wheel",
      (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) =>
        this.zoom(dy > 0 ? -0.08 : 0.08),
    );
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (
        p.event?.target === this.game.canvas &&
        p.isDown &&
        p.rightButtonDown()
      ) {
        this.cameras.main.scrollX -=
          (p.x - p.prevPosition.x) / this.cameras.main.zoom;
        this.cameras.main.scrollY -=
          (p.y - p.prevPosition.y) / this.cameras.main.zoom;
      }
    });
    this.input.mouse?.disableContextMenu();
    this.input.on(
      "pointerup",
      (p: Phaser.Input.Pointer, objects: unknown[]) => {
        if (
          p.event?.target === this.game.canvas &&
          p.leftButtonReleased() &&
          !objects.length
        ) {
          const pos = p.positionToCamera(
            this.cameras.main,
          ) as Phaser.Math.Vector2;
          this.onTile({
            x: Math.round((pos.x / TILE_X + pos.y / TILE_Y) / 2),
            y: Math.round((pos.y / TILE_Y - pos.x / TILE_X) / 2),
          });
        }
      },
    );
    this.loaded = true;
    this.cameras.main.setZoom(0.7);
    if (this.state) {
      this.drawTerrain();
      this.refresh();
      this.locate(`${this.seat}:core`);
    }
  }
  getMotionMode() {
    return this.motionMode;
  }
  setMotionMode(mode: "system" | "reduced") {
    this.motionMode = mode;
    this.reducedMotion = mode === "reduced" || !!this.motionQuery?.matches;
    this.life?.setEnabled(!this.reducedMotion);
  }
  motionStats() {
    return this.life?.stats();
  }
  getRulesTerrain(): boolean {
    return this.rulesTerrain;
  }
  setRulesTerrain(enabled: boolean): void {
    if (this.rulesTerrain === enabled) return;
    this.rulesTerrain = enabled;
    if (this.loaded) {
      this.drawTerrain();
      this.refresh();
    }
  }
  setState(s: Match, seat: string, selected: string) {
    const stamp = `${s.map.scenarioId ?? "legacy"}:${s.map.width}:${s.map.height}:${s.map.terrain.join(",")}`;
    const changed = this.state?.id !== s.id || this.terrainStamp !== stamp;
    this.terrainStamp = stamp;
    this.life?.accept(s, seat);
    this.state = s;
    this.seat = seat;
    this.selected = selected;
    if (this.loaded) {
      if (changed) this.drawTerrain();
      this.refresh();
    }
  }
  private drawTerrain() {
    if (!this.state) return;
    for (const chunk of this.chunks) {
      chunk.graphics.destroy();
      chunk.image?.destroy();
      if (chunk.texture) this.textures.remove(chunk.texture);
    }
    this.chunks = [];
    const s = this.state;
    const mapId = (s.map as Match["map"] & { scenarioId?: string }).scenarioId;
    const scenario =
      mapId === "cross-era-basin-v1" && s.map.width === s.map.height
        ? createBasinScenario(s.map.width)
        : undefined;
    const roadKeys = new Set(scenario?.roads.map((p) => `${p.x},${p.y}`) ?? []);
    const fordKeys = new Set(
      scenario?.crossings.map((p) => `${p.x},${p.y}`) ?? [],
    );
    for (let cy = 0; cy < s.map.height; cy += 8)
      for (let cx = 0; cx < s.map.width; cx += 8) {
        const width = Math.min(8, s.map.width - cx),
          height = Math.min(8, s.map.height - cy);
        const b = chunkBounds(cx, cy, width, height);
        // Extra margin accounts for authored vegetation above the diamond footprint.
        const bounds = new Phaser.Geom.Rectangle(
          b.x - 30,
          b.y - 60,
          b.width + 60,
          b.height + 90,
        );
        const g = this.add
          .graphics()
          .setPosition(bounds.x, bounds.y)
          .setDepth(-5);
        const cells: Chunk["cells"] = [];
        this.chunks.push({ graphics: g, bounds, cells });
        for (let y = cy; y < cy + height; y++)
          for (let x = cx; x < cx + width; x++) {
            const world = iso(x, y),
              p = { x: world.x - bounds.x, y: world.y - bounds.y },
              terrain = s.map.terrain[y * s.map.width + x];
            cells.push({ x, y, terrain });
            const rule = rulesTerrainStyle(terrain);
            const paint = terrainPaint(terrain, x, y);
            g.fillStyle(
              this.rulesTerrain ? rule.fill : paint.base,
              this.rulesTerrain || !this.textures.exists("basin-materials")
                ? 1
                : 0.28,
            );
            g.fillPoints(
              [
                { x: p.x, y: p.y - TILE_Y },
                { x: p.x + TILE_X, y: p.y },
                { x: p.x, y: p.y + TILE_Y },
                { x: p.x - TILE_X, y: p.y },
              ],
              true,
            );
            if (this.rulesTerrain) {
              g.lineStyle(1, 0x7e9699, 0.85);
              g.strokePoints(
                [
                  { x: p.x, y: p.y - TILE_Y },
                  { x: p.x + TILE_X, y: p.y },
                  { x: p.x, y: p.y + TILE_Y },
                  { x: p.x - TILE_X, y: p.y },
                ],
                true,
              );
              drawRuleMark(g, p, rule.symbol);
              continue;
            }
            for (const stroke of paint.strokes) {
              g.lineStyle(
                stroke.width,
                stroke.color,
                this.textures.exists("basin-materials")
                  ? stroke.alpha * 0.2
                  : stroke.alpha,
              );
              g.strokePoints(
                stroke.points.map((at) => ({ x: p.x + at.x, y: p.y + at.y })),
                false,
              );
            }
            if (terrain === "water") {
              // Flow follows the river's tile axis; bright ripples never imply land.
              g.lineStyle(2, paint.light, 0.52);
              g.lineBetween(p.x - 18, p.y - 10, p.x + 19, p.y + 9);
              g.lineStyle(1, 0xd0dace, 0.32);
              g.lineBetween(p.x - 9, p.y + 4, p.x + 10, p.y + 13);
            } else if (terrain === "cliff") {
              // Dark face and pale lip fit within the blocked footprint.
              g.fillStyle(paint.shadow, 0.7);
              g.fillPoints(
                [
                  { x: p.x - 44, y: p.y },
                  { x: p.x - 5, y: p.y - 20 },
                  { x: p.x + 42, y: p.y + 1 },
                  { x: p.x + 5, y: p.y + 24 },
                ],
                true,
              );
              for (const dy of [-9, 0, 9]) {
                g.lineStyle(3, paint.light, 0.6);
                g.strokePoints(
                  [
                    { x: p.x - 26, y: p.y + dy + 6 },
                    { x: p.x, y: p.y + dy - 7 },
                    { x: p.x + 25, y: p.y + dy + 4 },
                  ],
                  false,
                );
              }
            } else if (
              terrain === "woodland" &&
              !this.textures.exists("basin-materials")
            ) {
              // Layered canopy masses, kept clear of neighbouring road/water cells.
              for (const [dx, dy, r] of [
                [-18, 0, 18],
                [13, 2, 23],
                [0, -11, 17],
              ]) {
                g.fillStyle(paint.shadow, 0.7);
                g.fillEllipse(p.x + dx + 3, p.y + dy + 4, r * 1.7, r);
                g.fillStyle(paint.light, 0.42);
                g.fillEllipse(p.x + dx, p.y + dy, r * 1.5, r);
                g.lineStyle(2, 0x9eac88, 0.25);
                g.lineBetween(
                  p.x + dx - 5,
                  p.y + dy - 3,
                  p.x + dx + 5,
                  p.y + dy - 6,
                );
              }
            } else if (terrain === "stone") {
              g.fillStyle(paint.light, 0.28);
              g.fillPoints(
                [
                  { x: p.x - 22, y: p.y + 3 },
                  { x: p.x - 4, y: p.y - 12 },
                  { x: p.x + 17, y: p.y - 3 },
                  { x: p.x + 4, y: p.y + 8 },
                ],
                true,
              );
            }
            const key = `${x},${y}`;
            if (roadKeys.has(key) && !["water", "cliff"].includes(terrain)) {
              // Authored roads are visual routes, not an extra movement discount.
              g.lineStyle(9, 0xb29c76, 0.42);
              for (const [dx, dy] of [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
              ])
                if (roadKeys.has(`${x + dx},${y + dy}`)) {
                  const edge = iso(dx / 2, dy / 2);
                  g.lineBetween(p.x, p.y, p.x + edge.x, p.y + edge.y);
                }
            }
            if (fordKeys.has(key) && !["water", "cliff"].includes(terrain)) {
              g.lineStyle(5, 0xc6b8a0, 0.8);
              g.lineBetween(p.x - 31, p.y - 15, p.x + 31, p.y + 15);
              g.lineStyle(1, 0x283f43, 0.8);
              for (let i = -2; i <= 2; i++)
                g.lineBetween(
                  p.x + i * 11 - 6,
                  p.y + i * 5 + 3,
                  p.x + i * 11 + 6,
                  p.y + i * 5 - 3,
                );
            }
          }
      }
  }
  private dwelling(
    shape: Phaser.GameObjects.Graphics,
    family: string,
    hue: number,
  ) {
    shape.fillStyle(0x101c22, 0.45);
    shape.fillEllipse(4, 8, 50, 18);
    shape.fillStyle(hue, 0.95);
    if (family === "embodied-wild" || family === "living-refuge") {
      shape.fillEllipse(0, -7, 43, 30);
      shape.fillStyle(0x304c43);
      shape.fillEllipse(0, -14, 48, 26);
      shape.lineStyle(3, hue, 0.8);
      shape.lineBetween(-15, 0, -11, -17);
      shape.lineBetween(14, 1, 10, -18);
      shape.fillStyle(0xffce87);
      shape.fillEllipse(1, -1, 8, 10);
    } else if (family === "river-sea") {
      shape.fillPoints(
        [
          { x: -24, y: 0 },
          { x: -12, y: -17 },
          { x: 20, y: -17 },
          { x: 25, y: 0 },
        ],
        true,
      );
      shape.fillStyle(0x304751);
      shape.fillTriangle(-27, -14, 1, -29, 29, -14);
      shape.lineStyle(3, hue);
      shape.lineBetween(-24, 5, 28, 5);
      shape.lineBetween(17, 3, 25, 14);
      shape.fillStyle(0xffce87);
      shape.fillRect(-4, -8, 7, 9);
    } else if (
      family === "worked-stone" ||
      family === "dominion-works" ||
      family === "memory-threshold"
    ) {
      shape.fillRect(-20, -23, 39, 29);
      shape.fillStyle(0x383d59);
      shape.fillRect(-23, -29, 44, 8);
      shape.fillStyle(hue);
      shape.fillRect(10, -38, 8, 16);
      shape.lineStyle(1, 0x304751);
      shape.lineBetween(-18, -12, 18, -12);
      shape.lineBetween(-18, -4, 18, -4);
      shape.fillStyle(0xffb56b);
      shape.fillRect(-6, -7, 10, 13);
    } else if (family === "high-air" || family === "veiled-path") {
      shape.fillRect(-10, -29, 20, 32);
      shape.fillStyle(0x304751);
      shape.fillTriangle(-15, -28, 0, -46, 15, -28);
      shape.lineStyle(2, hue);
      shape.lineBetween(-20, 5, 20, 5);
      shape.lineBetween(-17, 5, -17, -15);
      shape.fillStyle(0xffce87);
      shape.fillCircle(0, -19, 4);
    } else {
      shape.fillPoints(
        [
          { x: -19, y: 1 },
          { x: -19, y: -18 },
          { x: 0, y: -28 },
          { x: 20, y: -18 },
          { x: 20, y: 1 },
        ],
        true,
      );
      shape.fillStyle(family === "elven-house" ? 0x366964 : 0x57493e);
      shape.fillTriangle(-24, -17, 0, -36, 25, -17);
      shape.fillStyle(0xffce87);
      shape.fillRect(-3, -8, 6, 10);
      shape.lineStyle(2, 0xa0804d);
      shape.lineBetween(24, 3, 34, 6);
    }
  }
  private figure(
    shape: Phaser.GameObjects.Graphics,
    kind: string,
    hue: number,
    profile: string,
  ) {
    if (
      kind === "hero" &&
      ["wolf_pack", "spider_brood", "eagle_eyrie", "ent_grove"].includes(
        profile,
      )
    )
      kind = "beast";
    shape.fillStyle(hue);
    if (kind === "vessel" || kind === "wreck") {
      shape.fillPoints(
        [
          { x: -21, y: -3 },
          { x: 20, y: -3 },
          { x: 13, y: 8 },
          { x: -13, y: 8 },
        ],
        true,
      );
      shape.lineStyle(2, 0xe4c398);
      shape.lineBetween(0, 0, 0, -27);
      if (kind === "vessel") {
        shape.fillStyle(0xece0bb);
        shape.fillTriangle(2, -26, 2, -7, 18, -7);
      } else {
        shape.lineBetween(-10, -7, 12, 9);
        shape.lineBetween(12, -7, -10, 9);
      }
      return;
    }
    if (profile === "ent_grove") {
      shape.fillRect(-5, -21, 10, 27);
      shape.lineStyle(3, hue);
      shape.lineBetween(-3, -15, -13, -23);
      shape.lineBetween(3, -14, 13, -26);
      shape.fillStyle(0x789473);
      shape.fillEllipse(0, -24, 28, 18);
      return;
    }
    if (["dragon", "drake", "winged-dragon", "beast"].includes(kind)) {
      shape.fillEllipse(0, -4, kind === "dragon" ? 34 : 24, 12);
      shape.fillTriangle(-12, -4, -23, -10, -17, 0);
      shape.fillCircle(13, -8, 5);
      shape.lineStyle(2, hue);
      for (const x of [-8, 6]) shape.lineBetween(x, -1, x + 2, 8);
      if (kind === "winged-dragon" || profile === "eagle_eyrie") {
        shape.fillTriangle(-3, -5, -28, -23, -14, 0);
        shape.fillTriangle(3, -5, 28, -23, 14, 0);
      }
      if (profile === "spider_brood")
        for (const y of [-10, -4, 2]) {
          shape.lineBetween(-6, y, -20, y + 8);
          shape.lineBetween(6, y, 20, y + 8);
        }
    } else if (kind === "construct" || kind === "balrog") {
      shape.fillRect(-7, -15, 14, 18);
      shape.fillRect(-4, -22, 9, 7);
      shape.lineStyle(3, hue);
      shape.lineBetween(-7, -11, -12, 0);
      shape.lineBetween(7, -11, 12, 0);
      if (kind === "balrog") {
        shape.fillStyle(0xffb56b);
        shape.fillTriangle(-3, -17, 0, -30, 4, -17);
      }
    } else {
      const offsets = kind === "company" ? [-9, 2, 10] : [0];
      for (const offset of offsets) {
        shape.fillStyle(hue);
        shape.fillTriangle(offset - 4, 2, offset, -12, offset + 5, 2);
        shape.fillStyle(0xf2e8d5);
        shape.fillCircle(offset, -13, 2.8);
      }
      if (kind === "hero") {
        shape.lineStyle(2, 0xc6ab72);
        shape.lineBetween(8, 2, 8, -24);
        shape.fillStyle(0xf2e8d5);
        shape.fillTriangle(8, -24, 16, -21, 8, -18);
      }
    }
  }
  /** Bake original painted archetypes or procedural fallback once per variant.
   * Bounded cached markers retain independent ownership/selection glyphs. */
  private markerTexture(
    profile: string,
    kind: string,
    building: boolean,
    friendly: boolean,
    appearance?: string,
  ): string {
    const e = profile ? economy(profile) : undefined;
    const family = profile ? art(profile).family : "dominion-works";
    const variant = [
      "ent_grove",
      "eagle_eyrie",
      "spider_brood",
      "wolf_pack",
    ].includes(profile)
      ? profile
      : family;
    const hue = e?.presentation.palette[2] ?? "#d5c2a0";
    const coarse =
      this.cameras.main.zoom < 0.45 && kind === "company" && !building;
    const painted = building
      ? buildingFrame(profile, family, kind)
      : (appearance ?? figureFrame(profile, coarse ? "worker" : kind));
    const key = `world-marker:${painted ?? variant}:${kind}:${building}:${friendly}:${hue}:${coarse}`;
    if (this.textures.exists(key)) return key;
    const g = this.add.graphics();
    g.translateCanvas(48, 52);
    g.lineStyle(1, 0x101c22);
    g.strokeEllipse(0, 6, 24, 10);
    g.lineStyle(2, 0xf2e8d5, 0.95);
    if (friendly) g.strokeTriangle(-18, 8, -14, 2, -10, 8);
    else g.strokeRect(-17, 3, 6, 6);
    const color = Phaser.Display.Color.HexStringToColor(hue).color;
    const master =
      !building && painted ? directionalMaster(painted, "east") : undefined;
    const atlas =
      master && this.textures.exists(master.texture)
        ? master.texture
        : building
          ? "buildings"
          : painted && COMPANION_FRAMES[painted]
            ? "companion-figures"
            : "world-figures";
    if (painted && this.textures.exists(atlas)) {
      const texture = this.textures.addDynamicTexture(key, 96, 96)!;
      const offsets =
        !building && kind === "company" && !coarse ? [-10, 0, 10] : [0];
      for (const offset of offsets) {
        const picture = this.make
          .image(
            {
              x: 48 + offset,
              y: building ? 58 : 52 + Math.abs(offset) / 5,
              key: atlas,
              frame:
                master && atlas === master.texture ? master.frame : painted,
            },
            false,
          )
          .setOrigin(0.5, 1);
        const height = building
          ? 64
          : kind === "company"
            ? 24
            : kind === "hero"
              ? 34
              : 32;
        picture.setScale(
          Math.min(
            (building ? 74 : 40) / picture.width,
            height / picture.height,
          ),
        );
        texture.draw(picture);
        picture.destroy();
      }
      texture.draw(g);
    } else {
      if (building && kind === "crop-plot") {
        g.lineStyle(3, 0xa8b96b);
        for (let row = -3; row <= 3; row++)
          g.lineBetween(-14, row * 3, 14, row * 3 - 8);
      } else if (building && kind === "irrigation") {
        g.lineStyle(4, 0x86cbd0);
        g.lineBetween(-20, 4, 20, -12);
      } else if (
        building &&
        ["cover", "barricade", "gate", "siege-brace"].includes(kind)
      ) {
        g.lineStyle(4, color);
        g.lineBetween(-20, 0, 20, -10);
        for (const x of [-16, -8, 0, 8, 16])
          g.lineBetween(x, -x / 4, x, -x / 4 - 12);
      } else if (building) this.dwelling(g, family, color);
      else this.figure(g, coarse ? "worker" : kind, color, profile);
      g.generateTexture(key, 96, 96);
    }
    g.destroy();
    this.textureKeys.add(key);
    return key;
  }
  private marker(
    id: string,
    name: string,
    x: number,
    y: number,
    owner: string,
    building = false,
    kind = "company",
  ) {
    let c = this.marks.get(id);
    if (!c) {
      c = this.pool.pop();
      if (c) {
        c.setActive(true).setVisible(true);
        c.setData("fresh", true);
      } else {
        c = this.add.container(0, 0);
        const sprite = this.add.image(0, -4, "__WHITE").setOrigin(0.5);
        c.add(sprite);
        c.setInteractive(
          new Phaser.Geom.Rectangle(-22, -30, 44, 44),
          Phaser.Geom.Rectangle.Contains,
        );
        const marker = c;
        c.on("pointerup", (pointer: Phaser.Input.Pointer) => {
          if (pointer.event?.target === this.game.canvas)
            this.onSelect(marker.getData("entityId") as string);
        });
        c.setData("fresh", true);
      }
      this.marks.set(id, c);
    }
    const p = iso(x, y);
    c.setData("entityId", id);
    const fresh = c.getData("fresh");
    if (c.getData("targetX") !== p.x || c.getData("targetY") !== p.y || fresh) {
      this.tweens.killTweensOf(c);
      if (fresh || building || this.reducedMotion || !this.life?.isWalking(id))
        c.setPosition(p.x, p.y).setDepth(p.y);
      c.setData("targetX", p.x).setData("targetY", p.y).setData("fresh", false);
    }
    const target = markerTargetSize(this.cameras.main.zoom);
    (c.input!.hitArea as Phaser.Geom.Rectangle).setTo(
      -target / 2,
      -target / 2 - 6,
      target,
      target,
    );
    const sprite = c.list[0] as Phaser.GameObjects.Image;
    const selected = id === this.selected;
    c.setDepth(selected ? 10000 : c.y);
    const friendly = owner === this.seat;
    const ownerProfile = this.state!.players[owner]?.profile ?? "";
    sprite.setTexture(
      this.markerTexture(
        ownerProfile,
        kind,
        building,
        friendly,
        this.state?.units[id]?.companion || ["dragon", "drake"].includes(kind)
          ? motionAppearance(
              ownerProfile,
              kind,
              this.state?.units[id]?.companion,
              this.state?.units[id]?.secondary,
            ).frame
          : undefined,
      ),
    );
    c.setData("building", building);
    // Hidden text previously allocated hundreds of separate canvas textures.
    const showLabel = selected || (building && this.cameras.main.zoom > 0.75);
    let label = c.list[1] as Phaser.GameObjects.Text | undefined;
    if (showLabel) {
      if (!label) {
        label = this.add
          .text(0, 18, "", {
            fontFamily: "Noto Sans, sans-serif",
            fontSize: "15px",
            color: "#f2e8d5",
            backgroundColor: "#192a30",
            padding: { x: 6, y: 4 },
          })
          .setOrigin(0.5, 0);
        c.add(label);
      }
      label
        .setText(
          `${friendly ? "◇ Own" : owner === "remnant" ? "△ Uncalled" : "□ Observed"} · ${name}`,
        )
        .setVisible(true)
        .setScale(1 / this.cameras.main.zoom);
    } else if (label) label.setVisible(false);
    return c;
  }
  private refresh() {
    if (!this.state || !this.loaded) return;
    const s = this.state,
      live = new Set<string>();
    for (const f of Object.values(s.facilities)) {
      if (f.hp <= 0 || !visible(s, this.seat, f)) continue;
      this.marker(f.id, f.name, f.x, f.y, f.owner, true, f.kind);
      live.add(f.id);
    }
    for (const u of Object.values(s.units)) {
      if (
        !u.alive ||
        isAboard(s, u.id) ||
        isNavalCrew(s, u.id) ||
        !visible(s, this.seat, u)
      )
        continue;
      this.marker(u.id, u.name, u.x, u.y, u.owner, false, u.kind);
      live.add(u.id);
    }
    for (const v of [
      ...Object.values(s.vessels),
      ...(s.vesselContacts ?? []),
    ]) {
      if (!visible(s, this.seat, v)) continue;
      this.marker(
        v.id,
        v.name,
        v.x,
        v.y,
        v.owner,
        false,
        v.phase === "wreck" ? "wreck" : "vessel",
      );
      live.add(v.id);
    }
    for (const [id, c] of this.marks)
      if (!live.has(id)) {
        this.tweens.killTweensOf(c);
        if (this.pool.length < 128) {
          c.setActive(false).setVisible(false);
          this.pool.push(c);
        } else c.destroy();
        this.marks.delete(id);
      }
    const g = this.labels!;
    g.clear();
    for (const site of Object.values(s.infrastructureSites)) {
      if (!visible(s, this.seat, site) || site.consumed) continue;
      const p = iso(site.x, site.y);
      g.lineStyle(5, 0x101c22);
      g.strokeRect(p.x - 12, p.y - 8, 24, 16);
      g.lineStyle(2, 0xedbe73);
      g.strokeRect(p.x - 12, p.y - 8, 24, 16);
      if (site.blocked) {
        g.lineBetween(p.x - 10, p.y - 7, p.x + 10, p.y + 7);
        g.lineBetween(p.x + 10, p.y - 7, p.x - 10, p.y + 7);
      }
    }
    for (const [key, hazard] of Object.entries(s.seaHazards)) {
      const [x, y] = key.split(",").map(Number);
      if (!visible(s, this.seat, { x, y })) continue;
      const p = iso(x, y);
      g.lineStyle(2, 0xf2e8d5, 0.9);
      if (hazard.wave) {
        g.lineBetween(p.x - 12, p.y, p.x - 4, p.y - 6);
        g.lineBetween(p.x - 4, p.y - 6, p.x + 4, p.y);
        g.lineBetween(p.x + 4, p.y, p.x + 12, p.y - 6);
      }
      if (hazard.fog) {
        g.lineBetween(p.x - 14, p.y - 5, p.x + 14, p.y - 5);
        g.lineBetween(p.x - 10, p.y + 1, p.x + 10, p.y + 1);
      }
    }
    for (const crossing of Object.values(s.crossings)) {
      if (!crossing.tiles.some((p) => visible(s, this.seat, p))) continue;
      const points = crossing.tiles.map((p) => iso(p.x, p.y));
      g.lineStyle(crossing.phase === "ready" ? 10 : 4, 0x101c22, 0.9);
      g.strokePoints(points, false);
      g.lineStyle(crossing.phase === "ready" ? 5 : 2, 0xe4c398, 0.9);
      g.strokePoints(points, false);
      if (crossing.phase === "destroyed")
        for (const p of points) {
          g.lineBetween(p.x - 7, p.y - 7, p.x + 7, p.y + 7);
          g.lineBetween(p.x + 7, p.y - 7, p.x - 7, p.y + 7);
        }
    }
    for (const contact of silhouetteContacts(s, this.seat)) {
      const p = iso(contact.x, contact.y);
      g.lineStyle(5, 0x101c22, 0.9);
      g.strokeEllipse(p.x, p.y - 8, 20, 28);
      g.lineStyle(2, 0xf2e8d5, 0.9);
      g.strokeEllipse(p.x, p.y - 8, 20, 28);
      g.lineBetween(p.x - 4, p.y + 11, p.x + 4, p.y + 11);
    }
    for (const zone of displayedZones(s, this.seat)) {
      const points = zoneOutline(zone),
        p = iso(zone.x, zone.y);
      g.lineStyle(5, 0x101c22, 0.85);
      g.strokePoints(points, true);
      g.lineStyle(2, 0xf2e8d5, 0.9);
      g.strokePoints(points, true);
      // Distinct original line symbols retain meaning without relying on hue.
      if (zone.kind === "web") {
        for (const offset of [-8, 0, 8]) {
          g.lineBetween(p.x - 14, p.y + offset, p.x + 14, p.y + offset);
          g.lineBetween(p.x + offset, p.y - 14, p.x + offset, p.y + 14);
        }
      } else if (zone.kind === "threshold") {
        g.strokeRect(p.x - 12, p.y - 16, 24, 24);
        g.lineBetween(p.x - 18, p.y + 8, p.x + 18, p.y + 8);
      } else if (zone.kind === "flare") {
        g.strokeTriangle(p.x, p.y - 20, p.x - 12, p.y + 7, p.x + 12, p.y + 7);
        g.lineBetween(p.x, p.y - 10, p.x, p.y + 2);
      } else {
        g.lineBetween(p.x, p.y - 12, p.x, p.y + 14);
        for (const side of [-1, 1]) {
          g.lineBetween(p.x, p.y, p.x + side * 14, p.y - 9);
          g.lineBetween(p.x, p.y + 6, p.x + side * 10, p.y + 14);
        }
        if (zone.kind === "bloomscreen") g.strokeCircle(p.x, p.y - 16, 5);
      }
    }
    for (const site of s.sites) {
      const p = iso(site.x, site.y);
      g.lineStyle(6, 0x101c22);
      g.strokeEllipse(p.x, p.y, 65, 30);
      g.lineStyle(3, 0xf2e8d5);
      g.strokeEllipse(p.x, p.y, 65, 30);
    }
    for (const w of s.warnings) {
      const p = iso(w.x, w.y);
      g.lineStyle(5, 0x101c22);
      g.strokeTriangle(p.x, p.y - 40, p.x - 45, p.y + 20, p.x + 45, p.y + 20);
      g.lineStyle(2, 0xffb4a4);
      g.strokeTriangle(p.x, p.y - 40, p.x - 45, p.y + 20, p.x + 45, p.y + 20);
    }
  }
  locate(id: string) {
    const s = this.state;
    if (!s || !this.loaded) return;
    const target =
      s.units[id] ??
      s.facilities[id] ??
      s.vessels[id] ??
      s.vesselContacts?.find((v) => v.id === id) ??
      s.infrastructureSites[id] ??
      s.sites.find((t) => t.id === id);
    if (target) {
      const p = iso(target.x, target.y);
      this.cameras.main.centerOn(p.x, p.y);
    }
  }
  zoom(delta: number) {
    if (this.loaded) {
      this.cameras.main.setZoom(
        Phaser.Math.Clamp(this.cameras.main.zoom + delta, 0.25, 1.6),
      );
      this.refresh();
    }
  }
  update(_time: number, delta: number) {
    if (!this.loaded) return;
    this.life?.update(delta, this.marks, this.selected);
    const c = this.cameras.main;
    if (this.keys && !isEditingTarget(document.activeElement)) {
      const speed = (Math.min(delta, 50) * 0.48) / c.zoom;
      if (this.keys.left.isDown) c.scrollX -= speed;
      if (this.keys.right.isDown) c.scrollX += speed;
      if (this.keys.up.isDown) c.scrollY -= speed;
      if (this.keys.down.isDown) c.scrollY += speed;
    }
    const view = c.worldView;
    const visibleChunks = new Set(
      this.chunks.filter((chunk) =>
        Phaser.Geom.Intersects.RectangleToRectangle(view, chunk.bounds),
      ),
    );
    let cached = this.chunks.filter((chunk) => chunk.image).length;
    for (const chunk of this.chunks) {
      const inView = visibleChunks.has(chunk);
      if (inView && !chunk.image && !chunk.failed) {
        if (cached >= TERRAIN_CACHE_LIMIT) {
          const old = this.chunks.find(
            (candidate) => candidate.image && !visibleChunks.has(candidate),
          );
          if (old) {
            old.image!.destroy();
            this.textures.remove(old.texture!);
            old.image = undefined;
            old.texture = undefined;
            cached--;
          }
        }
        if (cached < TERRAIN_CACHE_LIMIT) {
          const key = `terrain:${this.terrainSerial++}`;
          try {
            chunk.graphics.generateTexture(
              key,
              chunk.bounds.width,
              chunk.bounds.height,
            );
            if (!this.textures.exists(key))
              throw new Error("Terrain texture unavailable");
            if (!this.rulesTerrain && this.textures.exists("basin-materials")) {
              const texture = this.textures.get(key);
              const canvas = texture.getSourceImage() as HTMLCanvasElement;
              const context = canvas.getContext("2d");
              if (context) {
                // Source-specific material crops of our original painting. None
                // contains an authored settlement, bridge or crossing. Painting
                // is clipped to rules masks; it cannot introduce another river.
                const crops: Record<
                  string,
                  [number, number, number, number][]
                > = {
                  meadow: [
                    [24, 24, 220, 220],
                    [260, 30, 220, 220],
                    [120, 270, 220, 220],
                  ],
                  woodland: [
                    [536, 24, 220, 220],
                    [772, 30, 220, 220],
                    [632, 270, 220, 220],
                  ],
                  water: [
                    [1048, 24, 220, 220],
                    [1284, 30, 220, 220],
                    [1144, 270, 220, 220],
                  ],
                  stone: [
                    [24, 536, 220, 220],
                    [260, 542, 220, 220],
                    [120, 782, 220, 220],
                  ],
                  cliff: [
                    [536, 536, 220, 220],
                    [772, 542, 220, 220],
                    [632, 782, 220, 220],
                  ],
                };
                const source = this.textures
                  .get("basin-materials")
                  .getSourceImage() as HTMLImageElement;
                const patterns: Record<string, CanvasPattern> = {};
                for (const [kind, palette] of Object.entries(crops)) {
                  let sample = this.materialPaint.get(kind);
                  if (!sample) {
                    sample = document.createElement("canvas");
                    sample.width = 512;
                    sample.height = 512;
                    const brush = sample.getContext("2d")!;
                    brush.fillStyle = `#${terrainPaint(kind, 0, 0).base.toString(16).padStart(6, "0")}`;
                    brush.fillRect(0, 0, 512, 512);
                    const patch = document.createElement("canvas");
                    patch.width = 192;
                    patch.height = 192;
                    const ink = patch.getContext("2d")!;
                    // Irregular overlapping same-material paint, wrapped at edges.
                    // No mirrored rows, material swaps, semantic rivers or buildings.
                    for (let i = 0; i < 70; i++) {
                      const seed =
                        (i * 2654435761 + kind.length * 1013904223) >>> 0;
                      const crop = palette[i % palette.length],
                        size = 125 + (seed % 90);
                      ink.clearRect(0, 0, 192, 192);
                      ink.globalCompositeOperation = "source-over";
                      ink.drawImage(source, ...crop, 0, 0, 192, 192);
                      ink.globalCompositeOperation = "destination-in";
                      const fade = ink.createRadialGradient(
                        96,
                        96,
                        22,
                        96,
                        96,
                        96,
                      );
                      fade.addColorStop(0, "#fff");
                      fade.addColorStop(0.55, "rgba(255,255,255,.9)");
                      fade.addColorStop(1, "rgba(255,255,255,0)");
                      ink.fillStyle = fade;
                      ink.fillRect(0, 0, 192, 192);
                      const px = seed % 512,
                        py = ((seed >>> 9) + i * 137) % 512;
                      for (const dx of [-512, 0, 512])
                        for (const dy of [-512, 0, 512])
                          brush.drawImage(
                            patch,
                            px + dx - size / 2,
                            py + dy - size / 2,
                            size,
                            size,
                          );
                    }
                    this.materialPaint.set(kind, sample);
                  }
                  const pattern = context.createPattern(sample, "repeat");
                  if (pattern) patterns[kind] = pattern;
                }
                context.save();
                context.globalCompositeOperation = "destination-over";
                for (const cell of chunk.cells) {
                  const pattern = patterns[cell.terrain];
                  if (!pattern) continue;
                  const world = iso(cell.x, cell.y),
                    x = world.x - chunk.bounds.x,
                    y = world.y - chunk.bounds.y;
                  context.save();
                  context.beginPath();
                  context.moveTo(x, y - TILE_Y - 0.5);
                  context.lineTo(x + TILE_X + 0.5, y);
                  context.lineTo(x, y + TILE_Y + 0.5);
                  context.lineTo(x - TILE_X - 0.5, y);
                  context.closePath();
                  context.clip();
                  context.fillStyle = pattern;
                  context.translate(-chunk.bounds.x, -chunk.bounds.y);
                  context.fillRect(
                    world.x - TILE_X,
                    world.y - TILE_Y,
                    TILE_X * 2,
                    TILE_Y * 2,
                  );
                  context.restore();
                }
                context.restore();
                if ("refresh" in texture)
                  (texture as Phaser.Textures.CanvasTexture).refresh();
              }
            }
            chunk.image = this.add
              .image(chunk.bounds.x, chunk.bounds.y, key)
              .setOrigin(0)
              .setDepth(-5);
            chunk.texture = key;
            cached++;
          } catch {
            if (this.textures.exists(key)) this.textures.remove(key);
            chunk.failed = true; // Visible Graphics remain the allocation-failure fallback.
          }
        }
      }
      chunk.graphics.setVisible(inView && !chunk.image);
      chunk.image?.setVisible(inView);
    }
    const selected = this.marks.get(this.selected);
    const outline = this.selection!;
    outline.clear();
    if (selected?.visible) {
      outline.lineStyle(3 / c.zoom, 0xedbe73);
      outline.strokeEllipse(selected.x, selected.y + 6, 46, 20);
    }
    for (const mark of this.marks.values()) {
      mark.setVisible(
        mark.x >= view.x - 100 &&
          mark.x <= view.right + 100 &&
          mark.y >= view.y - 100 &&
          mark.y <= view.bottom + 100,
      );
    }
  }
}
/** Software WebGL forces a framebuffer readback into the browser compositor.
 * Canvas draws the identical scene directly; real/unknown GPUs retain AUTO. */
export function rendererPreference(renderer: string): "canvas" | "auto" {
  return /swiftshader|llvmpipe|softpipe|software rasterizer|microsoft basic render driver/i.test(
    renderer,
  )
    ? "canvas"
    : "auto";
}
export function detectWorldRenderer(
  createCanvas: () => HTMLCanvasElement = () =>
    document.createElement("canvas"),
): "canvas" | "auto" {
  const canvas = createCanvas();
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return "auto";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    return info
      ? rendererPreference(
          String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)),
        )
      : "auto";
  } catch {
    return "auto";
  } finally {
    try {
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      /* Probe cleanup is best effort on a lost browser context. */
    }
    canvas.width = 0;
    canvas.height = 0;
  }
}
let worldRendererPreference: "canvas" | "auto" | undefined;
export function bootWorld(
  select: (id: string) => void,
  tile: (p: Pos) => void,
) {
  const scene = new World(select, tile);
  const game = new Phaser.Game({
    type:
      (worldRendererPreference ??= detectWorldRenderer()) === "canvas"
        ? Phaser.CANVAS
        : Phaser.AUTO,
    parent: "world",
    backgroundColor: "#203d45",
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    scene,
    // Baked Canvas silhouettes retain smooth edges without multisampling the
    // entire translucent landscape framebuffer on software WebGL renderers.
    render: {
      antialias: true,
      antialiasGL: false,
      powerPreference: "low-power",
    },
    fps: { target: 60, forceSetTimeOut: false },
    audio: { noAudio: true },
  });
  return { game, scene };
}

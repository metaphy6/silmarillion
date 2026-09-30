import { LivingWorld } from "./living-world";
import { buildingFrame, figureFrame } from "./building-art";
import { isAboard, isNavalCrew } from "../simulation/naval";
import Phaser from "phaser";
import type { Match, Pos } from "../simulation/types";
import type { Zone } from "../simulation/zones";
import { visible, silhouetteContacts } from "../simulation/engine";
import { art, economy } from "../content/catalog";
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
export const RULES_TERRAIN_LEGEND = "Rules terrain: Meadow = three grass strokes; Woodland = tree triangle; Water = parallel waves; Stone = square; Cliff = double chevrons; Unknown = cross. Tile type alone does not promise a clear route.";
export function rulesTerrainStyle(terrain:string):{fill:number;symbol:string}{
 switch(terrain){case'meadow':return{fill:0x304e42,symbol:'grass'};case'woodland':return{fill:0x163f3b,symbol:'tree'};case'water':return{fill:0x284d60,symbol:'waves'};case'stone':return{fill:0x454955,symbol:'square'};case'cliff':return{fill:0x302e40,symbol:'chevrons'};default:return{fill:0x192a30,symbol:'unknown'};}
}
function drawRuleMark(g:Phaser.GameObjects.Graphics,p:Pos,symbol:string):void{
 g.lineStyle(3,0xf2e8d5,1);
 if(symbol==='grass'){for(const dx of [-12,0,12])g.lineBetween(p.x+dx-3,p.y+8,p.x+dx+3,p.y-8);}
 else if(symbol==='tree'){g.strokeTriangle(p.x,p.y-13,p.x-15,p.y+8,p.x+15,p.y+8);g.lineBetween(p.x,p.y+8,p.x,p.y+14);}
 else if(symbol==='waves'){for(const dy of [-7,5])g.strokePoints([{x:p.x-20,y:p.y+dy},{x:p.x-10,y:p.y+dy-4},{x:p.x,y:p.y+dy},{x:p.x+10,y:p.y+dy-4},{x:p.x+20,y:p.y+dy}],false);}
 else if(symbol==='square')g.strokeRect(p.x-11,p.y-10,22,20);
 else if(symbol==='chevrons'){for(const dy of [-7,7])g.strokePoints([{x:p.x-17,y:p.y+dy+5},{x:p.x,y:p.y+dy-5},{x:p.x+17,y:p.y+dy+5}],false);}
 else{g.lineBetween(p.x-9,p.y-9,p.x+9,p.y+9);g.lineBetween(p.x-9,p.y+9,p.x+9,p.y-9);}
}
type Chunk = {
  image?: Phaser.GameObjects.Image;
  texture?: string;
  failed?: boolean;
  graphics: Phaser.GameObjects.Graphics;
  bounds: Phaser.Geom.Rectangle;
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
  private labels?: Phaser.GameObjects.Graphics;
  private keys?: Phaser.Types.Input.Keyboard.CursorKeys;
  private loaded = false;
  private backdrop?: Phaser.GameObjects.Image;
  private onSelect: (id: string) => void;
  private onTile: (p: Pos) => void;
  constructor(select: (id: string) => void, tile: (p: Pos) => void) {
    super("world");
    this.onSelect = select;
    this.onTile = tile;
  }
  preload() {
    this.load.image(
      "basin",
      `${import.meta.env.BASE_URL}assets/sm-environment-cross-era-basin-v1.png`,
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
    this.cameras.main.setBackgroundColor("#203d45");
    if (this.textures.exists("basin")) {
      this.backdrop = this.add
        .image(0, 1000, "basin")
        .setDisplaySize(4400, 2600)
        .setDepth(-10);
    }
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
  getMotionMode() { return this.motionMode; }
  setMotionMode(mode: "system" | "reduced") {
    this.motionMode = mode;
    this.reducedMotion = mode === "reduced" || !!this.motionQuery?.matches;
    this.life?.setEnabled(!this.reducedMotion);
  }
  motionStats() { return this.life?.stats(); }
  getRulesTerrain():boolean { return this.rulesTerrain; }
  setRulesTerrain(enabled:boolean):void {
    if(this.rulesTerrain===enabled)return;
    this.rulesTerrain=enabled;
    if(this.loaded){this.drawTerrain();this.refresh();}
  }
  setState(s: Match, seat: string, selected: string) {
    const stamp = `${s.map.width}:${s.map.height}:${s.map.terrain.join(",")}`;
    const changed = this.state?.id !== s.id || this.terrainStamp !== stamp;
    this.terrainStamp=stamp;
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
        this.chunks.push({ graphics: g, bounds });
        for (let y = cy; y < cy + height; y++)
          for (let x = cx; x < cx + width; x++) {
            const world = iso(x, y),
              p = { x: world.x - bounds.x, y: world.y - bounds.y },
              terrain = s.map.terrain[y * s.map.width + x];
            const col =
              terrain === "water"
                ? 0x84b5ba
                : terrain === "woodland"
                  ? 0x366964
                  : terrain === "stone"
                    ? 0x8c9ca9
                    : 0x5f806d;
            const rule = rulesTerrainStyle(terrain);
            g.fillStyle(this.rulesTerrain ? rule.fill : col, this.rulesTerrain ? 1 : this.backdrop ? 0.13 : 0.72);
            g.fillPoints(
              [
                { x: p.x, y: p.y - TILE_Y },
                { x: p.x + TILE_X, y: p.y },
                { x: p.x, y: p.y + TILE_Y },
                { x: p.x - TILE_X, y: p.y },
              ],
              true,
            );
            if(this.rulesTerrain){
              g.lineStyle(1,0x7e9699,0.85);
              g.strokePoints([{x:p.x,y:p.y-TILE_Y},{x:p.x+TILE_X,y:p.y},{x:p.x,y:p.y+TILE_Y},{x:p.x-TILE_X,y:p.y}],true);
              drawRuleMark(g,p,rule.symbol);
              continue;
            }
            if (terrain === "water") {
              g.lineStyle(2, 0xb1d6d3, 0.55);
              g.lineBetween(p.x - 23, p.y + 3, p.x + 16, p.y + 7);
              g.lineStyle(1, 0x96c4d0, 0.4);
              g.lineBetween(p.x - 12, p.y - 6, p.x + 25, p.y - 2);
            }
            if (terrain === "woodland" && !this.backdrop) {
              g.fillStyle(0x284f4c, 0.9);
              g.fillTriangle(
                p.x,
                p.y - 45,
                p.x - 22,
                p.y + 6,
                p.x + 24,
                p.y + 5,
              );
              g.fillStyle(0x648b76, 0.65);
              g.fillTriangle(
                p.x - 5,
                p.y - 40,
                p.x - 20,
                p.y + 2,
                p.x + 3,
                p.y - 6,
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
      : figureFrame(profile, coarse ? "worker" : kind);
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
    const atlas = building ? "buildings" : "world-figures";
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
              frame: painted,
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
      this.markerTexture(ownerProfile, kind, building, friendly),
    );
    c.setData("building", building);
    // Hidden text previously allocated hundreds of separate canvas textures.
    const showLabel = selected || (building && this.cameras.main.zoom > 0.75);
    let label = c.list[1] as Phaser.GameObjects.Text | undefined;
    if (showLabel) {
      if (!label) {
        label = this.add
          .text(0, 18, "", {
            fontFamily: "Arial",
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
export function bootWorld(
  select: (id: string) => void,
  tile: (p: Pos) => void,
) {
  const scene = new World(select, tile);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
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

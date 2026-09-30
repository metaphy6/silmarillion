import { figureFrame } from "./building-art";
/** Original painted directional masters and authored articulated miniatures.
 * Fixed contact pivot and bounded atlases; no simulation clock or hidden state.
 * Separately painted direction masters feed authored mesh action phases.
 */
export const FIGURE_FAMILIES = [
  "high-air",
  "river-sea",
  "living-refuge",
  "memory-threshold",
  "elven-house",
  "worked-stone",
  "mortal-works",
  "path-and-pursuit",
  "commons",
  "veiled-path",
  "dominion-works",
  "embodied-wild",
  "wolf",
  "spider",
  "eagle",
  "ent",
  "troll",
  "dragon",
  "winged-dragon",
  "balrog",
  "construct",
  "rider",
] as const;
export type FigureFamily = (typeof FIGURE_FAMILIES)[number];
export type FigureAction = "walk" | "work" | "attack";
export type FigureDirection = "north" | "east" | "south" | "west";
type Point = { x: number; y: number };
export type FigurePart = {
  role: string;
  points: Point[];
  color: string;
  width?: number;
};
export const MOTION_ATLAS = {
  width: 512,
  height: 384,
  framesPerFamily: 48,
  maxFamilies: FIGURE_FAMILIES.length,
  maxBytes: 512 * 384 * 4 * FIGURE_FAMILIES.length,
};
const directions: FigureDirection[] = ["north", "east", "south", "west"];
const actions: FigureAction[] = ["walk", "work", "attack"];
export function directionFor(from: Point, to: Point): FigureDirection {
  // Match the four isometric movement axes, not screen-axis ties (which
  // previously made every orthogonal route select only east/west).
  const x = to.x - from.x, y = to.y - from.y;
  return Math.abs(x) >= Math.abs(y)
    ? x < 0
      ? "west"
      : "east"
    : y < 0
      ? "north"
      : "south";
}
export function motionFamily(
  profile: string,
  kind: string,
  family: string,
): FigureFamily {
  if (["dragon", "drake"].includes(kind)) return "dragon";
  if (kind === "winged-dragon") return "winged-dragon";
  if (kind === "balrog" || kind === "construct") return kind;
  const species: Record<string, FigureFamily> = {
    wolf_pack: "wolf",
    spider_brood: "spider",
    eagle_eyrie: "eagle",
    ent_grove: "ent",
    troll_hold: "troll",
  };
  if (species[profile]) return species[profile];
  if (profile === "human_rohan" && kind !== "worker") return "rider";
  return FIGURE_FAMILIES.includes(family as FigureFamily)
    ? (family as FigureFamily)
    : "mortal-works";
}
const palettes: Record<FigureFamily, [string, string, string]> = {
  "high-air": ["#8b9ca5", "#d2d8c4", "#383d59"],
  "river-sea": ["#527a88", "#c5d0bb", "#303b63"],
  "living-refuge": ["#467967", "#b9c3a5", "#214b48"],
  "memory-threshold": ["#71647c", "#c6bbb4", "#383d59"],
  "elven-house": ["#5b8274", "#d7d9be", "#304751"],
  "worked-stone": ["#6f7982", "#c1ad86", "#323338"],
  "mortal-works": ["#63747c", "#ccb693", "#303b48"],
  "path-and-pursuit": ["#677852", "#c3b087", "#334940"],
  commons: ["#987b50", "#d1b984", "#57493e"],
  "veiled-path": ["#737c9b", "#b6c6cc", "#303b63"],
  "dominion-works": ["#67565c", "#ba8859", "#2c283a"],
  "embodied-wild": ["#727b59", "#b6ab81", "#394332"],
  wolf: ["#92978e", "#c6c3b1", "#45494d"],
  spider: ["#51454f", "#b88c54", "#292b3a"],
  eagle: ["#876548", "#d2b485", "#3d3e4b"],
  ent: ["#65734a", "#b0ae77", "#57493e"],
  troll: ["#737b79", "#a4ac96", "#424851"],
  dragon: ["#856455", "#c7a070", "#423544"],
  "winged-dragon": ["#9a6c4c", "#d6a56e", "#4f3745"],
  balrog: ["#554347", "#e3a16b", "#272733"],
  construct: ["#8b8e83", "#d1bc86", "#3f464c"],
  rider: ["#87694f", "#b8a277", "#394b42"],
};
export function figurePose(
  family: FigureFamily,
  action: FigureAction,
  direction: FigureDirection,
  frame: number,
) {
  const [body, light, dark] = palettes[family],
    phase = [-1, -0.25, 1, 0.25][((frame % 4) + 4) % 4];
  const stride = action === "walk" ? phase * 4 : phase,
    reach =
      action === "attack"
        ? 6 + phase * 5
        : action === "work"
          ? phase * 4
          : phase * 2;
  const parts: FigurePart[] = [];
  const point = (x: number, y: number): Point => ({
    x:
      32 +
      (direction === "west"
        ? -x
        : direction === "north"
          ? x * 0.65 - y * 0.13
          : direction === "south"
            ? x * 0.75 + y * 0.08
            : x),
    y: 54 + y,
  });
  const poly = (role: string, color: string, points: number[][]) =>
    parts.push({ role, color, points: points.map(([x, y]) => point(x, y)) });
  const line = (
    role: string,
    color: string,
    width: number,
    points: number[][],
  ) =>
    parts.push({
      role,
      color,
      width,
      points: points.map(([x, y]) => point(x, y)),
    });
  const oval = (
    role: string,
    color: string,
    x: number,
    y: number,
    rx: number,
    ry: number,
  ) =>
    poly(
      role,
      color,
      Array.from({ length: 12 }, (_, i) => [
        x + Math.cos((i * Math.PI) / 6) * rx,
        y + Math.sin((i * Math.PI) / 6) * ry,
      ]),
    );
  const quad = ["wolf", "dragon", "winged-dragon", "rider"].includes(family);
  if (family === "spider") {
    for (let side = -1; side <= 1; side += 2)
      for (let i = 0; i < 4; i++) {
        const step = i % 2 ? stride : -stride;
        line("leg", i < 2 ? dark : body, 2, [
          [side * 5, -14 + i * 2],
          [side * (15 + i), -21 + i * 5 + step],
          [side * (20 + i), -3 + i + step * 0.3],
        ]);
      }
    oval("abdomen", body, -5, -17, 10, 8);
    oval("thorax", light, 7, -16, 6, 5);
    line("mandible", light, 2, [
      [10, -16],
      [15 + reach * 0.25, -12],
      [14, -8],
    ]);
  } else if (family === "eagle") {
    const flap = action === "work" ? phase * 3 : phase * 8;
    poly("wing", dark, [
      [-3, -22],
      [-25, -28 - flap],
      [-21, -15],
      [-5, -12],
    ]);
    poly("wing", body, [
      [3, -22],
      [25, -28 - flap],
      [21, -15],
      [5, -12],
    ]);
    oval("body", body, 0, -20, 6, 12);
    oval("head", light, 5 + reach * 0.2, -32, 5, 5);
    poly("beak", "#c4a163", [
      [8 + reach * 0.2, -33],
      [14 + reach * 0.2, -30],
      [8 + reach * 0.2, -29],
    ]);
    for (const x of [-3, 3])
      line("leg", light, 1.5, [
        [x, -10],
        [x + stride * 0.25, -4],
        [x + 3, -3],
      ]);
    poly("tail", dark, [
      [-4, -10],
      [0, -2],
      [5, -11],
    ]);
  } else if (quad) {
    for (let i = 0; i < 4; i++) {
      const x = i < 2 ? -10 : 10,
        step = i % 2 ? stride : -stride;
      line("leg", i % 2 ? body : dark, 3, [
        [x, -13],
        [x + step, -7],
        [x - step * 0.5, 0],
      ]);
    }
    oval("body", body, -2, -18, 17, 8);
    const head = family === "wolf" ? 15 : 18;
    line("neck", body, 7, [
      [10, -18],
      [head, -25 - reach * 0.3],
    ]);
    oval("head", light, head, -26 - reach * 0.3, 5, 4);
    poly("muzzle", body, [
      [head + 2, -27 - reach * 0.3],
      [head + 8, -25 - reach * 0.3],
      [head + 3, -22 - reach * 0.3],
    ]);
    line("tail", dark, 3, [
      [-16, -18],
      [-24, -14 + stride * 0.3],
      [-27, -21 + stride * 0.3],
    ]);
    if (family === "wolf")
      poly("ear", dark, [
        [14, -29],
        [14, -36],
        [18, -30],
      ]);
    if (family === "winged-dragon")
      for (const side of [-1, 1])
        poly("wing", side < 0 ? dark : light, [
          [0, -23],
          [side * 22, -38 - phase * 5],
          [side * 14, -22],
          [side * 5, -16],
        ]);
    if (family === "rider") {
      poly("rider-cloak", "#49604f", [
        [-7, -21],
        [-6, -38],
        [2, -36],
        [5, -20],
      ]);
      oval("rider-head", light, -2, -42, 4, 4);
      line("rider-arm", light, 2, [
        [0, -34],
        [7 + reach, -28],
        [14 + reach * 0.3, -27],
      ]);
    }
  } else {
    const broad = ["troll", "construct", "balrog", "worked-stone"].includes(
        family,
      ),
      tree = family === "ent";
    for (const side of [-1, 1]) {
      const step = side * stride;
      line("leg", dark, broad ? 5 : 3, [
        [side * 4, -18],
        [side * 5 + step, -8],
        [side * 5 - step, 0],
      ]);
      line("foot", body, broad ? 4 : 2.5, [
        [side * 5 - step, 0],
        [side * 5 - step + 4, 0],
      ]);
    }
    poly("body", body, [
      [-(broad ? 10 : 7), -33],
      [broad ? 10 : 7, -33],
      [8, -16],
      [-8, -16],
    ]);
    poly("coat-shadow", dark, [
      [-7, -31],
      [-1, -29],
      [4, -15],
      [-9, -15],
    ]);
    oval(
      "head",
      direction === "north" ? body : light,
      0,
      -39,
      broad ? 6 : 4.5,
      broad ? 5 : 5.5,
    );
    for (const side of [-1, 1]) {
      const handX = side * (12 + (side > 0 ? reach : 0)),
        handY = -20 + (side > 0 ? -reach : stride);
      line("arm", body, broad ? 5 : 3, [
        [side * 7, -31],
        [side * 10, -24],
        [handX, handY],
      ]);
      oval("hand", light, handX, handY, 2, 2);
      if (tree)
        line("branch", light, 1.5, [
          [side * 8, -30],
          [side * 17, -37 + phase],
          [side * 20, -34],
        ]);
    }
    if (tree) {
      for (const [x, y] of [
        [-8, -38],
        [5, -44],
        [10, -35],
      ])
        oval("leaves", "#82915b", x, y, 6, 4);
    } else if (family === "balrog") {
      poly("ember", light, [
        [-4, -30],
        [0, -42 - phase],
        [4, -28],
        [0, -20],
      ]);
    } else if (action !== "walk")
      line("tool", light, 2, [
        [12 + reach, -20 - reach],
        [16 + reach, -32 - reach * 0.3],
      ]);
    if (direction !== "north")
      oval("face", dark, direction === "west" ? -2 : 2, -40, 1, 1);
  }
  return {
    anchor: { x: 32, y: 54 },
    parts,
    family,
    action,
    direction,
    frame: ((frame % 4) + 4) % 4,
  };
}
export function motionFrame(
  action: FigureAction,
  direction: FigureDirection,
  frame: number,
) {
  return (
    actions.indexOf(action) * 16 +
    directions.indexOf(direction) * 4 +
    (((frame % 4) + 4) % 4)
  );
}
/** Draw a whole family strip together to preserve shared pivot, scale and palette. */
export function paintMotionAtlas(
  context: CanvasRenderingContext2D,
  family: FigureFamily,
  painted?: PaintedFigure,
) {
  if (painted) {
    paintArticulatedAtlas(context, family, painted);
    return;
  }
  for (const action of actions)
    for (const direction of directions)
      for (let frame = 0; frame < 4; frame++) {
        const index = motionFrame(action, direction, frame),
          pose = figurePose(family, action, direction, frame);
        context.save();
        context.translate((index % 8) * 64, Math.floor(index / 8) * 64);
        context.lineJoin = "round";
        context.lineCap = "round";
        for (const part of pose.parts) {
          context.beginPath();
          part.points.forEach((p, i) =>
            i ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y),
          );
          if (part.width) {
            context.strokeStyle = part.color;
            context.lineWidth = part.width;
            context.stroke();
          } else {
            context.closePath();
            const shade = context.createLinearGradient(12, 10, 45, 55);
            shade.addColorStop(0, part.color);
            shade.addColorStop(1, palettes[family][2]);
            context.fillStyle = shade;
            context.fill();
          }
        }
        context.restore();
      }
}

/** Runtime derivatives of the shipped original painting, not new generated art.
 * Mesh joints move independently; body/face pixels and material identity remain.
 * Direction-specific source paintings supply real reverse anatomy; the mesh
 * animates within each view without mirroring the independently painted master. */
export interface PaintedFigure {
  image: CanvasImageSource;
  x: number;
  y: number;
  width: number;
  height: number;
  archetype: string;
  directions?: Partial<
    Record<FigureDirection, Omit<PaintedFigure, "directions">>
  >;
}
export function motionAppearance(
  profile: string,
  kind: string,
  companion?: string,
  secondary?: string,
) {
  const companions: Record<string, { family: FigureFamily; frame: string }> = {
    "pack-aurochs": { family: "wolf", frame: "aurochs" },
    "courier-stag": { family: "wolf", frame: "stag" },
    "rescue-hind": { family: "wolf", frame: "hind" },
    "songbird-swarm": { family: "eagle", frame: "songbirds" },
    "moth-clouds": { family: "eagle", frame: "moths" },
    "courier-eagle": { family: "eagle", frame: "eagle" },
    "root-guardian": { family: "ent", frame: "ent" },
    "hunting-hounds": { family: "wolf", frame: "wolf" },
  };
  const override = companion ? companions[companion] : undefined;
  const material = motionFamily(profile, kind, "mortal-works");
  return (
    override ?? {
      family: material,
      frame:
        figureFrame(profile, kind) ??
        (material === "dragon" ? "ground-dragon" : "infantry"),
      secondary,
    }
  );
}
/** Newly painted four-view masters. Each row is one consistent original identity. */
export const DIRECTIONAL_SHEETS = [
  {
    key: "direction-a",
    archetypes: [
      "porter",
      "infantry",
      "rider",
      "elven-archer",
      "dwarf-engineer",
      "orc-guard",
    ],
  },
  {
    key: "direction-b",
    archetypes: ["wizard", "herald", "troll", "wolf", "spider", "ent"],
  },
  {
    key: "direction-c",
    archetypes: [
      "eagle",
      "winged-dragon",
      "ember-creature",
      "construct",
      "ground-dragon",
    ],
  },
  {
    key: "direction-d",
    archetypes: ["aurochs", "stag", "hind", "songbirds", "moths"],
  },
] as const;
export function directionalMaster(
  archetype: string,
  direction: FigureDirection,
) {
  const sheet = DIRECTIONAL_SHEETS.find((s) =>
    (s.archetypes as readonly string[]).includes(archetype),
  );
  return sheet
    ? { texture: sheet.key, frame: `${archetype}:${direction}` }
    : undefined;
}
export function paintedJoint(
  archetype: string,
  action: FigureAction,
  direction: FigureDirection,
  frame: number,
  x: number,
  y: number,
): Point {
  const phase = [-1, -0.25, 1, 0.25][((frame % 4) + 4) % 4],
    side = x < 0.5 ? -1 : 1;
  const leg = Math.max(0, (y - 0.6) / 0.4),
    arm =
      Math.max(0, 1 - Math.abs(y - 0.52) / 0.3) *
      Math.max(0, (Math.abs(x - 0.5) - 0.12) / 0.38);
  const bird = ["eagle", "winged-dragon", "songbirds", "moths"].includes(
      archetype,
    ),
    quad = [
      "wolf",
      "rider",
      "winged-dragon",
      "ground-dragon",
      "aurochs",
      "stag",
      "hind",
    ].includes(archetype),
    spider = archetype === "spider";
  let dx = 0,
    dy = 0;
  if (bird) {
    const wing = Math.max(0, 1 - y / 0.78) * Math.abs(x - 0.5) * 2;
    dy += phase * wing * (action === "work" ? 0.035 : 0.115);
    dx += phase * wing * side * 0.018;
  }
  if (action === "walk") {
    dx += side * phase * leg * (quad ? 0.036 : 0.05);
    dy -= Math.max(0, side * phase) * leg * 0.018;
    dx += phase * arm * 0.012;
  } else {
    const exertion = action === "attack" ? 0.072 : 0.042;
    dx += phase * arm * side * exertion;
    dy -= phase * arm * exertion;
    dx += phase * leg * 0.009;
  }
  if (spider) {
    dy += phase * side * Math.max(0, Math.abs(x - 0.5) - 0.2) * 0.12;
    dx += phase * arm * side * 0.025;
  }
  let px = x + dx,
    py = y + dy;
  if (direction === "west") px = 1 - px;
  if (direction === "north") {
    px = 0.5 + (px - 0.5) * 0.82 - (1 - y) * 0.045;
    py += 0.012 * (1 - y);
  }
  if (direction === "south") {
    px = 0.5 + (px - 0.5) * 0.92 + (1 - y) * 0.035;
    py -= 0.008 * (1 - y);
  }
  return { x: px, y: py };
}
function paintArticulatedAtlas(
  context: CanvasRenderingContext2D,
  family: FigureFamily,
  original: PaintedFigure,
) {
  // Shared eight-by-eight source topology keeps joints, contact scale and paint
  // consistent over every action. Each triangle maps original painted pixels.
  const cols = 8,
    rows = 8;
  for (const action of actions)
    for (const direction of directions)
      for (let frame = 0; frame < 4; frame++) {
        const source = original.directions?.[direction] ?? original;
        const scale = Math.min(52 / source.width, 50 / source.height),
          w = source.width * scale,
          h = source.height * scale,
          left = 32 - w / 2,
          top = 54 - h;
        const index = motionFrame(action, direction, frame);
        context.save();
        context.translate((index % 8) * 64, Math.floor(index / 8) * 64);
        context.beginPath();
        context.rect(0, 0, 64, 64);
        context.clip();
        if (family === "dragon" && source.archetype === "winged-dragon") {
          context.beginPath();
          context.moveTo(left, top + h * 0.51);
          context.lineTo(left + w * 0.45, top + h * 0.44);
          context.lineTo(left + w * 0.84, top + h * 0.46);
          context.lineTo(left + w, top + h * 0.65);
          context.lineTo(left + w, 54);
          context.lineTo(left, 54);
          context.closePath();
          context.clip();
        }
        const vertex = (x: number, y: number) => {
          const p = paintedJoint(
            source.archetype,
            action,
            original.directions?.[direction] ? "east" : direction,
            frame,
            x,
            y,
          );
          return { x: left + p.x * w, y: top + p.y * h };
        };
        for (let row = 0; row < rows; row++)
          for (let col = 0; col < cols; col++) {
            const a = { x: col / cols, y: row / rows },
              b = { x: (col + 1) / cols, y: row / rows },
              c = { x: col / cols, y: (row + 1) / rows },
              d = { x: (col + 1) / cols, y: (row + 1) / rows };
            for (const tri of [
              [a, b, c],
              [b, d, c],
            ]) {
              const [p, q, r] = tri.map((v) => ({
                  x: source.x + v.x * source.width,
                  y: source.y + v.y * source.height,
                })),
                [u, v, z] = tri.map((p) => vertex(p.x, p.y));
              const den =
                p.x * (q.y - r.y) + q.x * (r.y - p.y) + r.x * (p.y - q.y);
              const a1 =
                  (u.x * (q.y - r.y) + v.x * (r.y - p.y) + z.x * (p.y - q.y)) /
                  den,
                b1 =
                  (u.y * (q.y - r.y) + v.y * (r.y - p.y) + z.y * (p.y - q.y)) /
                  den;
              const c1 =
                  (u.x * (r.x - q.x) + v.x * (p.x - r.x) + z.x * (q.x - p.x)) /
                  den,
                d1 =
                  (u.y * (r.x - q.x) + v.y * (p.x - r.x) + z.y * (q.x - p.x)) /
                  den;
              context.save();
              context.beginPath();
              context.moveTo(u.x, u.y);
              context.lineTo(v.x, v.y);
              context.lineTo(z.x, z.y);
              context.closePath();
              context.clip();
              context.transform(
                a1,
                b1,
                c1,
                d1,
                u.x - a1 * p.x - c1 * p.y,
                u.y - b1 * p.x - d1 * p.y,
              );
              context.drawImage(source.image, 0, 0);
              context.restore();
            }
          }
        context.restore();
      }
}

/** Measured silhouettes in the original supplemental color/matte pair. */
export const COMPANION_FRAMES: Record<
  string,
  [number, number, number, number]
> = {
  aurochs: [14, 88, 575, 430],
  stag: [582, 15, 435, 504],
  hind: [1035, 80, 475, 450],
  songbirds: [20, 542, 495, 395],
  moths: [525, 559, 402, 365],
  "ground-dragon": [921, 628, 614, 311],
};

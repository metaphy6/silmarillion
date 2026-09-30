import { z } from "zod";
const n = z.number().finite().nonnegative(),
  integer = n.int(),
  pos = { x: n.max(47.999), y: n.max(31.999) },
  stock = z.object({ P: n, M: n, K: n, E: n }).strict(),
  owner = z.enum(["p1", "p2"]),
  unit = z.enum(["worker", "soldier", "archer", "siege", "hero"]),
  building = z.enum([
    "keep",
    "barracks",
    "farm",
    "lore",
    "tower",
    "wall",
    "workshop",
  ]);
const order = z
  .object({
    kind: z.enum([
      "move",
      "attackMove",
      "attack",
      "gather",
      "build",
      "supply",
      "stop",
      "hold",
    ]),
    x: pos.x.optional(),
    y: pos.y.optional(),
    target: z.string().max(100).optional(),
  })
  .strict()
  .superRefine((o, c) => {
    if (
      ["move", "attackMove"].includes(o.kind) &&
      (o.x === undefined || o.y === undefined)
    )
      c.addIssue({ code: "custom", message: "Ground order needs coordinates" });
    if (["attack", "gather", "build", "supply"].includes(o.kind) && !o.target)
      c.addIssue({ code: "custom", message: "Target order needs identity" });
  });
export const rtsCommandSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("order"),
      units: z.array(z.string().max(100)).min(1).max(256),
      order,
      queued: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("build"),
      building,
      ...pos,
      workers: z.array(z.string()).min(1).max(256),
    })
    .strict(),
  z
    .object({
      kind: z.literal("produce"),
      building: z.string(),
      product: z.enum([
        "worker",
        "soldier",
        "archer",
        "siege",
        "hero",
        "component",
      ]),
    })
    .strict(),
  z.object({ kind: z.literal("rally"), building: z.string(), ...pos }).strict(),
  z.object({ kind: z.literal("cancel"), building: z.string() }).strict(),
  z.object({ kind: z.literal("ability"), ...pos }).strict(),
  z.object({ kind: z.literal("surrender-hero") }).strict(),
  z.object({ kind: z.literal("recover-hero") }).strict(),
]);
const job = z
  .object({
    product: z.enum([
      "worker",
      "soldier",
      "archer",
      "siege",
      "hero",
      "component",
    ]),
    remaining: integer.min(1),
    total: integer.min(1),
    cost: stock,
  })
  .strict()
  .refine((j) => j.remaining <= j.total, "Queue time out of range");
const player = z
  .object({
    profile: z.enum(["human_gondor", "istari_saruman"]),
    stock,
    component: integer,
    hero: z
      .object({
        status: z.enum(["uncreated", "pending", "living", "captive", "dead"]),
        id: z.string(),
        level: integer.min(1),
        perks: z.array(z.string()).max(20),
        readiness: n.max(6),
      })
      .strict(),
    nextSeq: integer.min(1),
    ai: z.boolean(),
    abilityReady: integer,
  })
  .strict();
const record = <T extends z.ZodType>(s: T) =>
  z
    .record(z.string().max(100), s)
    .refine((v) => Object.keys(v).length <= 4096, "Too many records");
export const rtsStateSchema = z
  .object({
    version: z.literal("silmarillion-rts-1"),
    tick: integer,
    seed: integer,
    width: z.literal(48),
    height: z.literal(32),
    terrain: z
      .array(z.enum(["grass", "forest", "water", "road", "cliff", "ford"]))
      .length(1536),
    players: z.object({ p1: player, p2: player }).strict(),
    units: record(
      z
        .object({
          ...pos,
          id: z.string(),
          owner,
          kind: unit,
          name: z.string().max(200),
          hp: n,
          maxHp: n.min(1),
          orders: z.array(order).max(20),
          state: z.enum(["idle", "moving", "working", "attacking", "dead"]),
          facing: z.number().finite(),
          cargo: stock,
          attackCooldown: integer,
          work: z.number().finite().min(-20),
          path: z.array(z.object(pos).strict()).max(1536),
          repath: integer,
          hold: z.boolean(),
          stalled: integer,
          ammo: integer.max(3),
          commitment: z
            .object({
              kind: z.enum(["refit", "voice", "recover"]),
              target: z.string().optional(),
              due: integer,
              origin: z.object(pos).strict(),
              point: z.object(pos).strict().optional(),
            })
            .strict()
            .refine(
              (c) =>
                (c.kind !== "voice" || c.point !== undefined) &&
                (c.kind !== "refit" || c.target !== undefined),
              "Commitment target is missing",
            )
            .optional(),
        })
        .strict(),
    ),
    buildings: record(
      z
        .object({
          ...pos,
          id: z.string(),
          owner,
          kind: building,
          name: z.string().max(200),
          hp: n,
          maxHp: n.min(1),
          progress: n.max(1),
          queue: z.array(job).max(5),
          rally: z.object(pos).strict(),
          cooldown: integer,
        })
        .strict(),
    ),
    resources: record(
      z
        .object({
          ...pos,
          id: z.string(),
          kind: z.enum(["P", "M", "K", "E"]),
          name: z.string().max(200),
          amount: n,
        })
        .strict(),
    ),
    events: z
      .array(
        z
          .object({
            ...pos,
            id: integer,
            tick: integer,
            kind: z.enum([
              "attack",
              "death",
              "complete",
              "delivery",
              "warning",
            ]),
            audience: z.array(owner).max(2),
            target: z.object(pos).strict().optional(),
            text: z.string().max(500),
          })
          .strict(),
      )
      .max(100),
    winner: owner.nullable(),
    nextId: integer.min(1),
    explored: z
      .object({
        p1: z.array(integer.max(1535)).max(1536),
        p2: z.array(integer.max(1535)).max(1536),
      })
      .strict(),
  })
  .strict();

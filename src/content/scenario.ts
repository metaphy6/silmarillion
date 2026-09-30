/** Authored semantic masks, not a claim that an independent painted plate aligns.
 * Change the scenario ID when geography changes. Runtime saves retain their tiles.
 */
type Point = { x: number; y: number };
export function createBasinScenario(size: number) {
  if (!Number.isInteger(size) || size < 24 || size > 128)
    throw new Error("Basin size must be an integer from 24 to 128");
  const mid = Math.floor(size / 2);
  const starts = [
    { x: 4, y: 4 },
    { x: size - 5, y: size - 5 },
    { x: size - 5, y: 4 },
    { x: 4, y: size - 5 },
  ];
  const landmarks = [
    { id: "site:ford", name: "Lantern Ford", x: mid, y: 8 },
    { id: "site:stones", name: "The Witness Stones", x: mid - 4, y: mid },
    { id: "site:orchard", name: "Old Orchard", x: mid + 4, y: mid + 5 },
  ];
  const terrain: string[] = Array(size * size).fill("meadow");
  const ridgeRow = (fraction: number) => {
    const row = Math.floor(size * fraction);
    return row % 8 === 0 ? row + 1 : row;
  };
  const set = (x: number, y: number, kind: string) => {
    terrain[y * size + x] = kind;
  };
  // Two continuous woodland masses, mineral terraces and short escarpments.
  // Their authored normalized bounds scale with the basin; no seed changes routes.
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1),
        v = y / (size - 1);
      if (
        (u > 0.13 && u < 0.35 && v > 0.23 && v < 0.64) ||
        (u > 0.68 && u < 0.87 && v > 0.35 && v < 0.76)
      )
        set(x, y, "woodland");
      if (
        (u > 0.22 && u < 0.4 && v > 0.73 && v < 0.83) ||
        (u > 0.63 && u < 0.79 && v > 0.13 && v < 0.22)
      )
        set(x, y, "stone");
      if (
        (y === ridgeRow(0.75) && u > 0.2 && u < 0.36) ||
        (y === ridgeRow(0.19) && u > 0.65 && u < 0.8)
      )
        set(x, y, "cliff");
    }
  // The river remains continuous in its semantic water mask except designated
  // walkable fords. They are land passages, not spawned bridge facilities.
  for (let y = 0; y < size; y++) set(mid, y, "water");
  const crossings: Point[] = [];
  for (let y = 0; y < size; y += 8) {
    crossings.push({ x: mid, y });
    set(mid, y, "stone");
  }
  const roadKeys = new Set<string>();
  const road = (x: number, y: number) => {
    roadKeys.add(`${x},${y}`);
    set(x, y, "meadow");
  };
  // East and west bank roads plus transverse approaches to each real crossing.
  for (let y = 2; y < size - 2; y++) {
    road(mid - 2, y);
    road(mid + 2, y);
  }
  for (const ford of crossings)
    for (let x = 2; x < size - 2; x++) road(x, ford.y);
  const connect = (at: Point) => {
    const bank = at.x < mid ? mid - 2 : mid + 2;
    for (let x = Math.min(at.x, bank); x <= Math.max(at.x, bank); x++)
      road(x, at.y);
  };
  const facilityFootprints = starts.flatMap((p, i) => [
    { seat: `p${i + 1}`, kind: "core" as const, ...p },
    { seat: `p${i + 1}`, kind: "training" as const, x: p.x + 1, y: p.y },
  ]);
  for (const at of [...starts, ...landmarks]) connect(at);
  // Preserve the existing initial army/recovery-work placement and work sites.
  for (const at of starts)
    for (let y = at.y - 2; y <= at.y + 3; y++)
      for (let x = at.x - 1; x <= at.x + 1; x++) set(x, y, "meadow");
  // A landmark on the river is already a designated ford, never an extra cut.
  for (const ford of crossings) set(ford.x, ford.y, "stone");
  const roads = [...roadKeys].map((key) => {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  });
  const riverTiles: Point[] = [],
    cliffTiles: Point[] = [];
  terrain.forEach((kind, i) => {
    const at = { x: i % size, y: Math.floor(i / size) };
    if (kind === "water") riverTiles.push(at);
    if (kind === "cliff") cliffTiles.push(at);
  });
  // Provisional authored navigation data, not canonical geography. Flow points
  // south only along real adjacent water; segmented ends are explicitly still.
  // Draft classes1/2 are abstract gameplay clearance, not metres.
  const waterChannels: Record<string, Point & {flow:"south"|"still";depth:1|2}> = {};
  for (const at of riverTiles) waterChannels[`${at.x},${at.y}`] = {
    ...at,
    flow: at.y + 1 < size && terrain[(at.y + 1) * size + at.x] === "water" ? "south" : "still",
    depth: [9,21,33].includes(at.y) ? 1 : 2,
  };
  return {
    id: "cross-era-basin-v1" as const,
    contract: {
      chronology_mode: "cross-era-sandbox" as const,
      era_or_window:
        "Deliberately mixed eras; no canonical co-occurrence claimed",
      geography_basis:
        "Original connected basin, not a reconstruction of Beleriand",
      available_profiles:
        "All 55 revision-6 profiles, at most one doctrine per Melkor identity",
      artifact_custody: "Unique canonical artifacts absent",
      fixed_events: "No canonical historical events are forced",
      invented_connections: [
        "Central river fords",
        "Bank roads between four starting regions",
        "Three contested local landmarks",
      ],
    },
    map: { width: size, height: size, terrain },
    starts,
    landmarks,
    roads,
    crossings,
    facilityFootprints,
    riverTiles,
    waterChannels,
    cliffTiles,
  };
}

/** Continuous 2:1 oblique projection. Art and hit tests share ground contact. */
export const RTS_TILE = { x: 36, y: 18 };
export function projectRTS(x: number, y: number) {
  return { x: (x - y) * RTS_TILE.x, y: (x + y) * RTS_TILE.y };
}
export function unprojectRTS(x: number, y: number) {
  return {
    x: Math.round((x / RTS_TILE.x + y / RTS_TILE.y) * 5e11) / 1e12,
    y: Math.round((y / RTS_TILE.y - x / RTS_TILE.x) * 5e11) / 1e12,
  };
}
export function facingRTS(
  radians: number,
): "north" | "east" | "south" | "west" {
  return (["east", "south", "west", "north"] as const)[
    ((Math.round(radians / (Math.PI / 2)) % 4) + 4) % 4
  ];
}
export function constructionStage(progress: number, hp: number) {
  return hp <= 0
    ? "destroyed"
    : progress < 0.25
      ? "foundation"
      : progress < 0.65
        ? "frame"
        : progress < 1
          ? "roof"
          : "complete";
}
export function boxSelection<
  T extends { id: string; x: number; y: number; owner: string; hp: number },
>(
  entities: T[],
  a: { x: number; y: number },
  b: { x: number; y: number },
  owner: string,
) {
  return entities
    .filter((e) => {
      const p = projectRTS(e.x, e.y);
      return (
        e.owner === owner &&
        e.hp > 0 &&
        p.x >= Math.min(a.x, b.x) &&
        p.x <= Math.max(a.x, b.x) &&
        p.y >= Math.min(a.y, b.y) &&
        p.y <= Math.max(a.y, b.y)
      );
    })
    .map((e) => e.id);
}

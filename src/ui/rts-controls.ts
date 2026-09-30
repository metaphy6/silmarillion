/** Pure input preferences and fixed-step clock; never tied to render frame count. */
export const defaultHotkeys = {
  attack: "a",
  stop: "s",
  hold: "h",
  build: "b",
  worker: "w",
  army: "e",
  home: "Home",
  pause: "p",
};
export type Hotkeys = typeof defaultHotkeys;
export function parseHotkeys(value: unknown): Hotkeys | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = { ...defaultHotkeys };
  const used = new Set<string>();
  for (const key of Object.keys(result) as (keyof Hotkeys)[]) {
    const v = (value as Record<string, unknown>)[key];
    if (typeof v !== "string" || !/^([a-z]|Home)$/.test(v) || used.has(v))
      return null;
    used.add(v);
    result[key] = v;
  }
  return result;
}
export function changeSelection(
  current: string[],
  incoming: string[],
  additive: boolean,
): string[] {
  const next = [...new Set(incoming)];
  if (!additive) return next;
  const result = new Set(current);
  for (const id of next)
    if (result.has(id)) result.delete(id);
    else result.add(id);
  return [...result];
}
export class TickClock {
  private remainder = 0;
  /** Bound work per frame, retaining backlog. Hidden local play explicitly pauses. */
  advance(milliseconds: number, paused = false): number {
    if (paused || !Number.isFinite(milliseconds) || milliseconds < 0) return 0;
    this.remainder += milliseconds;
    const steps = Math.min(10, Math.floor((this.remainder + 1e-7) / 100));
    this.remainder -= steps * 100;
    return steps;
  }
}

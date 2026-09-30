import { describe, expect, it } from "vitest";
import {
  defaultHotkeys,
  parseHotkeys,
  changeSelection,
  TickClock,
} from "../src/ui/rts-controls";
describe("real-time input and clock contracts", () => {
  it("adds/toggles explicit selections without duplicates", () => {
    expect(changeSelection(["a"], ["b", "b"], true)).toEqual(["a", "b"]);
    expect(changeSelection(["a", "b"], ["b"], true)).toEqual(["a"]);
  });
  it("rejects collisions and unsafe/reserved mappings", () => {
    expect(parseHotkeys({ ...defaultHotkeys, attack: "s" })).toBeNull();
    expect(parseHotkeys({ ...defaultHotkeys, attack: "Control" })).toBeNull();
    expect(parseHotkeys({ ...defaultHotkeys, attack: "q" })?.attack).toBe("q");
  });
  it("retains sub-tick remainder independently of frame cadence", () => {
    const a = new TickClock(),
      b = new TickClock();
    let x = 0,
      y = 0;
    for (let i = 0; i < 60; i++) x += a.advance(1000 / 60);
    for (let i = 0; i < 20; i++) y += b.advance(50);
    expect(x).toBe(10);
    expect(y).toBe(x);
  });
  it("does not create time during pause and retains backlog", () => {
    const c = new TickClock();
    expect(c.advance(1050)).toBe(10);
    expect(c.advance(10000, true)).toBe(0);
    expect(c.advance(50)).toBe(1);
    expect(c.advance(5000)).toBe(10);
    expect(c.advance(0)).toBe(10);
  });
});

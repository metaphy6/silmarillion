import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import map from "../public/assets/portrait-map.json";
import roster from "../src/content/factions.json";

it("covers the exact roster with one shared Melkor identity and bounded distinct crops", () => {
  expect(Object.keys(map.profiles).sort()).toEqual(roster.profiles.map(p => p.id).sort());
  const unique = new Set<string>();
  for (const p of Object.values(map.profiles)) {
    const a = map.atlases[p.atlas as keyof typeof map.atlases];
    const [x,y,w,h] = p.rect;
    expect(x).toBeGreaterThanOrEqual(0); expect(y).toBeGreaterThanOrEqual(0);
    expect(w).toBeGreaterThan(250); expect(h).toBeGreaterThan(300);
    expect(x+w).toBeLessThanOrEqual(a.width); expect(y+h).toBeLessThanOrEqual(a.height);
    expect(p.alt.length).toBeGreaterThan(20);
    unique.add(`${p.atlas}:${p.rect.join(",")}`);
  }
  expect(unique.size).toBe(54);
  expect(map.profiles.melkor_dark_architect.identity).toBe("melkor");
  expect(map.profiles.melkor_dark_architect.rect).toEqual(map.profiles.melkor_worldbreaker.rect);
  expect(map.profiles.melkor_dark_architect.atlas).toBe(map.profiles.melkor_worldbreaker.atlas);
});

it("ships verified WebP assets within the per-atlas lazy-load budget", () => {
  for (const a of Object.values(map.atlases)) {
    const bytes = readFileSync(new URL(`../public/${a.url}`, import.meta.url));
    expect(bytes.toString("ascii",0,4)).toBe("RIFF");
    expect(bytes.toString("ascii",8,12)).toBe("WEBP");
    expect(bytes.length).toBe(a.bytes);
    expect(bytes.length).toBeLessThan(750000);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(a.sha256);
  }
});

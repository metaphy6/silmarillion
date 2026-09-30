import { expect, it } from "vitest";
import { createMatch } from "../src/simulation/engine";
import { councilAction, councilPanel } from "../src/ui/council-controls";
import { recordGrievance, offerTerms } from "../src/simulation/council";
it("panel quotes exact terms, dates evidence and hides unrelated parties", () => {
  const s = createMatch(["nienna", "human_gondor", "human_rohan"], 1);
  const q = recordGrievance(
    s,
    s.units["p2:company:0"],
    s.units["p1:company:0"],
    2,
  )!;
  offerTerms(s, "p1", q.id, { P: 5, M: 0, K: 0, E: 0 }, "p1");
  expect(councilPanel(s, "p1")).toContain("5P 0M 0K 0E");
  expect(councilPanel(s, "p3")).toBe("");
  const value = (id: string) => (id === "council-grievance" ? q.id : "");
  expect(councilAction("council-accept", s, value)).toEqual({
    kind: "council-consent",
    grievance: q.id,
    accept: true,
    termsVersion: 1,
  });
  expect(councilPanel(s, "p1")).toContain("3 readiness");
});
it("full host UI hides remote enemy facilities and chooses the shortest adjacent delivery endpoint", () => {
  const s = createMatch(["nienna", "human_gondor"], 1);
  s.facilities["p2:core"].name = "SECRET UNOBSERVED ARCHIVE";
  expect(councilPanel(s, "p1")).not.toContain("SECRET UNOBSERVED ARCHIVE");
  const u = s.units["p1:company:0"];
  const f = s.facilities["p1:core"];
  Object.assign(u, { x: 5, y: 4 });
  const values: Record<string, string> = {
    "council-carrier": u.id,
    "council-destination": f.id,
    "council-origin": f.id,
    "council-grievance": "absent",
  };
  const a = councilAction("council-send", s, (id) => values[id] ?? "");
  expect(a?.kind).toBe("council-deliver");
  if (a?.kind === "council-deliver") expect(a.route).toEqual([{ x: 5, y: 4 }]);
});

import { test, expect, type Page } from "@playwright/test";

async function inspectPortrait(page: Page, profile: string, atlas: number) {
  const loaded: string[] = [];
  page.on("request", request => {
    if (request.url().includes("sm-portrait-atlas-")) loaded.push(request.url());
  });
  await page.goto("/");
  await page.locator("#faction").selectOption(profile);
  await page.locator("#tutorial").uncheck();
  await page.getByRole("button", { name: "Begin Cross-era sandbox" }).click();
  await page.getByRole("button", { name: "Hero", exact: true }).click();
  const portrait = page.locator(".portrait");
  await expect(portrait).toBeVisible();
  await expect(portrait).toHaveAttribute("aria-label", /.+/);
  const result = await portrait.evaluate(async element => {
    const style = getComputedStyle(element);
    const url = style.backgroundImage.slice(5, -2);
    const image = new Image(); image.src = url; await image.decode();
    const box = element.getBoundingClientRect();
    return { url, width: box.width, height: box.height, imageWidth: image.naturalWidth,
      position: style.backgroundPosition, size: style.backgroundSize,
      overflow: document.documentElement.scrollWidth > window.innerWidth };
  });
  expect(result.url).toContain(`sm-portrait-atlas-${atlas}-v1.webp`);
  expect(result.imageWidth).toBeGreaterThan(900);
  expect(result.width).toBeGreaterThan(100);
  expect(result.height).toBeGreaterThan(100);
  expect(result.overflow).toBe(false);
  expect(new Set(loaded).size).toBe(1);
  await portrait.screenshot({ path: `docs/reports/runtime/portrait-${profile}.png` });
  return result;
}

for (const [profile, atlas] of [["manwe",1],["este",2],["human_numenor",3],["istari_pallando",4],["ent_grove",5]] as const) {
  test(`portrait atlas ${atlas} renders ${profile} without loading other atlases`, async ({ page }) => {
    await inspectPortrait(page, profile, atlas);
  });
}

test("both Melkor doctrines retain the same visual identity", async ({ page }) => {
  const first = await inspectPortrait(page,"melkor_worldbreaker",5);
  const second = await inspectPortrait(page,"melkor_dark_architect",5);
  expect([second.url,second.position,second.size]).toEqual([first.url,first.position,first.size]);
});

test("nonhuman spider portrait remains inspectable at compact viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await inspectPortrait(page,"spider_brood",5);
  await page.screenshot({ path: "docs/reports/runtime/portrait-compact-spider.png", fullPage:true });
});

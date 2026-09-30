// Native Firefox WebDriver BiDi smoke; DOM-dispatched controls, not pointer QA.
// Protocol entry: https://developer.mozilla.org/en-US/docs/Web/WebDriver/How_to/Create_BiDi_connection
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
const profile = await mkdtemp("/tmp/agent-runs/silmarillion-firefox-");
const child = spawn(
  process.env.SILMARILLION_FIREFOX_EXECUTABLE ??
    "/snap/firefox/current/usr/lib/firefox/firefox",
  [
    "--headless",
    "--no-remote",
    "--profile",
    profile,
    "--remote-debugging-port",
    "0",
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
let ws;
try {
  const address = await new Promise((resolve, reject) => {
    let log = "";
    const timer = setTimeout(
      () => reject(new Error(`Firefox startup timeout: ${log.slice(-1200)}`)),
      15000,
    );
    child.stderr.on("data", (d) => {
      log += d;
      const m = log.match(/WebDriver BiDi listening on (ws:\/\/[^\s]+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1] + "/session");
      }
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Firefox exited ${code}: ${log.slice(-1200)}`));
    });
  });
  ws = new WebSocket(address);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (!pending.has(m.id)) return;
    const { resolve, reject, timer } = pending.get(m.id);
    clearTimeout(timer);
    pending.delete(m.id);
    if (m.type === "error") reject(new Error(JSON.stringify(m)));
    else resolve(m.result);
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const key = ++id,
        timer = setTimeout(() => {
          pending.delete(key);
          reject(new Error(`BiDi timeout: ${method}`));
        }, 20000);
      pending.set(key, { resolve, reject, timer });
      ws.send(JSON.stringify({ id: key, method, params }));
    });
  const session = await send("session.new", {
    capabilities: { alwaysMatch: { browserName: "firefox" } },
  });
  const { context } = await send("browsingContext.create", { type: "tab" });
  const evaluate = async (expression) => {
    const r = await send("script.evaluate", {
      expression,
      target: { context },
      awaitPromise: true,
    });
    if (r.type === "exception") throw new Error(JSON.stringify(r));
    return r.result?.value;
  };
  const wait = (expression) =>
    evaluate(
      `new Promise((resolve,reject)=>{const start=Date.now();const tick=()=>{if(${expression})resolve(true);else if(Date.now()-start>15000)reject(new Error('UI wait failed'));else setTimeout(tick,50);};tick();})`,
    );
  await send("browsingContext.navigate", {
    context,
    url: "http://127.0.0.1:5173/",
    wait: "complete",
  });
  await wait(`document.querySelector('#setup-form')`);
  await evaluate(
    `document.querySelector('#tutorial').checked=false;document.querySelector('#setup-form').requestSubmit();true`,
  );
  await wait(`document.querySelector('[data-action="tab:economy"]')`);
  await evaluate(
    `document.querySelector('[data-action="tab:economy"]').click();document.querySelector('[data-action="produce:p1:core:component"]').click();document.querySelector('#confirm').click();document.querySelector('[data-action="resolve"]').click();true`,
  );
  await wait(
    `document.querySelector('#status')?.textContent.includes('Week 2 committed')`,
  );
  await evaluate(
    `document.querySelector('[data-action="produce:p1:core:hero"]').click();document.querySelector('#confirm').click();document.querySelector('[data-action="resolve"]').click();true`,
  );
  await wait(
    `document.querySelector('#status')?.textContent.includes('Week 3 committed')`,
  );
  await evaluate(
    `document.querySelector('[data-action="resolve"]').click();true`,
  );
  await wait(
    `document.querySelector('#status')?.textContent.includes('Week 4 committed')`,
  );
  await evaluate(
    `document.querySelector('[data-action="tab:hero"]').click();true`,
  );
  await wait(
    `document.querySelector('#controls')?.textContent.includes('LIVING')`,
  );
  const shot = await send("browsingContext.captureScreenshot", { context });
  await mkdir("docs/reports/runtime", { recursive: true });
  await writeFile(
    "docs/reports/runtime/firefox-local.png",
    Buffer.from(shot.data, "base64"),
  );
  await send("browsingContext.reload", { context, wait: "complete" });
  await wait(`document.querySelector('[data-action="load"]')`);
  await evaluate(`document.querySelector('[data-action="load"]').click();true`);
  await wait(
    `document.querySelector('.topbar')?.textContent.includes('Week 4')`,
  );
  const report = {
    browser: session.capabilities.browserName,
    version: session.capabilities.browserVersion,
    localHeroCreation: "passed",
    indexedDBReload: "passed",
    input:
      "DOM-dispatched controls through actual app handlers; not pointer/keyboard compatibility evidence",
    multiplayer: "not tested in Firefox",
    protocol: "native WebDriver BiDi",
  };
  await writeFile(
    "docs/reports/runtime/firefox.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
  await send("session.end");
} finally {
  ws?.close();
  child.kill("SIGTERM");
  await new Promise((resolve) =>
    child.exitCode !== null ? resolve() : child.once("exit", resolve),
  );
  await rm(profile, { recursive: true, force: true });
}

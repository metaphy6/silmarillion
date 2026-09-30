import "./ui/style.css";
if (new URLSearchParams(location.search).get("mode") === "rts") {
  const { startRTS } = await import("./ui/rts-app");
  startRTS();
} else {
  const { start } = await import("./ui/app");
  await start();
  const setup = document.querySelector("#setup-form");
  if (setup) {
    const link = document.createElement("a");
    link.href = "?mode=rts";
    link.textContent = "Play real-time skirmish → Gondor vs Saruman";
    link.className = "rts-launch";
    link.style.cssText =
      "display:block;padding:18px;margin:0 0 18px;background:#EDBE73;color:#14242A;font-weight:bold;text-decoration:none;border:1px solid #F2E8D5";
    setup.prepend(link);
  }
}

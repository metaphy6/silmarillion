import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    rollupOptions: { output: { manualChunks: { phaser: ["phaser"] } } },
  },
  server: {
    // Extended playtests must not reload a running match when source changes.
    hmr: process.env.SILMARILLION_PLAYTEST === "1" ? false : undefined,
    fs: {
      deny: [
        "**/.env*",
        "**/silmarillion.pdf",
        "**/silmarillion-extracted-text.txt",
      ],
    },
  },
});

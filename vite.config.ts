import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    rollupOptions: { output: { manualChunks: { phaser: ["phaser"] } } },
  },
  server: {
    fs: {
      deny: [
        "**/.env*",
        "**/silmarillion.pdf",
        "**/silmarillion-extracted-text.txt",
      ],
    },
  },
});

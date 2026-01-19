#!/usr/bin/env bun

await Bun.build({
  outdir: "dist",
  entrypoints: ["src/index.ts"],
  sourcemap: "linked",
  target: "bun",
  format: "esm",
  external: ["eta"],
});

export {};

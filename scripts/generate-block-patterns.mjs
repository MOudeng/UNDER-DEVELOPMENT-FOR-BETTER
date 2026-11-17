#!/usr/bin/env node
// Draws the extra 2x2 block-design patterns (variants e-h of levels 6-8) as PNGs
// into each level's own folder (Level 6/, Level 7/, Level 8/). Run: node scripts/generate-block-patterns.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PNG } from "pngjs";

const OUT_DIR = resolve("src/assets/TEST_RANDOM_OTAK_ATIK");
const SIZE = 3780; // same as the existing level images

// Cells run TL, TR, BL, BR. R/W are solid blocks; tl/tr/bl/br are the half-red
// diagonal block, named for the corner holding the red triangle's right angle.
export const PATTERNS = {
  "6e": ["tr", "bl", "tr", "br"],
  "6f": ["bl", "br", "tl", "br"],
  "6g": ["br", "tr", "tl", "br"],
  "6h": ["bl", "br", "tl", "tl"],
  "7e": ["bl", "bl", "tl", "tr"],
  "7f": ["bl", "tl", "bl", "tl"],
  "7g": ["tr", "bl", "br", "br"],
  "7h": ["br", "tl", "tr", "tr"],
  "8e": ["bl", "tr", "bl", "bl"],
  "8f": ["br", "tr", "br", "tr"],
  "8g": ["tl", "bl", "tl", "tr"],
  "8h": ["tl", "bl", "tl", "tl"],
};

const isRed = (type, u, v) => {
  switch (type) {
    case "R": return true;
    case "W": return false;
    case "tl": return u + v < 1;
    case "tr": return v < u;
    case "bl": return v > u;
    case "br": return u + v > 1;
    default: throw new Error(`unknown cell ${type}`);
  }
};

const coverage = (type, u, v, step) => {
  const nearEdge = type.length === 2 && Math.min(Math.abs(u + v - 1), Math.abs(u - v)) < 2 * step;
  if (!nearEdge) return isRed(type, u, v) ? 1 : 0;
  let hits = 0;
  for (const dx of [0.25, 0.75]) {
    for (const dy of [0.25, 0.75]) hits += isRed(type, u + (dx - 0.5) * step, v + (dy - 0.5) * step) ? 1 : 0;
  }
  return hits / 4;
};

const render = (cells) => {
  const png = new PNG({ width: SIZE, height: SIZE });
  const half = SIZE / 2;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const type = cells[(y >= half ? 2 : 0) + (x >= half ? 1 : 0)];
      const c = coverage(type, ((x + 0.5) % half) / half, ((y + 0.5) % half) / half, 1 / half);
      const i = (y * SIZE + x) * 4;
      png.data[i] = 255;
      png.data[i + 1] = Math.round(255 * (1 - c));
      png.data[i + 2] = Math.round(255 * (1 - c));
      png.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(png, { colorType: 2, deflateLevel: 9 });
};

for (const [name, cells] of Object.entries(PATTERNS)) {
  const dir = resolve(OUT_DIR, `Level ${name[0]}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, `Lvl ${name}.png`), render(cells));
  console.log(`Lvl ${name}.png  ${cells.join(",")}`);
}

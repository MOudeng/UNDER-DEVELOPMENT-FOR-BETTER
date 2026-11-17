#!/usr/bin/env node
// Self-check for the practice sequence and avatar list. Run: node scripts/check-game-data.mjs
import assert from "node:assert/strict";

import { PROFILE_AVATARS } from "../src/types/localProfiles.ts";
import { createPracticeBatch } from "../src/utils/practicePatterns.ts";

// Levels 1-5 have 4 variants, levels 6-8 have 8.
const levels = Array.from({ length: 8 }, (_, level) =>
  [..."abcdefgh"].slice(0, level >= 5 ? 8 : 4).map((variant) => `${level + 1}${variant}`),
);

for (let run = 0; run < 200; run++) {
  const batch = createPracticeBatch(levels);
  assert.equal(batch.length, 64);
  // A level's variants are used up before any repeat.
  for (const [level, variants] of levels.entries()) {
    const used = batch.filter((pattern) => pattern[0] === String(level + 1));
    assert.equal(used.length, 8);
    assert.equal(new Set(used).size, variants.length, "every variant must appear");
  }
  batch.forEach((pattern, index) => {
    assert.equal(pattern[0], String((index % 8) + 1), "rounds must climb level 1 to 8");
  });

  // The player never sees the same pattern twice in a row across two batches,
  // because a level comes back only after the seven other levels.
  const next = [...batch, ...createPracticeBatch(levels)];
  next.slice(1).forEach((pattern, index) => assert.notEqual(pattern, next[index]));
}

assert.equal(PROFILE_AVATARS.length, 50, "the app promises 50 avatar icons");
assert.equal(new Set(PROFILE_AVATARS.map((a) => a.id)).size, 50, "avatar ids must be unique");
assert.equal(new Set(PROFILE_AVATARS.map((a) => a.emoji)).size, 50, "avatar icons must differ");
// Profiles saved before the list grew must keep their icon.
for (const id of ["rocket", "star", "puzzle", "robot", "cat", "fox"]) {
  assert.ok(PROFILE_AVATARS.some((a) => a.id === id), `${id} must stay available`);
}

console.log("OK: practice sequence and 50 avatars");

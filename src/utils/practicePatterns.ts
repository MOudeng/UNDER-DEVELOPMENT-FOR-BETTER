const shuffle = <T>(items: readonly T[]) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * One batch of practice patterns. Every round climbs through the levels from
 * easiest to hardest, and a level's variants are used up before any repeats.
 * Practice is unlimited: append another batch when the player reaches the end.
 */
export const createPracticeBatch = <T>(levels: readonly (readonly T[])[]) => {
  const shuffledLevels = levels.map(shuffle);
  const rounds = Math.max(...levels.map((variants) => variants.length));
  return Array.from({ length: rounds }, (_, round) =>
    shuffledLevels.map((variants) => variants[round % variants.length]),
  ).flat();
};

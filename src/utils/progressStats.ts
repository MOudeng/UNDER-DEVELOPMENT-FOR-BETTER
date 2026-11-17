import type {
  LocalPatternResult,
  SessionWithPatterns,
} from "../types/localProfiles";

export const LEVEL_COUNT = 8;

// Bump when the level images change: times from another bank are not comparable.
export const PATTERN_SET_ID = "step-assets-v1";

// SQL because finishing a session and migrating old sessions must agree on what
// "complete" means. Migrated test sessions have no level detail but did finish.
export const SESSION_STATUS_SQL = `CASE WHEN (
    SELECT COUNT(DISTINCT p.level_number) FROM pattern_results p
    WHERE p.session_id = game_sessions.id
      AND p.completion_status = 'completed'
      AND p.level_number BETWEEN 1 AND ${LEVEL_COUNT}
  ) = ${LEVEL_COUNT}
  OR (verification_method = 'legacy_async_storage' AND completed_patterns >= ${LEVEL_COUNT})
  THEN 'completed' ELSE 'partial' END`;

export const BACKFILL_PROGRESS_SQL = `
  UPDATE pattern_results SET level_number = CAST(substr(pattern_id, 7, 1) AS INTEGER)
    WHERE pattern_id GLOB 'level-[1-8]-step-*';
  UPDATE pattern_results SET verification_method = (
    SELECT g.verification_method FROM game_sessions g WHERE g.id = pattern_results.session_id
  );
  UPDATE game_sessions SET pattern_set_id = '${PATTERN_SET_ID}'
    WHERE verification_method = 'manual_completion';
  UPDATE game_sessions SET session_status = ${SESSION_STATUS_SQL}
    WHERE finished_at IS NOT NULL;
`;

export type CompleteSession = {
  id: string;
  finishedAt: number;
  verificationMethod: string;
  levelDurationsMs: number[];
  levelVariants: (string | null)[];
  totalDurationMs: number;
};

const toCompleteSession = (
  session: SessionWithPatterns,
): CompleteSession | null => {
  if (
    session.finishedAt === null ||
    session.sessionStatus !== "completed" ||
    session.patternSetId !== PATTERN_SET_ID
  ) {
    return null;
  }

  // Results come in play order. Practice loops through the levels without end,
  // so only its first round has the same definition as a test session.
  const firstResultByLevel = new Map<number, LocalPatternResult>();
  for (const result of session.patterns) {
    if (
      result.levelNumber !== null &&
      result.completionStatus === "completed" &&
      !firstResultByLevel.has(result.levelNumber)
    ) {
      firstResultByLevel.set(result.levelNumber, result);
    }
  }

  const levelDurationsMs: number[] = [];
  const levelVariants: (string | null)[] = [];
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const result = firstResultByLevel.get(level);
    if (!result || !Number.isFinite(result.durationMs) || result.durationMs < 0) {
      return null;
    }
    levelDurationsMs.push(result.durationMs);
    levelVariants.push(result.patternVariant);
  }

  return {
    id: session.id,
    finishedAt: session.finishedAt,
    verificationMethod: session.verificationMethod,
    levelDurationsMs,
    levelVariants,
    totalDurationMs: levelDurationsMs.reduce((total, value) => total + value, 0),
  };
};

/** Complete sessions of one profile and mode, oldest first. */
export const getCompleteSessions = (
  sessions: SessionWithPatterns[],
  profileId: string,
  gameMode: SessionWithPatterns["gameMode"],
) =>
  sessions
    .filter(
      (session) => session.profileId === profileId && session.gameMode === gameMode,
    )
    .map(toCompleteSession)
    .filter((session): session is CompleteSession => session !== null)
    .sort((a, b) => a.finishedAt - b.finishedAt);

export const summarizeSessions = (sessions: CompleteSession[]) => {
  const totals = sessions.map((session) => session.totalDurationMs);
  return {
    count: sessions.length,
    bestMs: totals.length > 0 ? Math.min(...totals) : null,
    averageMs:
      totals.length > 0
        ? totals.reduce((total, value) => total + value, 0) / totals.length
        : null,
  };
};

export const levelRangeMs = (session: CompleteSession) =>
  Math.max(...session.levelDurationsMs) - Math.min(...session.levelDurationsMs);

/** What to flag when comparing two sessions level by level. */
export const compareSessions = (a: CompleteSession, b: CompleteSession) => ({
  // Different variants are expected (same level bank). Sessions from older
  // versions did not record the variant, so those levels stay unknown.
  unrecordedPatternCount: a.levelVariants.filter(
    (variant, index) => variant === null || b.levelVariants[index] === null,
  ).length,
  verificationDiffers: a.verificationMethod !== b.verificationMethod,
});

export const describeProgress = (sessions: CompleteSession[]) => {
  if (sessions.length < 2) {
    return ["Mainkan beberapa sesi lengkap untuk melihat perubahan waktu permainan."];
  }

  const latest = sessions[sessions.length - 1];
  const previous = sessions[sessions.length - 2];
  const lines: string[] = [];

  if (latest.totalDurationMs < previous.totalDurationMs) {
    lines.push("Waktu penyelesaian sesi terbaru lebih singkat dibandingkan sesi sebelumnya.");
  } else if (latest.totalDurationMs > previous.totalDurationMs) {
    lines.push("Waktu penyelesaian sesi terbaru lebih lama dibandingkan sesi sebelumnya.");
  } else {
    lines.push("Waktu penyelesaian sesi terbaru sama dengan sesi sebelumnya.");
  }
  if (levelRangeMs(latest) < levelRangeMs(previous)) {
    lines.push("Perbedaan waktu penyelesaian antarlevel pada sesi terbaru lebih kecil.");
  }
  return lines;
};

export const formatClock = (milliseconds: number | null) => {
  if (milliseconds === null) return "--:--";
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

/** Round axis values from 0 up to at least maxValue. */
export const niceTicks = (maxValue: number, divisions = 4) => {
  const safeMax = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 1;
  const rough = safeMax / divisions;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 5, 10].map((factor) => factor * magnitude).find((value) => value >= rough) ??
    rough;
  return Array.from({ length: Math.ceil(safeMax / step) + 1 }, (_, index) =>
    Number((index * step).toFixed(2)),
  );
};

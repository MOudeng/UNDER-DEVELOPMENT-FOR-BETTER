#!/usr/bin/env node
// Self-check for the progress charts' numbers and the database migration, on
// synthetic data only. Run: node --no-warnings scripts/check-progress-stats.mjs
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

import {
  BACKFILL_PROGRESS_SQL,
  compareSessions,
  describeProgress,
  formatClock,
  getCompleteSessions,
  levelRangeMs,
  niceTicks,
  PATTERN_SET_ID,
  SESSION_STATUS_SQL,
  summarizeSessions,
} from "../src/utils/progressStats.ts";

const makeSession = (id, finishedAt, seconds, overrides = {}) => ({
  id,
  profileId: "bima",
  gameMode: "test",
  startedAt: finishedAt - 1000,
  finishedAt,
  totalDurationMs: seconds.reduce((total, value) => total + value * 1000, 0),
  completedPatterns: seconds.length,
  verificationMethod: "manual_completion",
  patternSetId: PATTERN_SET_ID,
  sessionStatus: "completed",
  patterns: seconds.map((value, index) => ({
    id: `${id}-${index}`,
    sessionId: id,
    patternId: `level-${index + 1}-step-${index + 1}`,
    levelNumber: index + 1,
    patternVariant: "a",
    durationMs: value * 1000,
    completionStatus: "completed",
  })),
  ...overrides,
});
const EIGHT = [20, 30, 35, 45, 55, 65, 75, 95]; // 420 s
const FASTER = [10, 20, 25, 25, 30, 30, 30, 40]; // 210 s

const older = makeSession("older", 1000, EIGHT);
const newer = makeSession("newer", 2000, FASTER);
const ids = (sessions) => sessions.map((session) => session.id);

// Total, best, average, and chronological order even when given newest first.
const complete = getCompleteSessions([newer, older], "bima", "test");
assert.deepEqual(ids(complete), ["older", "newer"]);
assert.equal(complete[0].totalDurationMs, 420_000);
assert.deepEqual(summarizeSessions(complete), { count: 2, bestMs: 210_000, averageMs: 315_000 });
assert.deepEqual(summarizeSessions([]), { count: 0, bestMs: null, averageMs: null });

// First and latest session comparison.
assert.deepEqual(complete[0].levelDurationsMs, EIGHT.map((value) => value * 1000));
assert.equal(levelRangeMs(complete[0]), 75_000);
assert.equal(levelRangeMs(complete[1]), 30_000);

// Profiles and modes never mix.
assert.deepEqual(ids(getCompleteSessions([older], "sinta", "test")), []);
assert.deepEqual(ids(getCompleteSessions([older], "bima", "practice")), []);

// Incomplete or invalid sessions are not complete sessions.
const rejected = [
  makeSession("seven", 3000, EIGHT.slice(0, 7)),
  makeSession("partial", 3000, EIGHT, { sessionStatus: "partial" }),
  makeSession("unfinished", 3000, EIGHT, { finishedAt: null }),
  makeSession("negative", 3000, [-5, ...EIGHT.slice(1)]),
  makeSession("nan", 3000, [Number.NaN, ...EIGHT.slice(1)]),
  makeSession("other-bank", 3000, EIGHT, { patternSetId: "old-bank" }),
  makeSession("no-levels", 3000, EIGHT, { patterns: [] }),
];
assert.deepEqual(getCompleteSessions(rejected, "bima", "test"), []);
const failedLevel = makeSession("failed", 3000, EIGHT);
failedLevel.patterns[0].completionStatus = "failed";
assert.deepEqual(getCompleteSessions([failedLevel], "bima", "test"), []);

// Practice loops the levels, so only the first round counts, and repeats of a
// level cannot inflate the total.
const practice = makeSession("practice", 4000, [...EIGHT, ...FASTER], { gameMode: "practice" });
practice.patterns.forEach((pattern, index) => {
  pattern.levelNumber = (index % 8) + 1;
});
assert.equal(getCompleteSessions([practice], "bima", "practice")[0].totalDurationMs, 420_000);

// Different verification methods and unrecorded patterns are flagged, while a
// different variant from the same level bank is expected and is not.
const automatic = makeSession("auto", 5000, FASTER, { verificationMethod: "auto" });
automatic.patterns[0].patternVariant = "b";
automatic.patterns[1].patternVariant = null;
const [a, b] = getCompleteSessions([older, automatic], "bima", "test");
assert.deepEqual(compareSessions(a, b), { unrecordedPatternCount: 1, verificationDiffers: true });
assert.deepEqual(compareSessions(b, a), { unrecordedPatternCount: 1, verificationDiffers: true });
assert.deepEqual(compareSessions(a, a), { unrecordedPatternCount: 0, verificationDiffers: false });
const unrecorded = makeSession("unrecorded", 6000, EIGHT);
unrecorded.patterns.forEach((pattern) => {
  pattern.patternVariant = null;
});
const [old] = getCompleteSessions([unrecorded], "bima", "test");
assert.equal(compareSessions(old, old).unrecordedPatternCount, 8, "unknown patterns are flagged");

// Neutral wording, and no claims from too little data.
const NOT_ENOUGH = ["Mainkan beberapa sesi lengkap untuk melihat perubahan waktu permainan."];
assert.deepEqual(describeProgress([]), NOT_ENOUGH);
assert.deepEqual(describeProgress(complete.slice(0, 1)), NOT_ENOUGH);
assert.deepEqual(describeProgress(complete), [
  "Waktu penyelesaian sesi terbaru lebih singkat dibandingkan sesi sebelumnya.",
  "Perbedaan waktu penyelesaian antarlevel pada sesi terbaru lebih kecil.",
]);
assert.deepEqual(describeProgress([...complete].reverse()), [
  "Waktu penyelesaian sesi terbaru lebih lama dibandingkan sesi sebelumnya.",
]);
assert.ok(!describeProgress(complete).join(" ").match(/IQ|kecerdasan|kognitif|gangguan/i));

// Formatting and axis values cannot blow up on empty or odd input.
assert.equal(formatClock(195_000), "03:15");
assert.equal(formatClock(null), "--:--");
assert.equal(formatClock(-500), "00:00");
for (const max of [0, Number.NaN, -3, 0.4, 7, 420, 3599]) {
  const ticks = niceTicks(max);
  assert.equal(ticks[0], 0);
  assert.ok(ticks.at(-1) >= max || !(max > 0), `ticks must cover ${max}`);
  assert.ok(ticks.length >= 2 && ticks.length <= 7, `tick count for ${max}`);
}

// Migration: a database from the previous version keeps its data and gains the new fields.
const database = new DatabaseSync(":memory:");
database.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE profiles (id TEXT PRIMARY KEY NOT NULL);
  CREATE TABLE game_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL,
    game_mode TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    total_duration_ms INTEGER NOT NULL DEFAULT 0 CHECK(total_duration_ms >= 0),
    completed_patterns INTEGER NOT NULL DEFAULT 0 CHECK(completed_patterns >= 0),
    verification_method TEXT NOT NULL,
    FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  );
  CREATE TABLE pattern_results (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL,
    pattern_id TEXT NOT NULL,
    duration_ms INTEGER NOT NULL CHECK(duration_ms >= 0),
    completion_status TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
    UNIQUE(session_id, pattern_id)
  );
  INSERT INTO profiles VALUES ('bima');
`);
const addSession = database.prepare(
  `INSERT INTO game_sessions(
    id, profile_id, game_mode, started_at, finished_at,
    total_duration_ms, completed_patterns, verification_method
  ) VALUES (?, 'bima', ?, 1, 2, ?, ?, ?)`,
);
const addResult = database.prepare(
  `INSERT OR IGNORE INTO pattern_results(
    id, session_id, pattern_id, duration_ms, completion_status
  ) VALUES (?, ?, ?, ?, 'completed')`,
);
addSession.run("full", "test", 8000, 8, "manual_completion");
addSession.run("short", "practice", 3000, 3, "manual_completion");
addSession.run("old-test", "test", 9000, 8, "legacy_async_storage");
addSession.run("old-level", "legacy", 500, 1, "legacy_async_storage");
for (let level = 1; level <= 8; level++) {
  addResult.run(`full-${level}`, "full", `level-${level}-step-${level}`, 1000);
}
for (let level = 1; level <= 3; level++) {
  addResult.run(`short-${level}`, "short", `level-${level}-step-${level}`, 1000);
}
addResult.run("old-result", "old-level", "level-4", 500);

// A repeated tap on the same step cannot add a second result.
addResult.run("full-dup", "full", "level-1-step-1", 99999);
const countResults = () =>
  database.prepare("SELECT COUNT(*) AS n FROM pattern_results").get().n;
assert.equal(countResults(), 12);

database.exec(`
  ALTER TABLE game_sessions ADD COLUMN pattern_set_id TEXT;
  ALTER TABLE game_sessions ADD COLUMN session_status TEXT NOT NULL DEFAULT 'in_progress';
  ALTER TABLE pattern_results ADD COLUMN level_number INTEGER;
  ALTER TABLE pattern_results ADD COLUMN pattern_variant TEXT;
  ALTER TABLE pattern_results ADD COLUMN verification_method TEXT;
`);
database.exec(BACKFILL_PROGRESS_SQL);
database.exec(BACKFILL_PROGRESS_SQL); // safe to re-run after an interrupted upgrade

const sessionRow = (id) =>
  database.prepare("SELECT * FROM game_sessions WHERE id = ?").get(id);
assert.equal(sessionRow("full").session_status, "completed");
assert.equal(sessionRow("full").pattern_set_id, PATTERN_SET_ID);
assert.equal(sessionRow("full").total_duration_ms, 8000, "old totals must not change");
assert.equal(sessionRow("short").session_status, "partial");
assert.equal(sessionRow("old-test").session_status, "completed");
assert.equal(sessionRow("old-test").pattern_set_id, null, "no level detail, stays off the charts");
assert.equal(sessionRow("old-level").session_status, "partial");
assert.equal(countResults(), 12, "migration must not lose or add results");

const resultRow = (id) =>
  database.prepare("SELECT * FROM pattern_results WHERE id = ?").get(id);
assert.equal(resultRow("full-7").level_number, 7);
assert.equal(resultRow("full-7").verification_method, "manual_completion");
assert.equal(resultRow("full-1").duration_ms, 1000, "the repeated tap must not overwrite");
assert.equal(resultRow("old-result").level_number, null);

// Finishing uses the same rule as the migration.
addSession.run("live", "test", 0, 0, "manual_completion");
for (let level = 1; level <= 8; level++) {
  addResult.run(`live-${level}`, "live", `level-${level}-step-${level}`, 1000);
}
database.exec(
  `UPDATE pattern_results SET level_number = CAST(substr(pattern_id, 7, 1) AS INTEGER) WHERE session_id = 'live'`,
);
database.exec(`UPDATE game_sessions SET session_status = ${SESSION_STATUS_SQL} WHERE id = 'live'`);
assert.equal(sessionRow("live").session_status, "completed");

// Deleting a profile removes its history.
database.exec("DELETE FROM profiles WHERE id = 'bima'");
assert.equal(database.prepare("SELECT COUNT(*) AS n FROM game_sessions").get().n, 0);
assert.equal(countResults(), 0);

console.log("OK: progress stats, chart axes and database migration");

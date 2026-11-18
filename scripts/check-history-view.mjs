#!/usr/bin/env node
// Self-check for the history grouping, badges and filters on synthetic sessions.
// Run: node --no-warnings scripts/check-history-view.mjs
import assert from "node:assert/strict";

import { buildHistoryRows, groupTitle, listMonths, monthLabel } from "../src/utils/historyView.ts";

const NOW = new Date(2026, 10, 18, 12, 0).getTime();
const DAY = 86_400_000;
const make = (id, daysBefore, totalSeconds, overrides = {}) => ({
  id,
  profileId: "p",
  gameMode: "test",
  startedAt: NOW - daysBefore * DAY - 1000,
  finishedAt: NOW - daysBefore * DAY,
  totalDurationMs: totalSeconds * 1000,
  completedPatterns: 8,
  verificationMethod: "manual_completion",
  patternSetId: "x",
  sessionStatus: "completed",
  patterns: [],
  ...overrides,
});
const sessions = [
  make("a", 20, 240), // oldest, first record
  make("b", 9, 300), // slower, no record
  make("c", 3, 200), // faster + record
  make("d", 1, 210), // slower
  make("e", 0, 150), // faster + record, today
];
const sessionRows = (rows) => rows.filter((row) => row.type === "session");
const badgesOf = (rows, id) => sessionRows(rows).find((row) => row.session.id === id).badges;

const all = buildHistoryRows(sessions, "all", NOW);
assert.deepEqual(
  all.filter((row) => row.type === "header").map((row) => row.title),
  ["Hari ini", "Kemarin", "Minggu ini", "Lebih lama"],
);
assert.deepEqual(sessionRows(all).map((row) => row.session.id), ["e", "d", "c", "b", "a"]);
assert.deepEqual(badgesOf(all, "a"), ["record"]);
assert.deepEqual(badgesOf(all, "b"), ["slower"]);
assert.deepEqual(badgesOf(all, "c"), ["record", "faster"]);
assert.deepEqual(badgesOf(all, "d"), ["slower"]);
assert.deepEqual(badgesOf(all, "e"), ["record", "faster"]);

// Filters hide rows but never change which sessions held a record.
assert.deepEqual(
  sessionRows(buildHistoryRows(sessions, "week", NOW)).map((row) => row.session.id),
  ["e", "d", "c"],
);
assert.deepEqual(
  sessionRows(buildHistoryRows(sessions, "record", NOW)).map((row) => row.session.id),
  ["e", "c", "a"],
);

// Month filter: only that month, under one header with the month's name.
const october = make("o", 40, 230, { finishedAt: new Date(2026, 9, 5, 10).getTime() });
const monthSessions = [...sessions, october];
// Every month, not only those with sessions: January to the current month.
const months2026 = listMonths(monthSessions, NOW);
assert.equal(months2026.length, 11);
assert.deepEqual([months2026[0], months2026[10]], ["2026-11", "2026-01"]);
const old2025 = make("y", 0, 100, { finishedAt: new Date(2025, 5, 1).getTime() });
const withYear = listMonths([old2025, ...sessions], NOW);
assert.equal(withYear.length, 23);
assert.deepEqual([withYear[0], withYear[10], withYear[11], withYear[22]], ["2026-11", "2026-01", "2025-12", "2025-01"]);
assert.equal(listMonths([], NOW).length, 11);
assert.equal(monthLabel("2025-12"), "Desember 2025");
const octoberRows = buildHistoryRows(monthSessions, "month:2026-10", NOW);
// "a" was played on 29 October, so October holds it and "o", newest first.
assert.deepEqual(octoberRows.map((row) => row.title ?? row.session.id), ["Oktober 2026", "a", "o"]);
assert.equal(monthLabel("2026-10"), "Oktober 2026");
// A month with no sessions gives no rows; the page shows a message for it.
assert.equal(buildHistoryRows(monthSessions, "month:2026-03", NOW).length, 0);

// Unfinished sessions are listed but never compared.
const partial = make("p", 0, 10, { sessionStatus: "partial" });
assert.deepEqual(badgesOf(buildHistoryRows([...sessions, partial], "all", NOW), "p"), []);
assert.equal(groupTitle(NOW, NOW), "Hari ini");
assert.deepEqual(buildHistoryRows([], "all", NOW), []);

console.log("OK: history grouping, badges and filters");

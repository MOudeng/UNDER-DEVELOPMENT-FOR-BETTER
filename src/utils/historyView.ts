import type { SessionWithPatterns } from "../types/localProfiles";

export type HistoryBadge = "record" | "faster" | "slower";
export type HistoryFilter = "all" | "week" | "record" | `month:${string}`;
export type HistoryRow =
  | { type: "header"; title: string }
  | { type: "session"; session: SessionWithPatterns; badges: HistoryBadge[] };

const DAY_MS = 86_400_000;

const startOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const daysAgo = (timestamp: number, now: number) =>
  Math.round((startOfDay(now) - startOfDay(timestamp)) / DAY_MS);

const playedAt = (session: SessionWithPatterns) => session.finishedAt ?? session.startedAt;

/** "2026-10": the month a session was played in, by the device's local time. */
const monthKey = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
};

/** Every month from January of the first session's year to now, newest first. */
export const listMonths = (sessions: SessionWithPatterns[], now = Date.now()) => {
  const times = [now, ...sessions.map(playedAt)];
  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));
  const keys: string[] = [];
  for (
    let year = last.getFullYear(), month = last.getMonth();
    year > first.getFullYear() || month >= 0;
    month--
  ) {
    if (month < 0) {
      year--;
      month = 11;
    }
    keys.push(`${year}-${String(month + 1).padStart(2, "0")}`);
    if (year === first.getFullYear() && month === 0) break;
  }
  return keys;
};

export const groupTitle = (timestamp: number, now: number) => {
  const days = daysAgo(timestamp, now);
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  return days < 7 ? "Minggu ini" : "Lebih lama";
};

// Test sessions have the same length, so totals compare. Practice sessions vary,
// so they compare by time per pattern. Unfinished and legacy sessions do not compare.
const comparableValue = (session: SessionWithPatterns) => {
  if (session.finishedAt === null || session.completedPatterns <= 0) return null;
  if (session.gameMode === "test") {
    return session.sessionStatus === "completed" ? session.totalDurationMs : null;
  }
  return session.gameMode === "practice"
    ? session.totalDurationMs / session.completedPatterns
    : null;
};

/** Record = faster than everything before it; trend = against the previous session. */
const getBadges = (sessions: SessionWithPatterns[]) => {
  const badges = new Map<string, HistoryBadge[]>();
  let best = Infinity;
  let previous: number | null = null;
  [...sessions]
    .sort((a, b) => playedAt(a) - playedAt(b))
    .forEach((session) => {
      const value = comparableValue(session);
      if (value === null) return;
      const own: HistoryBadge[] = [];
      if (value < best) own.push("record");
      if (previous !== null && value < previous) own.push("faster");
      if (previous !== null && value > previous) own.push("slower");
      badges.set(session.id, own);
      best = Math.min(best, value);
      previous = value;
    });
  return badges;
};

/** Newest first, grouped under day headers. Badges use the full history, not the filter. */
export const buildHistoryRows = (
  sessions: SessionWithPatterns[],
  filter: HistoryFilter,
  now = Date.now(),
): HistoryRow[] => {
  const badges = getBadges(sessions);
  const rows: HistoryRow[] = [];
  let lastTitle = "";
  [...sessions]
    .sort((a, b) => playedAt(b) - playedAt(a))
    .forEach((session) => {
      const own = badges.get(session.id) ?? [];
      if (filter === "week" && daysAgo(playedAt(session), now) >= 7) return;
      if (filter === "record" && !own.includes("record")) return;
      const selectedMonth = filter.startsWith("month:") ? filter.slice(6) : null;
      if (selectedMonth && monthKey(playedAt(session)) !== selectedMonth) return;
      const title = selectedMonth
        ? monthLabel(selectedMonth)
        : groupTitle(playedAt(session), now);
      if (title !== lastTitle) {
        rows.push({ type: "header", title });
        lastTitle = title;
      }
      rows.push({ type: "session", session, badges: own });
    });
  return rows;
};

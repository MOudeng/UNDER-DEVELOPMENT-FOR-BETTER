import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import * as SQLite from "expo-sqlite";

import type { GamePerformance } from "../types/gamePerformance";
import type {
  AvatarId,
  LocalGameSession,
  LocalPatternResult,
  PlayerProfile,
  ProfileInput,
  ProfileStatistics,
  SessionWithPatterns,
} from "../types/localProfiles";
import {
  BACKFILL_PROGRESS_SQL,
  PATTERN_SET_ID,
  SESSION_STATUS_SQL,
} from "../utils/progressStats";

const DATABASE_NAME = "brainblock.db";
const DATABASE_VERSION = 4;
const LAST_PROFILE_KEY = "last_profile_id";
const LEGACY_MIGRATION_KEY = "legacy_async_storage_migrated";

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_id: AvatarId;
  avatar_file: string | null;
  age: number | null;
  school_name: string | null;
  created_at: number;
};

type SessionRow = {
  id: string;
  profile_id: string;
  game_mode: LocalGameSession["gameMode"];
  started_at: number;
  finished_at: number | null;
  total_duration_ms: number;
  completed_patterns: number;
  verification_method: string;
  pattern_set_id: string | null;
  session_status: LocalGameSession["sessionStatus"];
};

type PatternRow = {
  id: string;
  session_id: string;
  pattern_id: string;
  level_number: number | null;
  pattern_variant: string | null;
  duration_ms: number;
  completion_status: LocalPatternResult["completionStatus"];
};

type LegacyUser = {
  id?: string;
  name?: string;
  createdAt?: number | string;
};

type LegacyTestSession = {
  id?: string;
  totalTimeSeconds?: number;
  completedAt?: number;
};

const parseArray = <T>(value: string | null): T[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const parseObject = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as T) : null;
  } catch {
    return null;
  }
};

const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const normalizeDuration = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;

const avatarDirectory = () => new Directory(Paths.document, "avatars");

const avatarUriFor = (fileName: string | null) =>
  fileName ? new File(avatarDirectory(), fileName).uri : null;

// Picker results sit in a cache the OS may clear, so keep our own copy.
const storeAvatarPhoto = (sourceUri: string) => {
  const directory = avatarDirectory();
  directory.create({ idempotent: true, intermediates: true });
  const source = new File(sourceUri);
  const fileName = `${createId("avatar")}${source.extension}`;
  source.copy(new File(directory, fileName));
  return fileName;
};

const deleteAvatarPhoto = (fileName: string | null) => {
  if (!fileName) return;
  try {
    new File(avatarDirectory(), fileName).delete();
  } catch (error) {
    // The profile change already succeeded; a stray file costs only disk space.
    console.warn("Foto profil lama gagal dihapus", error);
  }
};

const mapProfile = (row: ProfileRow): PlayerProfile => ({
  id: row.id,
  displayName: row.display_name,
  avatarId: row.avatar_id,
  avatarUri: avatarUriFor(row.avatar_file),
  age: row.age,
  schoolName: row.school_name,
  createdAt: row.created_at,
});

const normalizeProfileInput = (input: ProfileInput) => {
  const displayName = input.displayName.trim();
  const schoolName = input.schoolName?.trim() || null;
  const age = input.age == null ? null : Math.round(input.age);

  if (!displayName || displayName.length > 30) {
    throw new Error("Nama panggilan harus berisi 1 sampai 30 karakter.");
  }
  if (age !== null && (!Number.isFinite(age) || age < 1 || age > 120)) {
    throw new Error("Umur harus berupa angka antara 1 sampai 120 tahun.");
  }
  if (schoolName && schoolName.length > 80) {
    throw new Error("Asal sekolah maksimal 80 karakter.");
  }

  return { displayName, avatarId: input.avatarId, age, schoolName };
};

const mapSession = (row: SessionRow): LocalGameSession => ({
  id: row.id,
  profileId: row.profile_id,
  gameMode: row.game_mode,
  startedAt: row.started_at,
  finishedAt: row.finished_at,
  totalDurationMs: row.total_duration_ms,
  completedPatterns: row.completed_patterns,
  verificationMethod: row.verification_method,
  patternSetId: row.pattern_set_id,
  sessionStatus: row.session_status,
});

class LocalDatabaseService {
  private databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

  private async getDatabase() {
    if (!this.databasePromise) {
      this.databasePromise = this.openAndMigrate().catch((error) => {
        this.databasePromise = null;
        throw error;
      });
    }
    return this.databasePromise;
  }

  private async openAndMigrate() {
    const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await database.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

    const versionRow = await database.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    const currentVersion = versionRow?.user_version ?? 0;

    if (currentVersion < DATABASE_VERSION) {
      if (currentVersion < 1) {
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY NOT NULL,
            display_name TEXT NOT NULL CHECK(length(trim(display_name)) BETWEEN 1 AND 30),
            avatar_id TEXT NOT NULL,
            created_at INTEGER NOT NULL
          );

          CREATE TABLE IF NOT EXISTS game_sessions (
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

          CREATE TABLE IF NOT EXISTS pattern_results (
            id TEXT PRIMARY KEY NOT NULL,
            session_id TEXT NOT NULL,
            pattern_id TEXT NOT NULL,
            duration_ms INTEGER NOT NULL CHECK(duration_ms >= 0),
            completion_status TEXT NOT NULL,
            FOREIGN KEY(session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
            UNIQUE(session_id, pattern_id)
          );

          CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT
          );

          CREATE INDEX IF NOT EXISTS idx_game_sessions_profile
            ON game_sessions(profile_id, started_at DESC);
          CREATE INDEX IF NOT EXISTS idx_pattern_results_session
            ON pattern_results(session_id);
          PRAGMA user_version = 1;
        `);
      }

      if (currentVersion < 2) {
        const profileColumns = await database.getAllAsync<{ name: string }>(
          "PRAGMA table_info(profiles)",
        );
        const columnNames = new Set(profileColumns.map((column) => column.name));
        if (!columnNames.has("age")) {
          await database.execAsync(
            `ALTER TABLE profiles ADD COLUMN age INTEGER
             CHECK(age IS NULL OR age BETWEEN 1 AND 120)`,
          );
        }
        if (!columnNames.has("school_name")) {
          await database.execAsync(
            `ALTER TABLE profiles ADD COLUMN school_name TEXT
             CHECK(school_name IS NULL OR length(school_name) <= 80)`,
          );
        }
        await database.execAsync("PRAGMA user_version = 2");
      }

      if (currentVersion < 3) {
        const profileColumns = await database.getAllAsync<{ name: string }>(
          "PRAGMA table_info(profiles)",
        );
        if (!profileColumns.some((column) => column.name === "avatar_file")) {
          await database.execAsync("ALTER TABLE profiles ADD COLUMN avatar_file TEXT");
        }
        await database.execAsync("PRAGMA user_version = 3");
      }

      if (currentVersion < 4) {
        const addColumn = async (table: string, column: string, type: string) => {
          const columns = await database.getAllAsync<{ name: string }>(
            `PRAGMA table_info(${table})`,
          );
          if (!columns.some(({ name }) => name === column)) {
            await database.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
          }
        };
        await addColumn("game_sessions", "pattern_set_id", "TEXT");
        await addColumn(
          "game_sessions",
          "session_status",
          "TEXT NOT NULL DEFAULT 'in_progress'",
        );
        await addColumn("pattern_results", "level_number", "INTEGER");
        await addColumn("pattern_results", "pattern_variant", "TEXT");
        await addColumn("pattern_results", "verification_method", "TEXT");
        await database.execAsync(BACKFILL_PROGRESS_SQL);
        await database.execAsync("PRAGMA user_version = 4");
      }
    }

    await this.migrateLegacyStorage(database);
    await database.runAsync(
      "DELETE FROM game_sessions WHERE finished_at IS NULL",
    );
    return database;
  }

  private async migrateLegacyStorage(database: SQLite.SQLiteDatabase) {
    const migration = await database.getFirstAsync<{ value: string | null }>(
      "SELECT value FROM app_settings WHERE key = ?",
      LEGACY_MIGRATION_KEY,
    );
    if (migration?.value === "1") return;

    const rawUsers = await AsyncStorage.getItem("@users");
    const rawCurrentUser =
      (await AsyncStorage.getItem("@current_user")) ??
      (await AsyncStorage.getItem("@auth_user"));

    const parsedUsers = parseArray<LegacyUser>(rawUsers);
    const currentUser = parseObject<LegacyUser>(rawCurrentUser);
    const usersById = new Map<string, LegacyUser>();

    for (const user of [...parsedUsers, ...(currentUser ? [currentUser] : [])]) {
      if (typeof user.id === "string" && user.id.trim()) {
        usersById.set(user.id, user);
      }
    }

    await database.withTransactionAsync(async () => {
      for (const [userId, user] of usersById) {
        const displayName = (user.name || "Pemain Lama").trim().slice(0, 30);
        const createdAtValue =
          typeof user.createdAt === "number"
            ? user.createdAt
            : Date.parse(user.createdAt || "");
        const createdAt = Number.isFinite(createdAtValue) ? createdAtValue : Date.now();

        await database.runAsync(
          `INSERT OR IGNORE INTO profiles(id, display_name, avatar_id, created_at)
           VALUES (?, ?, ?, ?)`,
          userId,
          displayName || "Pemain Lama",
          "puzzle",
          createdAt,
        );

        const rawHistory = await AsyncStorage.getItem(`@game_performance_${userId}`);
        const history = parseArray<GamePerformance>(rawHistory);

        for (const performance of history) {
          const duration = normalizeDuration(performance.completionTime ?? 0);
          const finishedAt = normalizeDuration(performance.timestamp || Date.now());
          const legacyPerformanceId = performance.id || createId("legacy");
          const sessionId = `legacy_performance_${legacyPerformanceId}`;
          await database.runAsync(
            `INSERT OR IGNORE INTO game_sessions(
              id, profile_id, game_mode, started_at, finished_at,
              total_duration_ms, completed_patterns, verification_method
            ) VALUES (?, ?, 'legacy', ?, ?, ?, 1, 'legacy_async_storage')`,
            sessionId,
            userId,
            Math.max(0, finishedAt - duration),
            finishedAt,
            duration,
          );
          await database.runAsync(
            `INSERT OR IGNORE INTO pattern_results(
              id, session_id, pattern_id, duration_ms, completion_status
            ) VALUES (?, ?, ?, ?, ?)`,
            `legacy_result_${legacyPerformanceId}`,
            sessionId,
            `level-${performance.levelNumber}`,
            duration,
            performance.completed ? "completed" : "failed",
          );
        }

        const rawTestSessions = await AsyncStorage.getItem(
          `@completed_test_sessions_${userId}`,
        );
        const testSessions = parseArray<LegacyTestSession>(rawTestSessions);
        for (const testSession of testSessions) {
          const totalDuration = normalizeDuration(
            (testSession.totalTimeSeconds ?? 0) * 1000,
          );
          const finishedAt = normalizeDuration(testSession.completedAt ?? Date.now());
          const legacySessionId = testSession.id || createId("legacy_test");
          await database.runAsync(
            `INSERT OR IGNORE INTO game_sessions(
              id, profile_id, game_mode, started_at, finished_at,
              total_duration_ms, completed_patterns, verification_method
            ) VALUES (?, ?, 'test', ?, ?, ?, 8, 'legacy_async_storage')`,
            `legacy_test_${legacySessionId}`,
            userId,
            Math.max(0, finishedAt - totalDuration),
            finishedAt,
            totalDuration,
          );
        }
      }

      if (currentUser?.id && usersById.has(currentUser.id)) {
        await database.runAsync(
          `INSERT INTO app_settings(key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          LAST_PROFILE_KEY,
          currentUser.id,
        );
      }

      await database.runAsync(
        `INSERT INTO app_settings(key, value) VALUES (?, '1')
         ON CONFLICT(key) DO UPDATE SET value = '1'`,
        LEGACY_MIGRATION_KEY,
      );
    });
  }

  async initialize() {
    await this.getDatabase();
  }

  async listProfiles() {
    const database = await this.getDatabase();
    const rows = await database.getAllAsync<ProfileRow>(
      "SELECT * FROM profiles ORDER BY created_at ASC",
    );
    return rows.map(mapProfile);
  }

  async getProfile(profileId: string) {
    const database = await this.getDatabase();
    const row = await database.getFirstAsync<ProfileRow>(
      "SELECT * FROM profiles WHERE id = ?",
      profileId,
    );
    return row ? mapProfile(row) : null;
  }

  async createProfile(input: ProfileInput) {
    const database = await this.getDatabase();
    const normalized = normalizeProfileInput(input);
    const avatarFile = input.avatarUri ? storeAvatarPhoto(input.avatarUri) : null;

    const profile: PlayerProfile = {
      id: createId("profile"),
      displayName: normalized.displayName,
      avatarId: normalized.avatarId,
      avatarUri: avatarUriFor(avatarFile),
      age: normalized.age,
      schoolName: normalized.schoolName,
      createdAt: Date.now(),
    };
    await database.runAsync(
      `INSERT INTO profiles(
        id, display_name, avatar_id, avatar_file, age, school_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      profile.id,
      profile.displayName,
      profile.avatarId,
      avatarFile,
      profile.age,
      profile.schoolName,
      profile.createdAt,
    );
    return profile;
  }

  async updateProfile(profileId: string, input: ProfileInput) {
    const database = await this.getDatabase();
    const normalized = normalizeProfileInput(input);
    const current = await database.getFirstAsync<ProfileRow>(
      "SELECT * FROM profiles WHERE id = ?",
      profileId,
    );
    if (!current) throw new Error("Profil tidak ditemukan.");

    const nextAvatarUri = input.avatarUri ?? null;
    const photoChanged = nextAvatarUri !== avatarUriFor(current.avatar_file);
    let avatarFile = current.avatar_file;
    if (photoChanged) {
      avatarFile = nextAvatarUri ? storeAvatarPhoto(nextAvatarUri) : null;
    }

    const result = await database.runAsync(
      `UPDATE profiles
       SET display_name = ?, avatar_id = ?, avatar_file = ?, age = ?, school_name = ?
       WHERE id = ?`,
      normalized.displayName,
      normalized.avatarId,
      avatarFile,
      normalized.age,
      normalized.schoolName,
      profileId,
    );
    if (result.changes !== 1) throw new Error("Profil tidak ditemukan.");
    if (photoChanged) deleteAvatarPhoto(current.avatar_file);
    return this.getProfile(profileId);
  }

  async deleteProfile(profileId: string) {
    const database = await this.getDatabase();
    const current = await database.getFirstAsync<ProfileRow>(
      "SELECT * FROM profiles WHERE id = ?",
      profileId,
    );
    await database.withTransactionAsync(async () => {
      await database.runAsync(
        "UPDATE app_settings SET value = NULL WHERE key = ? AND value = ?",
        LAST_PROFILE_KEY,
        profileId,
      );
      await database.runAsync("DELETE FROM profiles WHERE id = ?", profileId);
    });
    deleteAvatarPhoto(current?.avatar_file ?? null);
  }

  async getLastProfileId() {
    const database = await this.getDatabase();
    const row = await database.getFirstAsync<{ value: string | null }>(
      "SELECT value FROM app_settings WHERE key = ?",
      LAST_PROFILE_KEY,
    );
    return row?.value ?? null;
  }

  async setLastProfileId(profileId: string | null) {
    const database = await this.getDatabase();
    await database.runAsync(
      `INSERT INTO app_settings(key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      LAST_PROFILE_KEY,
      profileId,
    );
  }

  async getSetting(key: string) {
    const database = await this.getDatabase();
    const row = await database.getFirstAsync<{ value: string | null }>(
      "SELECT value FROM app_settings WHERE key = ?",
      key,
    );
    return row?.value ?? null;
  }

  async setSetting(key: string, value: string) {
    const database = await this.getDatabase();
    await database.runAsync(
      `INSERT INTO app_settings(key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value,
    );
  }

  async beginGameSession(
    profileId: string,
    gameMode: "test" | "practice",
    verificationMethod: string,
  ) {
    const database = await this.getDatabase();
    const sessionId = createId("session");
    await database.runAsync(
      `INSERT INTO game_sessions(
        id, profile_id, game_mode, started_at, total_duration_ms,
        completed_patterns, verification_method, pattern_set_id
      ) VALUES (?, ?, ?, ?, 0, 0, ?, ?)`,
      sessionId,
      profileId,
      gameMode,
      Date.now(),
      verificationMethod,
      PATTERN_SET_ID,
    );
    return sessionId;
  }

  async savePatternResult({
    sessionId,
    patternId,
    levelNumber,
    patternVariant,
    durationMs,
    completionStatus = "completed",
    replaceExisting = false,
  }: {
    sessionId: string;
    patternId: string;
    levelNumber: number;
    patternVariant: string;
    durationMs: number;
    completionStatus?: LocalPatternResult["completionStatus"];
    replaceExisting?: boolean;
  }) {
    const database = await this.getDatabase();
    const safeDuration = normalizeDuration(durationMs);
    await database.withTransactionAsync(async () => {
      const columns = `pattern_results(
        id, session_id, pattern_id, level_number, pattern_variant,
        duration_ms, completion_status, verification_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?,
        (SELECT verification_method FROM game_sessions WHERE id = ?)
      )`;
      const insertStatement = replaceExisting
        ? `INSERT INTO ${columns}
          ON CONFLICT(session_id, pattern_id) DO UPDATE SET
            duration_ms = excluded.duration_ms,
            completion_status = excluded.completion_status`
        : `INSERT OR IGNORE INTO ${columns}`;
      await database.runAsync(
        insertStatement,
        createId("result"),
        sessionId,
        patternId,
        levelNumber,
        patternVariant,
        safeDuration,
        completionStatus,
        sessionId,
      );
      await database.runAsync(
        `UPDATE game_sessions
         SET completed_patterns = (
           SELECT COUNT(*) FROM pattern_results
           WHERE session_id = ? AND completion_status = 'completed'
         )
         WHERE id = ?`,
        sessionId,
        sessionId,
      );
    });
  }

  async finishGameSession(sessionId: string, totalDurationMs: number) {
    const database = await this.getDatabase();
    await database.runAsync(
      `UPDATE game_sessions
       SET finished_at = COALESCE(finished_at, ?),
           total_duration_ms = CASE
             WHEN finished_at IS NULL THEN ?
             ELSE total_duration_ms
           END,
           session_status = ${SESSION_STATUS_SQL}
       WHERE id = ?`,
      Date.now(),
      normalizeDuration(totalDurationMs),
      sessionId,
    );
  }

  async cancelGameSession(sessionId: string) {
    const database = await this.getDatabase();
    await database.runAsync(
      "DELETE FROM game_sessions WHERE id = ? AND finished_at IS NULL",
      sessionId,
    );
  }

  async getProfileHistory(
    profileId: string,
    gameMode?: LocalGameSession["gameMode"],
  ) {
    const database = await this.getDatabase();
    const mode = gameMode ?? null;
    const rows = await database.getAllAsync<SessionRow>(
      `SELECT * FROM game_sessions
       WHERE profile_id = ? AND finished_at IS NOT NULL
         AND (? IS NULL OR game_mode = ?)
       ORDER BY finished_at DESC`,
      profileId,
      mode,
      mode,
    );
    return rows.map(mapSession);
  }

  async getSessionsWithPatterns(
    profileId: string,
    gameMode: LocalGameSession["gameMode"],
  ): Promise<SessionWithPatterns[]> {
    const sessions = await this.getProfileHistory(profileId, gameMode);
    return Promise.all(
      sessions.map(async (session) => ({
        ...session,
        patterns: await this.getPatternResults(session.id),
      })),
    );
  }

  async getPatternResults(sessionId: string) {
    const database = await this.getDatabase();
    const rows = await database.getAllAsync<PatternRow>(
      "SELECT * FROM pattern_results WHERE session_id = ? ORDER BY rowid ASC",
      sessionId,
    );
    return rows.map<LocalPatternResult>((row) => ({
      id: row.id,
      sessionId: row.session_id,
      patternId: row.pattern_id,
      levelNumber: row.level_number,
      patternVariant: row.pattern_variant,
      durationMs: row.duration_ms,
      completionStatus: row.completion_status,
    }));
  }

  async getProfileStatistics(
    profileId: string,
    gameMode: "test" | "practice",
  ): Promise<ProfileStatistics> {
    const database = await this.getDatabase();
    const row = await database.getFirstAsync<{
      completed_sessions: number;
      fastest_duration_ms: number | null;
      average_duration_ms: number | null;
    }>(
      `SELECT
        COUNT(*) AS completed_sessions,
        MIN(total_duration_ms) AS fastest_duration_ms,
        AVG(total_duration_ms) AS average_duration_ms
       FROM game_sessions
       WHERE profile_id = ? AND game_mode = ?
         AND finished_at IS NOT NULL AND completed_patterns > 0`,
      profileId,
      gameMode,
    );
    return {
      completedSessions: row?.completed_sessions ?? 0,
      fastestDurationMs: row?.fastest_duration_ms ?? null,
      averageDurationMs:
        row?.average_duration_ms == null ? null : Math.round(row.average_duration_ms),
    };
  }
}

export default new LocalDatabaseService();

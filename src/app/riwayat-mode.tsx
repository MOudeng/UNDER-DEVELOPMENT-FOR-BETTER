import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SessionCard from "../components/SessionCard";
import { useProfiles } from "../context/ProfileContext";
import LocalDatabaseService from "../services/LocalDatabaseService";
import type {
  LocalGameSession,
  SessionWithPatterns,
} from "../types/localProfiles";
import { formatClock } from "../utils/progressStats";

type HistoryMode = LocalGameSession["gameMode"];
type Stat = { label: string; durationMs: number | null };

const MODE_INFO: Record<HistoryMode, { title: string; color: string }> = {
  test: { title: "Riwayat Mode Test", color: "#f45023" },
  practice: { title: "Riwayat Mode Practice", color: "#2563eb" },
  legacy: { title: "Riwayat Lama", color: "#6b5a57" },
};

const loadStats = async (
  mode: HistoryMode,
  profileId: string,
  entries: SessionWithPatterns[],
): Promise<Stat[]> => {
  if (mode === "test") {
    const stats = await LocalDatabaseService.getProfileStatistics(profileId, "test");
    return [
      { label: "Rekor", durationMs: stats.fastestDurationMs },
      { label: "Rata-rata", durationMs: stats.averageDurationMs },
    ];
  }
  if (mode === "practice") {
    // Practice sessions vary in length, so totals cannot be compared; patterns can.
    const durations = entries.flatMap((entry) =>
      entry.patterns.map((pattern) => pattern.durationMs),
    );
    return [
      {
        label: "Pola tercepat",
        durationMs: durations.length > 0 ? Math.min(...durations) : null,
      },
      {
        label: "Rata-rata per pola",
        durationMs:
          durations.length > 0
            ? durations.reduce((total, value) => total + value, 0) / durations.length
            : null,
      },
    ];
  }
  return [];
};

export default function RiwayatModePage() {
  const { activeProfile } = useProfiles();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: HistoryMode }>();
  const mode: HistoryMode =
    modeParam && modeParam in MODE_INFO ? modeParam : "test";
  const { title, color } = MODE_INFO[mode];

  const [history, setHistory] = useState<SessionWithPatterns[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!activeProfile) {
      setHistory([]);
      setStats([]);
      return;
    }

    try {
      setError(null);
      const entries = await LocalDatabaseService.getSessionsWithPatterns(
        activeProfile.id,
        mode,
      );
      setHistory(entries);
      setStats(await loadStats(mode, activeProfile.id, entries));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Riwayat gagal dimuat. Silakan coba lagi.",
      );
    }
  }, [activeProfile, mode]);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color }]}>{title}</Text>
          <Text style={styles.profileName}>
            {activeProfile?.displayName ?? "Pemain"}
          </Text>
        </View>

        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            history.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.statsSection}>
              {stats.length > 0 ? (
                <View style={styles.statsCard}>
                  <Text style={styles.statsMeta}>{history.length} sesi selesai</Text>
                  <View style={styles.statsRow}>
                    {stats.map((stat) => (
                      <View key={stat.label}>
                        <Text style={styles.statsLabel}>{stat.label}</Text>
                        <Text style={styles.statsValue}>
                          {formatClock(stat.durationMs)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Belum ada riwayat di sini</Text>
              <Text style={styles.emptyText}>
                Yuk, selesaikan satu permainan. Hasilnya akan tampil di sini.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              profileName={activeProfile?.displayName ?? "Pemain"}
            />
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f6f6" },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#f45023",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 18,
  },
  backButtonText: { color: "#FFFFFF", fontWeight: "700" },
  title: { fontSize: 25, fontWeight: "900" },
  profileName: { color: "#6b5a57", fontSize: 13, marginTop: 2 },
  listContent: { padding: 20, gap: 14 },
  emptyListContent: { flexGrow: 1 },
  statsSection: { gap: 10 },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ead8d4",
  },
  statsMeta: { color: "#8f7772", fontSize: 11 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 10,
  },
  statsLabel: { color: "#999", fontSize: 11 },
  statsValue: { color: "#5d3f3c", fontSize: 18, fontWeight: "900", marginTop: 2 },
  errorText: { color: "#b91c1c", backgroundColor: "#fee2e2", padding: 10 },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ead8d4",
    marginTop: 14,
  },
  emptyTitle: { color: "#5d3f3c", fontSize: 18, fontWeight: "800" },
  emptyText: { color: "#796662", textAlign: "center", lineHeight: 20, marginTop: 8 },
});

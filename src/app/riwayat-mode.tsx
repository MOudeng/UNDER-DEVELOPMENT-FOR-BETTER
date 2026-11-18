import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  Modal,
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
import {
  buildHistoryRows,
  type HistoryFilter,
  listMonths,
  monthLabel,
} from "../utils/historyView";
import { formatClock } from "../utils/progressStats";
import BlockBackground from "../components/BlockBackground";

type HistoryMode = LocalGameSession["gameMode"];
type Stat = { label: string; durationMs: number | null };

const FILTERS: { value: HistoryFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "week", label: "Minggu ini" },
  { value: "record", label: "⭐ Rekor" },
];

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
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const rows = buildHistoryRows(history, filter);
  const [monthSheetOpen, setMonthSheetOpen] = useState(false);
  const activeMonth = filter.startsWith("month:") ? filter.slice(6) : null;

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
      <BlockBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Kembali</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.title, { color }]}>{title}</Text>
          <Text style={styles.profileName}>
            {activeProfile?.displayName ?? "Pemain"}
          </Text>
        </View>

        <FlatList
          data={rows}
          keyExtractor={(row) => (row.type === "header" ? `h-${row.title}` : row.session.id)}
          contentContainerStyle={[
            styles.listContent,
            rows.length === 0 && styles.emptyListContent,
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
              {history.length > 0 ? (
                <>
                  <View style={styles.chipRow}>
                    {FILTERS.map((item) => (
                      <Pressable
                        key={item.value}
                        accessibilityRole="button"
                        accessibilityState={{ selected: filter === item.value }}
                        onPress={() => setFilter(item.value)}
                        style={[styles.chip, filter === item.value && styles.chipSelected]}
                      >
                        <Text
                          style={[styles.chipText, filter === item.value && styles.chipTextSelected]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    ))}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: activeMonth !== null }}
                      onPress={() => setMonthSheetOpen(true)}
                      style={[styles.chip, activeMonth !== null && styles.chipSelected]}
                    >
                      <Text
                        style={[styles.chipText, activeMonth !== null && styles.chipTextSelected]}
                      >
                        {activeMonth ? monthLabel(activeMonth) : "Pilih bulan"} ▾
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : null}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {history.length === 0
                  ? "Belum ada riwayat di sini"
                  : filter.startsWith("month:")
                    ? `Tidak ada sesi di ${monthLabel(filter.slice(6))}`
                    : "Tidak ada sesi untuk filter ini"}
              </Text>
              <Text style={styles.emptyText}>
                {history.length === 0
                  ? "Yuk, selesaikan satu permainan. Hasilnya akan tampil di sini."
                  : filter.startsWith("month:")
                    ? "Tidak ada sesi permainan yang dimainkan pada bulan ini."
                    : "Coba pilih filter \"Semua\"."}
              </Text>
            </View>
          }
          renderItem={({ item }) =>
            item.type === "header" ? (
              <Text style={styles.groupTitle}>{item.title}</Text>
            ) : (
              <SessionCard
                session={item.session}
                badges={item.badges}
                profileName={activeProfile?.displayName ?? "Pemain"}
              />
            )
          }
        />
      </SafeAreaView>

      <Modal
        visible={monthSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMonthSheetOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMonthSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Pilih Bulan</Text>
            <FlatList
              data={listMonths(history)}
              keyExtractor={(key) => key}
              renderItem={({ item: key }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeMonth === key }}
                  onPress={() => {
                    setFilter(`month:${key}`);
                    setMonthSheetOpen(false);
                  }}
                  style={[styles.monthRow, activeMonth === key && styles.monthRowSelected]}
                >
                  <Text
                    style={[styles.monthText, activeMonth === key && styles.monthTextSelected]}
                  >
                    {monthLabel(key)}
                  </Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    maxHeight: "65%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },
  sheetTitle: { color: "#5d3f3c", fontSize: 18, fontWeight: "900", marginBottom: 8 },
  monthRow: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: "center",
  },
  monthRowSelected: { backgroundColor: "#f45023" },
  monthText: { color: "#5d3f3c", fontSize: 16, fontWeight: "700" },
  monthTextSelected: { color: "#FFFFFF" },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f45023",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: "#f45023" },
  chipText: { color: "#c2410c", fontSize: 13, fontWeight: "800" },
  chipTextSelected: { color: "#FFFFFF" },
  groupTitle: { color: "#5d3f3c", fontSize: 15, fontWeight: "900", marginTop: 6 },
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

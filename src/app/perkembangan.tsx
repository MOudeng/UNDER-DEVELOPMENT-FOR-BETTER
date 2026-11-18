import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LineChart from "../components/LineChart";
import { useProfiles } from "../context/ProfileContext";
import LocalDatabaseService from "../services/LocalDatabaseService";
import type { SessionWithPatterns } from "../types/localProfiles";
import {
  compareSessions,
  type CompleteSession,
  describeProgress,
  formatClock,
  getCompleteSessions,
  LEVEL_COUNT,
  levelRangeMs,
  summarizeSessions,
} from "../utils/progressStats";
import BlockBackground from "../components/BlockBackground";

type GameMode = "test" | "practice";

const MODES: { mode: GameMode; label: string }[] = [
  { mode: "test", label: "Test" },
  { mode: "practice", label: "Practice" },
];
const LEVEL_LABELS = Array.from({ length: LEVEL_COUNT }, (_, index) => `${index + 1}`);
const FIRST_COLOR = "#2563eb";
const SECOND_COLOR = "#f45023";

const toSeconds = (milliseconds: number) => milliseconds / 1000;

export default function PerkembanganPage() {
  const { activeProfile } = useProfiles();
  const [mode, setMode] = useState<GameMode>("test");
  const [sessions, setSessions] = useState<SessionWithPatterns[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Indexes into the complete sessions; null means the default first and latest.
  const [firstPick, setFirstPick] = useState<number | null>(null);
  const [secondPick, setSecondPick] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        try {
          const nextSessions = activeProfile
            ? await LocalDatabaseService.getSessionsWithPatterns(activeProfile.id, mode)
            : [];
          if (isActive) {
            setSessions(nextSessions);
            setError(null);
          }
        } catch (loadError) {
          if (isActive) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Data perkembangan gagal dimuat. Silakan coba lagi.",
            );
          }
        }
      };

      void load();

      return () => {
        isActive = false;
      };
    }, [activeProfile, mode]),
  );

  const changeMode = (nextMode: GameMode) => {
    setMode(nextMode);
    setSessions([]);
    setFirstPick(null);
    setSecondPick(null);
  };

  const complete = activeProfile
    ? getCompleteSessions(sessions, activeProfile.id, mode)
    : [];
  const summary = summarizeSessions(complete);
  const lastIndex = complete.length - 1;
  const firstIndex = firstPick !== null && firstPick <= lastIndex ? firstPick : 0;
  const secondIndex =
    secondPick !== null && secondPick <= lastIndex ? secondPick : lastIndex;
  const sessionLabel = (index: number) => {
    if (complete.length === 1) return "Sesi 1";
    if (index === 0) return "Sesi pertama";
    if (index === lastIndex) return "Sesi terbaru";
    return `Sesi ${index + 1}`;
  };

  const renderLevelComparison = () => {
    const first = complete[firstIndex];
    const second = complete[secondIndex];
    const lines: { index: number; session: CompleteSession; color: string; dashed: boolean }[] =
      complete.length === 1
        ? [{ index: 0, session: first, color: SECOND_COLOR, dashed: false }]
        : [
            { index: firstIndex, session: first, color: FIRST_COLOR, dashed: true },
            { index: secondIndex, session: second, color: SECOND_COLOR, dashed: false },
          ];
    const comparison = compareSessions(first, second);

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Perbandingan Waktu per Level</Text>
        <LineChart
          series={lines.map(({ index, session, color, dashed }) => ({
            label: sessionLabel(index),
            color,
            dashed,
            values: session.levelDurationsMs.map(toSeconds),
          }))}
          xLabels={LEVEL_LABELS}
          xTitle="Level"
          unit="detik"
        />

        {complete.length > 2 ? (
          <View style={styles.pickers}>
            {[
              { title: "Garis putus-putus", value: firstIndex, other: secondIndex, pick: setFirstPick },
              { title: "Garis utuh", value: secondIndex, other: firstIndex, pick: setSecondPick },
            ].map(({ title, value, other, pick }) => (
              <View key={title}>
                <Text style={styles.pickerTitle}>{title}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {complete.map((session, index) => (
                    <Pressable
                      key={session.id}
                      disabled={index === other}
                      accessibilityRole="button"
                      accessibilityState={{ selected: index === value, disabled: index === other }}
                      onPress={() => pick(index)}
                      style={[
                        styles.chip,
                        index === value && styles.chipSelected,
                        index === other && styles.chipDisabled,
                      ]}
                    >
                      <Text
                        style={[styles.chipText, index === value && styles.chipTextSelected]}
                      >
                        Sesi {index + 1}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        ) : null}

        {lines.map(({ index, session }) => (
          <Text key={session.id} style={styles.noteText}>
            Rentang waktu {sessionLabel(index)}: {formatClock(levelRangeMs(session))}
          </Text>
        ))}
        <Text style={styles.noteText}>
          Rentang adalah selisih level terlama dan tercepat, bukan skor kemampuan.
        </Text>
        {complete.length > 1 ? (
          <Text style={styles.noteText}>
            Tiap sesi mengambil pola dari bank soal level yang sama, jadi gambarnya
            bisa berbeda antarsesi.
          </Text>
        ) : null}
        {comparison.unrecordedPatternCount > 0 ? (
          <Text style={styles.warningText}>
            Pola yang dipakai pada {comparison.unrecordedPatternCount} dari {LEVEL_COUNT} level
            tidak tercatat karena sesi berasal dari versi aplikasi yang lebih lama.
          </Text>
        ) : null}
        {comparison.verificationDiffers ? (
          <Text style={styles.warningText}>
            Kedua sesi memakai metode verifikasi yang berbeda.
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <BlockBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>Kembali</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Perkembangan Bermain</Text>
              <Text style={styles.profileName}>
                {activeProfile?.displayName ?? "Belum ada profil aktif"}
              </Text>

              <View style={styles.modeRow}>
                {MODES.map((item) => (
                  <Pressable
                    key={item.mode}
                    accessibilityRole="button"
                    accessibilityState={{ selected: mode === item.mode }}
                    onPress={() => changeMode(item.mode)}
                    style={[styles.modeButton, mode === item.mode && styles.chipSelected]}
                  >
                    <Text
                      style={[
                        styles.modeButtonText,
                        mode === item.mode && styles.chipTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Waktu Terbaik</Text>
                  <Text style={styles.summaryValue}>{formatClock(summary.bestMs)}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Sesi Lengkap</Text>
                  <Text style={styles.summaryValue}>{summary.count} Sesi</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Rata-rata Sesi Terbaru</Text>
                  <Text style={styles.summaryValue}>
                    {formatClock(
                      lastIndex >= 0 ? complete[lastIndex].totalDurationMs / LEVEL_COUNT : null,
                    )}
                  </Text>
                </View>
              </View>

              {mode === "practice" ? (
                <Text style={styles.noteText}>
                  Practice tidak berbatas, jadi grafik memakai {LEVEL_COUNT} pola
                  pertama tiap sesi. Sesi yang berhenti sebelum itu tidak dihitung.
                </Text>
              ) : null}

              {complete.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Belum ada sesi lengkap</Text>
                  <Text style={styles.noteText}>
                    Mainkan beberapa sesi lengkap untuk melihat perubahan waktu permainan.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Perkembangan Waktu</Text>
                    <LineChart
                      series={[
                        {
                          label: "Total waktu",
                          color: SECOND_COLOR,
                          values: complete.map((session) =>
                            toSeconds(session.totalDurationMs),
                          ),
                        },
                      ]}
                      xLabels={complete.map((_, index) => `${index + 1}`)}
                      xTitle="Sesi"
                      unit="detik"
                    />
                    {describeProgress(complete).map((line) => (
                      <Text key={line} style={styles.insightText}>
                        {line}
                      </Text>
                    ))}
                  </View>
                  {renderLevelComparison()}
                </>
              )}

              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => router.push({ pathname: "/riwayat-mode", params: { mode } })}
              >
                <Text style={styles.historyButtonText}>Lihat Riwayat Sesi</Text>
              </TouchableOpacity>
            </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f6f6" },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 14 },
  headerContent: { gap: 12 },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#f45023",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  historyButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2563eb",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  historyButtonText: { color: "#2563eb", fontSize: 15, fontWeight: "800" },
  backButtonText: { color: "#FFFFFF", fontWeight: "700" },
  title: { color: "#5d3f3c", fontSize: 26, fontWeight: "900" },
  profileName: { color: "#6b5a57", fontSize: 13 },
  modeRow: { flexDirection: "row", gap: 8 },
  modeButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f45023",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonText: { color: "#c2410c", fontSize: 14, fontWeight: "800" },
  errorText: { color: "#b91c1c", backgroundColor: "#fee2e2", padding: 10 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryCard: {
    flexGrow: 1,
    flexBasis: 96,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ead8d4",
  },
  summaryLabel: { color: "#6b5a57", fontSize: 11 },
  summaryValue: { color: "#5d3f3c", fontSize: 19, fontWeight: "900", marginTop: 3 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ead8d4",
    gap: 8,
  },
  cardTitle: { color: "#5d3f3c", fontSize: 17, fontWeight: "900" },
  noteText: { color: "#6b5a57", fontSize: 12, lineHeight: 18 },
  insightText: { color: "#5d3f3c", fontSize: 13, lineHeight: 19, fontWeight: "700" },
  warningText: {
    color: "#92400e",
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    lineHeight: 18,
  },
  pickers: { gap: 8, marginTop: 4 },
  pickerTitle: { color: "#6b5a57", fontSize: 12, fontWeight: "700", marginBottom: 4 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 12,
    marginRight: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead8d4",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: "#c2410c", borderColor: "#c2410c" },
  chipDisabled: { opacity: 0.4 },
  chipText: { color: "#5d3f3c", fontSize: 12, fontWeight: "700" },
  chipTextSelected: { color: "#FFFFFF" },
});

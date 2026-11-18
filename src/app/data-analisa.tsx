import { router, useLocalSearchParams } from "expo-router";
import { Home, RotateCcw } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProfiles } from "../context/ProfileContext";
import { useCompletionSound } from "../hooks/useCompletionSound";
import LocalDatabaseService from "../services/LocalDatabaseService";
import BlockBackground from "../components/BlockBackground";

// Total waktu (detik) tiap sesi tamu sejak beranda; tidak pernah disimpan.
const guestSessionTotals: number[] = [];

type SessionResult = {
  step: number;
  player1Time: number;
};

type SearchParams = {
  results?: string;
  choice?: "test" | "practice";
};

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

export default function DataAnalisaPage() {
  const { activeProfile, isGuest } = useProfiles();
  const { results: rawResults, choice = "test" } =
    useLocalSearchParams<SearchParams>();
  const playSessionComplete = useCompletionSound("session");
  const hasPlayedSound = useRef(false);

  const results = useMemo<SessionResult[]>(() => {
    if (!rawResults) return [];
    try {
      const parsed: unknown = JSON.parse(rawResults);
      return Array.isArray(parsed) ? (parsed as SessionResult[]) : [];
    } catch {
      return [];
    }
  }, [rawResults]);

  useEffect(() => {
    if (hasPlayedSound.current || results.length === 0) return;
    hasPlayedSound.current = true;
    void playSessionComplete();
  }, [playSessionComplete, results.length]);

  const totalTime = results.reduce(
    (total, result) => total + Math.max(0, result.player1Time),
    0,
  );
  const modeLabel = choice === "practice" ? "Practice / Simulasi" : "Test";
  const [averageSession, setAverageSession] = useState<number | null>(null);
  const recordedRef = useRef(false);

  useEffect(() => {
    if (recordedRef.current || results.length === 0) return;
    recordedRef.current = true;
    if (isGuest) {
      // Tamu: hanya dari sesi "Main Lagi" berturut-turut; direset saat ke beranda.
      guestSessionTotals.push(totalTime);
      setAverageSession(
        guestSessionTotals.reduce((a, b) => a + b, 0) / guestSessionTotals.length,
      );
      return;
    }
    if (!activeProfile) return;
    LocalDatabaseService.getProfileStatistics(activeProfile.id, choice)
      .then((stats) =>
        setAverageSession(
          stats.averageDurationMs === null ? null : stats.averageDurationMs / 1000,
        ),
      )
      .catch(() => setAverageSession(null));
  }, [activeProfile, choice, isGuest, results.length, totalTime]);

  const playingAgainRef = useRef(false);
  // Any exit except "Main Lagi" (home button, system back) ends the guest run.
  useEffect(
    () => () => {
      if (!playingAgainRef.current) guestSessionTotals.length = 0;
    },
    [],
  );

  const playAgain = () => {
    playingAgainRef.current = true;
    router.replace({ pathname: "/gameplay", params: { choice } });
  };

  return (
    <View style={styles.container}>
      <BlockBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Hasil Permainan</Text>
          <Text style={styles.appreciation}>
            Hebat! Kamu berhasil menyelesaikan {results.length} pola.
          </Text>
          {isGuest ? (
            <Text style={styles.guestNote}>
              Mode Tamu: hasil ini tidak disimpan dan hilang setelah halaman ditutup.
            </Text>
          ) : null}

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Profil</Text>
              <Text style={styles.summaryValue}>
                {isGuest
                  ? "Tamu"
                  : activeProfile?.displayName ?? "Profil tidak tersedia"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Mode permainan</Text>
              <Text style={styles.summaryValue}>{modeLabel}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pola selesai</Text>
              <Text style={styles.summaryValue}>{results.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rata-rata per sesi</Text>
              <Text style={styles.summaryValue}>
                {averageSession === null ? "--:--" : formatTime(averageSession)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.lastSummaryRow]}>
              <Text style={styles.summaryLabel}>Total waktu</Text>
              <Text style={styles.totalValue}>{formatTime(totalTime)}</Text>
            </View>
          </View>

          <View style={styles.patternCard}>
            <Text style={styles.cardTitle}>Waktu Tiap Pola</Text>
            {results.map((result) => (
              <View key={result.step} style={styles.resultRow}>
                <Text style={styles.resultLabel}>Pola {result.step}</Text>
                <Text style={styles.resultTime}>
                  {formatTime(result.player1Time)}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={playAgain}>
            <RotateCcw color="#FFFFFF" size={19} />
            <Text style={styles.primaryButtonText}>Main Lagi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.dismissTo("/main/home")}
          >
            <Home color="#f45023" size={19} />
            <Text style={styles.secondaryButtonText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f6f6" },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 36 },
  title: { color: "#5d3f3c", fontSize: 28, fontWeight: "900" },
  appreciation: {
    color: "#f45023",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
    marginTop: 8,
    marginBottom: 18,
  },
  guestNote: {
    color: "#5d3f3c",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 14,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#ead8d4",
    marginBottom: 14,
  },
  summaryRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e1de",
  },
  lastSummaryRow: { borderBottomWidth: 0 },
  summaryLabel: { color: "#8f7772", fontSize: 13 },
  summaryValue: {
    flex: 1,
    color: "#5d3f3c",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
  totalValue: { color: "#f45023", fontSize: 24, fontWeight: "900" },
  patternCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#ead8d4",
    marginBottom: 18,
  },
  cardTitle: { color: "#5d3f3c", fontSize: 17, fontWeight: "900" },
  resultRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f0e1de",
  },
  resultLabel: { color: "#6b5a57", fontSize: 14, fontWeight: "700" },
  resultTime: { color: "#f45023", fontSize: 14, fontWeight: "900" },
  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#f45023",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  secondaryButton: {
    minHeight: 54,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f45023",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: { color: "#f45023", fontSize: 15, fontWeight: "800" },
});

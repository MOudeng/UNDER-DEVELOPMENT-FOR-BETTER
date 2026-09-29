import { router, useLocalSearchParams } from "expo-router";
import { Home } from "lucide-react-native";
import { useMemo } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SessionResult = {
  step: number;
  player1Time: number;
};

type SearchParams = {
  results?: string;
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
  const { results: rawResults } = useLocalSearchParams<SearchParams>();
  const results = useMemo<SessionResult[]>(() => {
    if (!rawResults) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawResults);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [rawResults]);

  const player1TotalTime = results.reduce(
    (total, result) => total + result.player1Time,
    0,
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navigationRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace("/main/home")}
          >
            <Home color="#FFFFFF" size={18} strokeWidth={2.5} />
            <Text style={styles.homeButtonText}>Beranda</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Hasil Permainan</Text>

          <View style={styles.overallCard}>
            <Text style={styles.overallLabel}>TOTAL SEMUA SOAL</Text>
            <Text style={styles.overallValue}>{formatTime(player1TotalTime)}</Text>
            <Text style={styles.overallMeta}>{results.length} soal</Text>
          </View>

          <View style={styles.textCard}>
            <Text style={styles.cardTitle}>Waktu Tiap Soal</Text>
            {results.length === 0 ? (
              <Text style={styles.cardText}>Belum ada hasil waktu permainan.</Text>
            ) : (
              results.map((result) => (
                <View key={result.step} style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Soal {result.step}</Text>
                  <Text style={styles.resultTime}>
                    {formatTime(result.player1Time)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f6f6" },
  safeArea: { flex: 1, paddingHorizontal: 20 },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#f45023",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 18,
  },
  backButtonText: { color: "#FFFFFF", fontWeight: "700" },
  navigationRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 18,
  },
  homeButton: {
    flex: 1,
    backgroundColor: "#f45023",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  homeButtonText: { color: "#FFFFFF", fontWeight: "700" },
  scrollContent: { paddingBottom: 30 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#5d3f3c",
    marginBottom: 18,
  },
  loadingCard: {
    minHeight: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  loadingText: { color: "#6b5a57", fontSize: 14 },
  overallCard: {
    backgroundColor: "#f45023",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 14,
  },
  overallLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  overallValue: {
    color: "#FFFFFF",
    fontSize: 64,
    lineHeight: 72,
    fontWeight: "900",
  },
  overallMeta: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  playerSummaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  playerSummaryCard: {
    flex: 1,
    backgroundColor: "#f45023",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
  },
  playerSummaryTime: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "900",
    marginTop: 8,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 14 },
  scoreCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(231, 189, 183, 0.85)",
  },
  scoreLabel: { color: "#999", fontSize: 11, fontWeight: "700" },
  scoreValue: {
    color: "#5d3f3c",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 8,
  },
  textCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(231, 189, 183, 0.85)",
  },
  cardTitle: {
    color: "#f45023",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  cardText: { color: "#6b5a57", fontSize: 13, lineHeight: 20 },
  resultRow: {
    minHeight: 48,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e1de",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultLabel: { color: "#5d3f3c", fontSize: 14, fontWeight: "700" },
  resultTime: { color: "#f45023", fontSize: 14, fontWeight: "800" },
  playerTimes: { alignItems: "flex-end", gap: 4 },
  fallbackText: {
    color: "#a45a4b",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
});

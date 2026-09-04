import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import {
  AIAnalysisService,
  AnalyticsEngine,
} from "../services";
import type { PerformanceStatistics } from "../services";
import { AIAnalysisResult, CognitiveAnalysis } from "../types/gamePerformance";
import { getPerformanceStatistics } from "../utils/performanceStorage";

export default function DataAnalisaPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<CognitiveAnalysis | null>(null);
  const [narrative, setNarrative] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState("");
  const [stats, setStats] = useState<PerformanceStatistics | null>(null);

  useEffect(() => {
    const loadAnalysis = async () => {
      setLoading(true);
      setAiError("");
      setNarrative(null);

      const performanceStats = user.id
        ? await getPerformanceStatistics(user.id)
        : null;
      const safeStats =
        performanceStats || AnalyticsEngine.createEmptyStatistics();
      const localAnalysis = AnalyticsEngine.generateCognitiveAnalysis(safeStats);

      setStats(safeStats);
      setAnalysis(localAnalysis);

      try {
        setNarrative(
          await AIAnalysisService.analyzePerformance(
            {
              id: user.id || "guest",
              barcode: user.barcode || user.email || user.id || "guest",
              name: user.name,
              email: user.email,
              phone: user.phone || "",
              age: user.age,
              height: user.height,
              level: 1,
              createdAt: user.joinDate || Date.now(),
            },
            safeStats,
            localAnalysis,
          ),
        );
      } catch (error) {
        setAiError(
          error instanceof Error
            ? error.message
            : "Analisis gagal dibuat. Periksa data permainan dan konfigurasi API.",
        );
      }

      setLoading(false);
    };

    loadAnalysis();
  }, [user]);

  const scoreItems = analysis
    ? [
        ["Visual-Spatial", analysis.visualSpatialScore],
        ["Problem Solving", analysis.problemSolvingScore],
        ["Kecepatan", analysis.speedScore],
        ["Akurasi", analysis.accuracyScore],
      ]
    : [];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Data Analisa</Text>

          {loading || !analysis || !stats ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#f45023" size="large" />
              <Text style={styles.loadingText}>Menganalisis data performa...</Text>
            </View>
          ) : (
            <>
              <View style={styles.overallCard}>
                <Text style={styles.overallLabel}>SKOR KESELURUHAN</Text>
                <Text style={styles.overallValue}>{analysis.overallScore}</Text>
                <Text style={styles.overallMeta}>
                  {stats.uniqueLevels} level unik • {stats.totalLevels} hasil
                  tersimpan
                </Text>
              </View>

              <View style={styles.grid}>
                {scoreItems.map(([label, value]) => (
                  <View key={String(label)} style={styles.scoreCard}>
                    <Text style={styles.scoreLabel}>{label}</Text>
                    <Text style={styles.scoreValue}>{value}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.textCard}>
                <Text style={styles.cardTitle}>Penjelasan</Text>
                <Text style={styles.cardText}>
                  {narrative?.explanation ||
                    aiError ||
                    "Menunggu hasil analisis."}
                </Text>
                {narrative?.source === "local" && narrative.fallbackReason ? (
                  <Text style={styles.fallbackText}>
                    AI tidak digunakan karena: {narrative.fallbackReason}
                  </Text>
                ) : null}
              </View>

              <View style={styles.textCard}>
                <Text style={styles.cardTitle}>Kesimpulan</Text>
                <Text style={styles.cardText}>
                  {narrative?.conclusion ||
                    "Kesimpulan akan ditampilkan setelah analisis selesai."}
                </Text>
              </View>

              <View style={styles.textCard}>
                <Text style={styles.cardTitle}>Saran</Text>
                <Text style={styles.cardText}>
                  {narrative?.suggestions ||
                    "Saran akan ditampilkan setelah analisis selesai."}
                </Text>
              </View>
            </>
          )}
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
  fallbackText: {
    color: "#a45a4b",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
});

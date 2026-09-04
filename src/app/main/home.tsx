import { router } from "expo-router";
import { Clock, Star, TrendingUp } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StatCard from "../../components/StatCard";
import { useUser } from "../../context/UserContext";
import { AnalyticsEngine, HistoryManagementService } from "../../services";
import { getPerformanceStatistics } from "../../utils/performanceStorage";

export default function Home() {
  const { user } = useUser();
  const [userName, setUserName] = useState("User");
  const [points, setPoints] = useState(0);
  const [topScore, setTopScore] = useState(0);
  const [analysisText, setAnalysisText] = useState(
    "Selesaikan permainan untuk melihat analisa performa.",
  );

  useEffect(() => {
    // Get username from user context
    setUserName(user.name || "User");
  }, [user.name]);

  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        if (!user.id) {
          setPoints(0);
          setTopScore(0);
          return;
        }

        const [historyStats, performanceStats] = await Promise.all([
          HistoryManagementService.getStatistics(user.id),
          getPerformanceStatistics(user.id),
        ]);

        setPoints(historyStats.completedGames * 100);
        setTopScore(historyStats.bestScore);

        if (performanceStats) {
          const analysis =
            AnalyticsEngine.generateCognitiveAnalysis(performanceStats);
          setAnalysisText(
            `Skor keseluruhan ${analysis.overallScore}/100. ${analysis.strengths[0] || "Terus berlatih untuk membangun kemampuan block design."}`,
          );
        }
      };

      loadStats();
    }, [user.id]),
  );

  const handleStartGame = () => {
    router.push("/mulai-main");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hallo, {userName}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Score Indicators Row */}
          <View style={styles.scoreRow}>
            <StatCard
              style={styles.scoreCard}
              icon={
                <Star
                  size={18}
                  color="#FFFFFF"
                  strokeWidth={2.5}
                  fill="#FFFFFF"
                />
              }
              label="POINTS"
              value={points}
              accentColor="#f45023"
            />

            <StatCard
              style={styles.scoreCard}
              icon={
                <Clock
                  size={15}
                  color="#FFFFFF"
                  strokeWidth={2.5}
                  fill="#FFFFFF"
                />
              }
              label="TOP SCORE"
              value={topScore}
              accentColor="#2563eb"
            />
          </View>

          {/* Analysis Card */}
          <View style={styles.analysisCard}>
            <View style={styles.analysisTitleContainer}>
              <View style={styles.analysisIconWrap}>
                <TrendingUp size={18} color="#db320e" strokeWidth={2.5} />
              </View>

              <Text style={styles.analysisTitle}>ANALISA TEST TERAKHIR</Text>
            </View>
            <Text style={styles.analysisText}>{analysisText}</Text>
          </View>

          {/* Start Game Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartGame}
            activeOpacity={0.85}
          >
            <Text style={styles.startButtonText}>Mulai Main</Text>
          </TouchableOpacity>

          {/* Extra padding at bottom */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F5F5F5",
    gap: 12,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#f45023",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  scoreRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(231, 189, 183, 0.85)",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  scoreCardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  redCircle: {
    width: 25,
    height: 25,
    borderRadius: 28,
    backgroundColor: "#f45023",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  blueCircle: {
    width: 25,
    height: 25,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scoreTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: "right",
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: "700",
    color: "#333",
    textAlign: "left",
  },
  analysisCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(231, 189, 183, 0.85)",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },

  analysisTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  analysisIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 32,
    backgroundColor: "rgba(216, 57, 20, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },

  analysisTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 0.5,
  },
  analysisText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6b5a57",
  },
  startButton: {
    backgroundColor: "#f45023",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});

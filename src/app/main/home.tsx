import { router, useFocusEffect } from "expo-router";
import { Clock } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StatCard from "../../components/StatCard";
import { useUser } from "../../context/UserContext";
import { HistoryManagementService } from "../../services";
import { GUEST_STATISTICS_USER_ID } from "../../services/HistoryManagementService";

const formatDuration = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
};

export default function Home() {
  const { user } = useUser();
  const { width } = useWindowDimensions();
  const [fastestTime, setFastestTime] = useState<number | null>(null);
  const [averageTime, setAverageTime] = useState<number | null>(null);

  const userName = user.name || "User";

  const handleStartGame = () => {
    router.push("/gamemode");
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadStats = async () => {
        const historyStats = await HistoryManagementService.getStatistics(
          user.id ?? GUEST_STATISTICS_USER_ID,
        );

        if (isActive) {
          setFastestTime(
            historyStats.timedGames > 0 ? historyStats.bestTime : null,
          );
          setAverageTime(
            historyStats.timedGames > 0 ? historyStats.averageTime : null,
          );
        }
      };

      loadStats();

      return () => {
        isActive = false;
      };
    }, [user.id]),
  );

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
          {/* Time Indicators Row */}
          <View
            style={[
              styles.scoreRow,
              width < 600 && styles.scoreRowStacked,
            ]}
          >
            <StatCard
              style={styles.scoreCard}
              icon={
                <Clock
                  size={17}
                  color="#FFFFFF"
                  strokeWidth={2.5}
                />
              }
              label="WAKTU TERCEPAT"
              value={fastestTime === null ? "--:--" : formatDuration(fastestTime)}
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
              label="WAKTU RATA-RATA"
              value={averageTime === null ? "--:--" : formatDuration(averageTime)}
              accentColor="#2563eb"
            />
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartGame}
            activeOpacity={0.85}
          >
            <Text style={styles.startButtonText}>Mulai Main</Text>
          </TouchableOpacity>

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
  scoreRowStacked: {
    flexDirection: "column",
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

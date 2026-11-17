import { router, useFocusEffect } from "expo-router";
import { Clock, History, TrendingUp } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StatCard from "../../components/StatCard";
import { useProfiles } from "../../context/ProfileContext";
import LocalDatabaseService from "../../services/LocalDatabaseService";

const formatDuration = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
};

export default function Home() {
  const { activeProfile, isGuest } = useProfiles();
  const { width } = useWindowDimensions();
  const [fastestTime, setFastestTime] = useState<number | null>(null);
  const [averageTime, setAverageTime] = useState<number | null>(null);

  const userName = isGuest ? "Tamu" : activeProfile?.displayName || "Pemain";

  const handleStartGame = () => {
    router.push("/gamemode");
  };

  const openSavedResults = (path: "/perkembangan" | "/riwayat") => {
    if (!isGuest) {
      router.push(path);
      return;
    }
    Alert.alert(
      "Mode Tamu",
      "Hasil mode tamu tidak disimpan. Masuk ke akun untuk menyimpan dan melihat hasil permainan.",
      [
        { text: "Nanti", style: "cancel" },
        { text: "Ke Akun", onPress: () => router.navigate("/main/akun") },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadStats = async () => {
        if (!activeProfile) {
          if (isActive) {
            setFastestTime(null);
            setAverageTime(null);
          }
          return;
        }

        const historyStats = await LocalDatabaseService.getProfileStatistics(
          activeProfile.id,
          "test",
        );

        if (isActive) {
          setFastestTime(historyStats.fastestDurationMs);
          setAverageTime(historyStats.averageDurationMs);
        }
      };

      loadStats();

      return () => {
        isActive = false;
      };
    }, [activeProfile]),
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hallo, {userName}</Text>
          {isGuest ? (
            <Text style={styles.guestNote}>Mode Tamu: hasil tidak disimpan</Text>
          ) : null}
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
              label="REKOR MODE TEST"
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
              label="RATA-RATA MODE TEST"
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

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => openSavedResults("/perkembangan")}
            >
              <TrendingUp color="#f45023" size={20} />
              <Text style={styles.secondaryButtonText}>Lihat Perkembangan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => openSavedResults("/riwayat")}
            >
              <History color="#2563eb" size={20} />
              <Text
                style={[
                  styles.secondaryButtonText,
                  styles.historyButtonText,
                ]}
              >
                Lihat Riwayat
              </Text>
            </TouchableOpacity>
          </View>

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
  guestNote: {
    flexShrink: 1,
    color: "#5d3f3c",
    fontSize: 13,
    fontWeight: "700",
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
  secondaryActions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ead8d4",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 8,
  },
  secondaryButtonText: {
    color: "#f45023",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  historyButtonText: {
    color: "#2563eb",
  },
});

import { router, useFocusEffect } from "expo-router";
import { Clock, Star } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import {
  HistoryManagementService,
  LevelManagementService,
  TimerService,
} from "../services";
import { GamePerformance } from "../types/gamePerformance";

export default function RiwayatPage() {
  const { user } = useUser();
  const [history, setHistory] = useState<GamePerformance[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user.id) {
      setHistory([]);
      return;
    }
    setHistory(await HistoryManagementService.getHistory(user.id));
  }, [user.id]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const deleteItem = (item: GamePerformance) => {
    if (!user.id) return;

    Alert.alert("Hapus Riwayat", "Hapus hasil permainan ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await HistoryManagementService.deletePerformance(user.id!, item.id);
          await loadHistory();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Riwayat</Text>
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
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Belum ada riwayat</Text>
              <Text style={styles.emptyText}>
                Selesaikan permainan untuk melihat hasilnya di sini.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const level = LevelManagementService.getLevelById(item.levelNumber);
            const seconds = Math.round((item.completionTime || 0) / 1000);

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onLongPress={() => deleteItem(item)}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.levelText}>Level {item.levelNumber}</Text>
                    <Text style={styles.levelTitle}>
                      {level?.title || "Block Design"}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>
                    {new Date(item.timestamp).toLocaleDateString("id-ID")}
                  </Text>
                </View>

                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Star color="#f45023" size={18} fill="#f45023" />
                    <Text style={styles.statLabel}>Skor</Text>
                    <Text style={styles.statValue}>{item.score || 0}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Clock color="#2563eb" size={18} />
                    <Text style={styles.statLabel}>Waktu</Text>
                    <Text style={styles.statValue}>
                      {TimerService.formatSeconds(seconds)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f6f6" },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#f6f6f6",
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#f45023",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 18,
  },
  backButtonText: { color: "#FFFFFF", fontWeight: "700" },
  title: { fontSize: 28, fontWeight: "800", color: "#5d3f3c" },
  listContent: { padding: 20, gap: 14 },
  emptyListContent: { flexGrow: 1, justifyContent: "center" },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(231, 189, 183, 0.85)",
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#5d3f3c" },
  emptyText: {
    marginTop: 8,
    color: "rgba(93, 63, 60, 0.75)",
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(231, 189, 183, 0.85)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  levelText: { color: "#f45023", fontSize: 16, fontWeight: "800" },
  levelTitle: { color: "#6b5a57", fontSize: 12, marginTop: 4 },
  dateText: { color: "#999", fontSize: 12 },
  statRow: { flexDirection: "row", gap: 12 },
  statItem: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statLabel: { color: "#999", fontSize: 11, marginTop: 6 },
  statValue: { color: "#333", fontSize: 18, fontWeight: "800", marginTop: 2 },
});

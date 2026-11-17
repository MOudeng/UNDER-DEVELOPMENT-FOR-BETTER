import { router, useFocusEffect } from "expo-router";
import { ChevronRight, Clock, Dumbbell, Trophy } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProfiles } from "../context/ProfileContext";
import LocalDatabaseService from "../services/LocalDatabaseService";
import type { LocalGameSession } from "../types/localProfiles";

type HistoryMode = LocalGameSession["gameMode"];

const HISTORY_MODES = [
  {
    mode: "test",
    title: "Riwayat Mode Test",
    description: "Hasil sesi test 8 pola.",
    color: "#f45023",
    Icon: Trophy,
  },
  {
    mode: "practice",
    title: "Riwayat Mode Practice",
    description: "Hasil latihan tanpa batas pola.",
    color: "#2563eb",
    Icon: Dumbbell,
  },
  {
    mode: "legacy",
    title: "Riwayat Lama",
    description: "Hasil dari versi aplikasi sebelumnya.",
    color: "#6b5a57",
    Icon: Clock,
  },
] as const;

export default function RiwayatPage() {
  const { activeProfile } = useProfiles();
  const [counts, setCounts] = useState<Partial<Record<HistoryMode, number>>>({});
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadCounts = async () => {
        try {
          const sessions = activeProfile
            ? await LocalDatabaseService.getProfileHistory(activeProfile.id)
            : [];
          const nextCounts: Partial<Record<HistoryMode, number>> = {};
          for (const { gameMode } of sessions) {
            nextCounts[gameMode] = (nextCounts[gameMode] ?? 0) + 1;
          }
          if (isActive) {
            setCounts(nextCounts);
            setError(null);
          }
        } catch (loadError) {
          if (isActive) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Riwayat gagal dimuat. Silakan coba lagi.",
            );
          }
        }
      };

      void loadCounts();

      return () => {
        isActive = false;
      };
    }, [activeProfile]),
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            Riwayat {activeProfile?.displayName ?? "Pemain"}
          </Text>
          <Text style={styles.subtitle}>Pilih riwayat yang ingin dilihat.</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {HISTORY_MODES.filter(
            // Old results stay reachable, without a dead end for everyone else.
            ({ mode }) => mode !== "legacy" || (counts.legacy ?? 0) > 0,
          ).map(({ mode, title, description, color, Icon }) => (
            <TouchableOpacity
              key={mode}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() =>
                router.push({ pathname: "/riwayat-mode", params: { mode } })
              }
            >
              <View style={[styles.iconWrap, { backgroundColor: `${color}1A` }]}>
                <Icon color={color} size={26} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color }]}>{title}</Text>
                <Text style={styles.cardDescription}>{description}</Text>
                <Text style={styles.cardCount}>
                  {counts[mode] ?? 0} sesi selesai
                </Text>
              </View>
              <ChevronRight color="#999" size={22} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f6f6" },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 14 },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#f45023",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  backButtonText: { color: "#FFFFFF", fontWeight: "700" },
  title: { color: "#5d3f3c", fontSize: 27, fontWeight: "900" },
  subtitle: { color: "#6b5a57", fontSize: 13, marginBottom: 4 },
  errorText: { color: "#b91c1c", backgroundColor: "#fee2e2", padding: 10 },
  card: {
    minHeight: 104,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ead8d4",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "900" },
  cardDescription: { color: "#6b5a57", fontSize: 12, lineHeight: 17, marginTop: 3 },
  cardCount: { color: "#8f7772", fontSize: 11, marginTop: 6 },
});

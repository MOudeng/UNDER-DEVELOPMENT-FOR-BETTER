import { Clock, Layers3 } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import type { SessionWithPatterns } from "../types/localProfiles";
import { formatClock } from "../utils/progressStats";

const MODE_LABELS: Record<SessionWithPatterns["gameMode"], string> = {
  test: "Test",
  practice: "Practice / Simulasi",
  legacy: "Riwayat lama",
};

const VERIFICATION_LABELS: Record<string, string> = {
  manual_completion: "Manual oleh pendamping",
  legacy_async_storage: "Data versi lama",
};

type Props = {
  session: SessionWithPatterns;
  profileName: string;
};

export default function SessionCard({ session, profileName }: Props) {
  const details = [
    `Pemain: ${profileName}`,
    `Mode: ${MODE_LABELS[session.gameMode]}`,
    `Verifikasi: ${VERIFICATION_LABELS[session.verificationMethod] ?? session.verificationMethod}`,
  ];
  if (session.gameMode !== "legacy") {
    details.push(
      `Status: ${session.sessionStatus === "completed" ? "Lengkap" : "Belum lengkap"}`,
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.dateText}>
        {new Date(session.finishedAt ?? session.startedAt).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </Text>
      {details.map((detail) => (
        <Text key={detail} style={styles.detailText}>
          {detail}
        </Text>
      ))}

      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Layers3 color="#f45023" size={18} />
          <Text style={styles.statLabel}>Pola selesai</Text>
          <Text style={styles.statValue}>{session.completedPatterns}</Text>
        </View>
        <View style={styles.statItem}>
          <Clock color="#2563eb" size={18} />
          <Text style={styles.statLabel}>Total waktu</Text>
          <Text style={styles.statValue}>{formatClock(session.totalDurationMs)}</Text>
        </View>
      </View>

      <View style={styles.patternDetails}>
        <Text style={styles.patternDetailsTitle}>Waktu tiap pola</Text>
        {session.patterns.length === 0 ? (
          <Text style={styles.migratedText}>
            Detail pola tidak tersedia untuk riwayat lama.
          </Text>
        ) : (
          session.patterns.map((pattern, index) => (
            <View key={pattern.id} style={styles.patternRow}>
              <Text style={styles.patternLabel}>
                {session.gameMode === "test" && pattern.levelNumber !== null
                  ? `Level ${pattern.levelNumber}`
                  : `Pola ${index + 1}`}
              </Text>
              <Text style={styles.patternTime}>{formatClock(pattern.durationMs)}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#ead8d4",
  },
  dateText: { color: "#5d3f3c", fontSize: 14, fontWeight: "800", marginBottom: 6 },
  detailText: { color: "#6b5a57", fontSize: 12, lineHeight: 18 },
  statRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  statItem: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statLabel: { color: "#6b5a57", fontSize: 11, marginTop: 6 },
  statValue: { color: "#333", fontSize: 18, fontWeight: "800", marginTop: 2 },
  patternDetails: { marginTop: 16 },
  patternDetailsTitle: { color: "#5d3f3c", fontSize: 14, fontWeight: "900" },
  patternRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f0e1de",
  },
  patternLabel: { color: "#6b5a57", fontSize: 13 },
  patternTime: { color: "#f45023", fontSize: 13, fontWeight: "800" },
  migratedText: { color: "#8f7772", fontSize: 12, marginTop: 8 },
});

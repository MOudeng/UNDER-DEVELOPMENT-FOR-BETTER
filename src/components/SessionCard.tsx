import { ChevronDown, ChevronUp, Clock, Layers3 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { SessionWithPatterns } from "../types/localProfiles";
import type { HistoryBadge } from "../utils/historyView";
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

const BADGE_LABELS: Record<HistoryBadge, { text: string; color: string; bg: string }> = {
  record: { text: "⭐ Rekor", color: "#92400e", bg: "#fef3c7" },
  faster: { text: "⚡ Lebih cepat", color: "#166534", bg: "#dcfce7" },
  // Neutral on purpose: a slower session is not a failure.
  slower: { text: "Lebih lama", color: "#475569", bg: "#e2e8f0" },
};

type Props = {
  session: SessionWithPatterns;
  profileName: string;
  badges?: HistoryBadge[];
};

export default function SessionCard({ session, profileName, badges = [] }: Props) {
  const [expanded, setExpanded] = useState(false);
  const dateText = new Date(session.finishedAt ?? session.startedAt).toLocaleString(
    "id-ID",
    { dateStyle: "medium", timeStyle: "short" },
  );

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

  const summary = (
    <View style={styles.summaryRow}>
      <View style={styles.summaryText}>
        <Text style={styles.dateText}>{dateText}</Text>
        {badges.length > 0 ? (
          <View style={styles.badgeRow}>
            {badges.map((badge) => (
              <View
                key={badge}
                style={[styles.badge, { backgroundColor: BADGE_LABELS[badge].bg }]}
              >
                <Text style={[styles.badgeText, { color: BADGE_LABELS[badge].color }]}>
                  {BADGE_LABELS[badge].text}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <Text style={styles.totalText}>{formatClock(session.totalDurationMs)}</Text>
      {expanded ? (
        <ChevronUp color="#8f7772" size={20} />
      ) : (
        <ChevronDown color="#8f7772" size={20} />
      )}
    </View>
  );

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sesi ${dateText}, total waktu ${formatClock(session.totalDurationMs)}`}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
      >
        {summary}
      </Pressable>

      {expanded ? (
        <>
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
            <View style={styles.statItem}>
              <Clock color="#16a34a" size={18} />
              <Text style={styles.statLabel}>
                {session.gameMode === "test" ? "Rata-rata per level" : "Rata-rata per pola"}
              </Text>
              <Text style={styles.statValue}>
                {formatClock(
                  session.completedPatterns > 0
                    ? session.totalDurationMs / session.completedPatterns
                    : null,
                )}
              </Text>
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
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ead8d4",
  },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 },
  summaryText: { flex: 1, gap: 6 },
  dateText: { color: "#5d3f3c", fontSize: 14, fontWeight: "800" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "800" },
  totalText: { color: "#f45023", fontSize: 20, fontWeight: "900" },
  detailText: { color: "#6b5a57", fontSize: 12, lineHeight: 18 },
  statRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  statItem: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  statLabel: { color: "#6b5a57", fontSize: 11, marginTop: 6, textAlign: "center" },
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

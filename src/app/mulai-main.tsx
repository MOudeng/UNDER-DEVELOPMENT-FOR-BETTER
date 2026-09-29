import { router } from "expo-router";
import {
  ArrowLeft,
  ChevronRight,
  Gamepad2,
  Home,
} from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MulaiMainPage() {
  const handleModePress = () => {
    router.push({
      pathname: "/gamemode",
      params: { mode: "single" },
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Gamepad2 color="#db320e" size={36} strokeWidth={3} />
            </View>
            <Text style={styles.heroTitle}>Mulai Permainan</Text>
            <Text style={styles.heroSubtitle}>
              Tentukan cara bermain sebelum masuk ke sesi berikutnya.
            </Text>
          </View>

          <View style={styles.cardList}>
            <Pressable
              style={({ pressed }) => [
                styles.modeCard,
                pressed && styles.modeCardPressed,
              ]}
              onPress={handleModePress}
            >
              <View style={styles.modeIconWrap}>
                <Gamepad2 color="#db320e" size={36} strokeWidth={2.2} />
              </View>

              <View style={styles.modeTextWrap}>
                <Text style={styles.modeTitle}>MULAI</Text>
                <Text style={styles.modeDescription}>
                  Main sendiri dan lanjutkan ke mode latihan atau tes.
                </Text>
              </View>

              <View style={styles.nextIconWrap}>
                <ChevronRight color="#db320e" size={24} strokeWidth={2.6} />
              </View>
            </Pressable>
          </View>

          <View style={styles.navigationRow}>
            <Pressable
              style={({ pressed }) => [
                styles.navigationButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.back()}
            >
              <ArrowLeft color="#db320e" size={18} strokeWidth={2.5} />
              <Text style={styles.navigationButtonText}>Kembali</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.navigationButton,
                styles.homeButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.replace("/main/home")}
            >
              <Home color="#FFFFFF" size={18} strokeWidth={2.5} />
              <Text style={styles.homeButtonText}>Beranda</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: "#db320e",
    borderRadius: 24,
    borderWidth: 0,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "rgba(219, 50, 14, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255, 255, 255, 0.92)",
    textAlign: "center",
  },
  cardList: {
    gap: 14,
  },
  navigationRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: "auto",
    paddingTop: 22,
  },
  navigationButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(219, 50, 14, 0.22)",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  homeButton: {
    backgroundColor: "#db320e",
    borderColor: "#db320e",
  },
  navigationButtonText: {
    color: "#db320e",
    fontSize: 13,
    fontWeight: "700",
  },
  homeButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  modeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(231, 189, 183, 0.85)",
    paddingHorizontal: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  modeCardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },
  modeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    backgroundColor: "rgba(216, 57, 20, 0.08)",
  },
  modeTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  modeTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#5d3f3c",
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(93, 63, 60, 0.72)",
  },
  nextIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216, 57, 20, 0.08)",
  },
});

import { router } from "expo-router";
import {
  BookOpen,
  ChevronRight,
  Gamepad2,
  UserRound,
} from "lucide-react-native";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProfiles } from "../../context/ProfileContext";
import BlockBackground from "../../components/BlockBackground";

export default function AkunPage() {
  const { activeProfile, enterGuestMode, error, isGuest } = useProfiles();

  const playAsGuest = async () => {
    try {
      await enterGuestMode();
      router.navigate("/main/home");
    } catch (guestError) {
      Alert.alert(
        "Mode tamu gagal dibuka",
        guestError instanceof Error ? guestError.message : "Silakan coba lagi.",
      );
    }
  };

  const options = [
    {
      title: "Main sebagai Tamu",
      description: isGuest
        ? "Sedang aktif. Hasil permainan tidak disimpan."
        : "Langsung bermain. Hasil permainan tidak disimpan.",
      color: "#c2410c",
      Icon: Gamepad2,
      active: isGuest,
      onPress: playAsGuest,
    },
    {
      title: "Akun",
      description: activeProfile
        ? `Sedang aktif: ${activeProfile.displayName}. Ketuk untuk memilih atau mengubah profil.`
        : "Pilih atau buat profil pemain untuk menyimpan hasil permainan.",
      color: "#2563eb",
      Icon: UserRound,
      active: activeProfile !== null,
      onPress: () => router.push("/profiles"),
    },
    {
      title: "Petunjuk Penggunaan",
      description: "Lihat cara bermain langkah demi langkah.",
      color: "#6b5a57",
      Icon: BookOpen,
      active: false,
      onPress: () =>
        router.push({
          pathname: "/Welcomepage/PetunjukPenggunaanPage",
          params: { from: "akun" },
        }),
    },
  ];

  return (
    <View style={styles.container}>
      <BlockBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Akun</Text>
          <Text style={styles.subtitle}>Pilih cara bermain.</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {options.map(({ title, description, color, Icon, active, onPress }) => (
            <Pressable
              key={title}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.card,
                active && styles.activeCard,
                pressed && styles.pressedCard,
              ]}
              onPress={onPress}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${color}1A` }]}>
                <Icon color={color} size={26} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDescription}>{description}</Text>
              </View>
              <ChevronRight color="#8f7b77" size={22} />
            </Pressable>
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
  title: { color: "#f45023", fontSize: 30, fontWeight: "900" },
  subtitle: { color: "#5d3f3c", fontSize: 14 },
  errorText: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    padding: 12,
  },
  card: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ead8d4",
    backgroundColor: "#FFFFFF",
  },
  activeCard: { borderColor: "#16a34a", borderWidth: 2 },
  pressedCard: { opacity: 0.85 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { color: "#4d3532", fontSize: 17, fontWeight: "800" },
  cardDescription: { color: "#6b5a57", fontSize: 13, lineHeight: 18 },
});

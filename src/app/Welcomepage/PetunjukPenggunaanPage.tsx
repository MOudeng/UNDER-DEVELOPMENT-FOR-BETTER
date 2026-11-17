import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import * as React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PatternBackground from "../../components/PatternBackground";
import {
  BorderRadius,
  Color,
  FontFamily,
  Gradient,
  Shadow,
} from "../../styles/globalstyle";

const TITLE_COLOR = "#6b1010";
const SPARKLE_COLOR = "#f5b301";

const STEPS = [
  {
    title: "Pilih Tamu atau Akun",
    description:
      "Main sebagai Tamu untuk langsung bermain tanpa menyimpan hasil, atau pilih Akun untuk menyimpan hasil ke profil pemain.",
    image: require("../../assets/petunjuk/step1.png"),
    imageLabel: "Layar pilihan Main sebagai Tamu dan Akun",
  },
  {
    title: "Pilih Mode Permainan",
    description:
      "Tekan Mulai Main, lalu pilih mode Test (8 level) atau Practice (latihan tanpa batas).",
    image: require("../../assets/petunjuk/step2.png"),
    imageLabel: "Layar pilihan mode Test dan Practice",
  },
  {
    title: "Susun Balok sesuai Pola",
    description:
      "Tekan Mulai, lalu anak menyusun balok merah-putih mengikuti pola yang ditampilkan di layar.",
    image: require("../../assets/petunjuk/step3.png"),
    imageLabel: "Anak menyusun balok didampingi orang tua, dengan tablet menampilkan pola",
  },
  {
    title: "Verifikasi oleh Orang Tua",
    description:
      "Orang tua atau pendamping memeriksa kecocokan susunan dengan pola. Jika cocok, tekan Next (di mode Practice: Berikutnya), lalu ulangi langkah 3–4.",
    image: require("../../assets/petunjuk/step4.png"),
    imageLabel: "Orang tua memberi jempol karena susunan balok sama dengan pola",
  },
  {
    title: "Lihat Hasil",
    description:
      "Tekan Selesai untuk melihat waktu tiap pola di Hasil Permainan. Pemain dengan akun bisa melihatnya lagi di Lihat Perkembangan dan Lihat Riwayat.",
    image: require("../../assets/petunjuk/step5.png"),
    imageLabel: "Contoh layar Hasil Permainan dengan total waktu dan waktu tiap pola",
  },
];

const PetunjukPenggunaanPage = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const openedFromAkun = from === "akun";
  const isNarrow = width < 700;

  const handlePress = () => {
    if (openedFromAkun) router.back();
    else router.replace("/main/akun");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.termsAndAgreements}
          contentContainerStyle={styles.termsAndAgreementsContent}
        >
          {/* Pattern Background - Top Left & Bottom Right */}
          <PatternBackground position="custombottomleft" opacity={0.3} />
          <PatternBackground position="bottomRight" opacity={0.3} />

          <View style={[styles.header, isNarrow && styles.headerNarrow]}>
            <View style={[styles.brand, !isNarrow && styles.brandWide]}>
              <Image
                style={styles.brandLogo}
                contentFit="contain"
                source={require("../../assets/logo.png")}
              />
              <View>
                <Text style={styles.brandName}>BrainBlock.id</Text>
                <Text style={styles.brandSubtitle}>Block Design Test</Text>
              </View>
            </View>
            <View style={styles.titleRow}>
              <Sparkles color={SPARKLE_COLOR} size={26} />
              <Text
                style={[styles.syaratKetentuan, isNarrow && styles.titleNarrow]}
              >
                Petunjuk Penggunaan
              </Text>
              <Sparkles color={SPARKLE_COLOR} size={26} />
            </View>
          </View>

          <View style={styles.stepList}>
            {STEPS.map((step, index) => (
              <View
                key={step.title}
                style={[styles.stepCard, isNarrow && styles.stepCardNarrow]}
              >
                <View style={[styles.stepTextRow, isNarrow && styles.stepTextRowNarrow]}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepText}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                </View>
                <Image
                  style={[styles.stepImage, isNarrow && styles.stepImageNarrow]}
                  contentFit="contain"
                  source={step.image}
                  accessibilityLabel={step.imageLabel}
                />
              </View>
            ))}
          </View>

          <Pressable onPress={handlePress} accessibilityRole="button">
            <LinearGradient
              style={styles.buttonnext}
              locations={[0, 1]}
              colors={Gradient.cta}
            >
              <Text style={styles.setuju}>{openedFromAkun ? "Kembali" : "Masuk"}</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  termsAndAgreementsContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: "center",
    gap: 16,
  },
  termsAndAgreements: {
    backgroundColor: "white",
    maxWidth: "100%",
    flex: 1,
    width: "100%",
  },
  header: {
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  headerNarrow: {
    gap: 8,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandWide: {
    position: "absolute",
    left: 24,
  },
  brandLogo: {
    width: 44,
    height: 44,
  },
  brandName: {
    color: TITLE_COLOR,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: FontFamily.interBold,
  },
  brandSubtitle: {
    color: "#6b5a57",
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.interMedium,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  syaratKetentuan: {
    flexShrink: 1,
    fontSize: 36,
    lineHeight: 44,
    fontFamily: FontFamily.interBold,
    textAlign: "center",
    color: TITLE_COLOR,
  },
  titleNarrow: {
    fontSize: 24,
    lineHeight: 30,
  },
  stepList: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    gap: 10,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 24,
    paddingRight: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f8d8d5",
    backgroundColor: "#fff5f3",
    overflow: "hidden",
  },
  stepCardNarrow: {
    flexDirection: "column",
    alignItems: "stretch",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  stepTextRow: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
  },
  stepTextRowNarrow: {
    flex: 0,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d9392b",
  },
  stepNumberText: {
    color: Color.colorWhite,
    fontSize: 22,
    fontFamily: FontFamily.interBold,
  },
  stepText: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    color: TITLE_COLOR,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: FontFamily.interBold,
  },
  stepDescription: {
    color: "#33201e",
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FontFamily.interMedium,
  },
  stepImage: {
    width: 320,
    height: 160,
    marginVertical: 8,
  },
  stepImageNarrow: {
    width: "100%",
    height: undefined,
    aspectRatio: 2,
  },
  buttonnext: {
    height: 55,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    width: "75%",
    boxShadow: Shadow.drop,
    elevation: Shadow.medium,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "transparent",
    flexDirection: "row",
  },
  setuju: {
    height: 25,
    width: 200,
    fontSize: 20,
    letterSpacing: -0.4,
    lineHeight: 28,
    fontWeight: "600",
    fontFamily: FontFamily.interSemiBold,
    color: Color.colorWhite,
    textAlign: "center",
    display: "flex",
  },
});

export default PetunjukPenggunaanPage;

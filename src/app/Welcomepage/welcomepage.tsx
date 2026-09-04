import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import PatternBackground from "../../components/PatternBackground";
import {
  BorderRadius,
  Color,
  FontFamily,
  Gradient,
  Shadow,
} from "../../styles/globalstyle";

const WelcomePage = () => {
  const router = useRouter();

  const handlePress = () => {
    router.push("/Welcomepage/SnKpage");
  };
  return (
    <LinearGradient
      style={styles.scrollviewLayout}
      locations={[0, 1]}
      colors={Gradient.primary}
    >
      <ScrollView
        style={styles.scrollviewLayout}
        contentContainerStyle={styles.welcomePageScrollViewContent}
      >
        <PatternBackground position="custompattern" opacity={0.3} />

        <View style={[styles.maincreenwelcome, styles.buttonnextFlexBox]}>
          <View style={styles.welcometext}>
            <Text style={[styles.selamatDatangDi, styles.lanjutkanFlexBox]}>
              Selamat Datang di
            </Text>
            <Text style={[styles.otakAtikMerahPutih, styles.lanjutkanFlexBox]}>
              Otak-Atik Merah Putih
            </Text>
          </View>
          <View style={[styles.descriptionapp]}>
            <Text style={[styles.otakAtikMerahPutih2]}>
              Otak-Atik Merah Putih adalah aplikasi android yang dikembangkan
              berdasarkan proyek Block Design Test oleh jurusan Teknik Komputer
              PENS Surabaya. Terima kasih sudah membeli dan menggunakan produk
              kami, semoga bermanfaat untuk anda.
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.buttonnext,
              styles.buttonnextFlexBox,
              pressed && styles.buttonnextPressed,
            ]}
            onPress={handlePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Lanjutkan ke syarat dan ketentuan"
            accessibilityHint="Membuka halaman syarat dan ketentuan"
          >
            <Text style={styles.lanjutkan}>Lanjutkan</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  welcomePageScrollViewContent: {
    flex: 1,
  },
  buttonnextFlexBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  lanjutkanFlexBox: {
    display: "flex",
    alignItems: "center",
  },

  scrollviewLayout: {
    backgroundColor: "transparent",
    maxWidth: "100%",
    flex: 1,
    width: "100%",
  },
  maincreenwelcome: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 50,
    paddingBottom: 50,
    justifyContent: "space-between",
    alignItems: "center",
    gap: 75,
  },
  welcometext: {
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  selamatDatangDi: {
    height: 24,
    fontSize: 22,
    transform: [
      {
        rotate: "0.5deg",
      },
    ],
    textAlign: "left",
    color: Color.colorWhite,
    alignSelf: "stretch",
    fontFamily: FontFamily.interBold,
    fontWeight: "800",
  },
  otakAtikMerahPutih: {
    height: 140,
    fontSize: 44,
    textAlign: "left",
    color: Color.colorWhite,
    alignSelf: "stretch",
    fontFamily: FontFamily.interBold,
    
  },
  descriptionapp: {
    alignSelf: "stretch",
    justifyContent: "center",
    marginTop: 5,
    marginBottom: 110,
  },
  otakAtikMerahPutih2: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    fontFamily: FontFamily.interMedium,
    textAlign: "justify",
    paddingHorizontal: 15,
    color: Color.colorWhite,

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
    backgroundColor: Color.colorWhite,
    flexDirection: "row",
  },
  buttonnextPressed: {
    opacity: 0.85,
  },
  lanjutkan: {
    width: 200,
    fontSize: 20,
    letterSpacing: -0.4,
    lineHeight: 28,
    fontWeight: "600",
    fontFamily: FontFamily.interSemiBold,
    color: Color.colorOrangered,
    textAlign: "center",
  },
});

export default WelcomePage;

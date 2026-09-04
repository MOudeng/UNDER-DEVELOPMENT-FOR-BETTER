import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PatternBackground from "../../components/PatternBackground";
import {
  BorderRadius,
  Color,
  FontFamily,
  Gradient,
  Shadow,
} from "../../styles/globalstyle";

const TermsAndAgreements = () => {
  const router = useRouter();

  const handlePress = () => {
    router.push("/Welcomepage/PetunjukPenggunaanPage");
  };
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.termsAndAgreements}
          contentContainerStyle={styles.termsAndAgreementsContent}
        >
          {/* Pattern Background - Top Right & Bottom Left */}
          <PatternBackground position="topRight" opacity={0.3} />
          <PatternBackground position="bottomLeft" opacity={0.3} />

          <View style={[styles.headersaction, styles.setujuFlexBox]}>
            <Text style={styles.syaratKetentuan}>Syarat & Ketentuan</Text>
          </View>
          <View style={[styles.deskripsection, styles.setujuFlexBox]}>
            <Text style={styles.untukKebutuhanRiset}>
              Untuk kebutuhan riset, kami meminta izin kepada para pengguna
              untuk mengizinkan kami menyimpan data hasil test dan simulasi
              pengguna. Dengan klik “Setuju”, berarti anda telah menyetujui data
              anda disimpan dan digunakan oleh kami untuk kebutuhan riset kami.
              Apakah anda setuju?
            </Text>
          </View>
          <Pressable onPress={handlePress}>
            <LinearGradient
              style={styles.buttonnext}
              locations={[0, 1]}
              colors={Gradient.cta}
            >
              <Text style={styles.setuju}>Setuju</Text>
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
    paddingHorizontal: 40,
    paddingTop: 50,
    paddingBottom: 50,
    justifyContent: "center",
    gap: 120,
  },
  setujuFlexBox: {
    justifyContent: "center",
    alignItems: "center",
  },
  termsAndAgreements: {
    backgroundColor: "white",
    maxWidth: "100%",
    flex: 1,
    width: "100%",
  },
  headersaction: {
    alignSelf: "stretch",
    height: 100,
    flexDirection: "column",
    alignItems: "center",
    paddingRight: 20,
  },
  syaratKetentuan: {
    fontSize: 44,
    lineHeight: 45,
    fontFamily: FontFamily.interBold,
    textAlign: "left",
    flex: 1,
    color: "#f45023",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: {
      width: 0,
      height: 4,
    },
    textShadowRadius: 4,
    flexWrap: "wrap",
  },
  deskripsection: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginBottom: 60,
  },
  untukKebutuhanRiset: {
    width: "100%",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    fontFamily: FontFamily.interMedium,
    color: "#f45023",
    textAlign: "justify",
    paddingHorizontal: 10,
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

export default TermsAndAgreements;

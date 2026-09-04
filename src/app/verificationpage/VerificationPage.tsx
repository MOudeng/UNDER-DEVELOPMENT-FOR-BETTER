import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PatternBackground from "../../components/PatternBackground";

export default function VerificationPage() {
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const handleEmailVerification = () => {
    setActiveButton("email");
    router.push("/verificationpage/email-verification");
  };

  const handleCodeVerification = () => {
    setActiveButton("code");
    router.push("/verificationpage/code-verification");
  };

  const handleBarcodeVerification = () => {
    setActiveButton("barcode");
    router.push("/verificationpage/barcode-verification");
  };

  const handleHelp = () => {
    router.push("/verificationpage/help-access");
  };

  return (
    <LinearGradient colors={["#dc2626", "#f55023"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Pattern Background */}
          <PatternBackground position="center1" opacity={0.1} />
          <PatternBackground position="center2" opacity={0.1} />

          {/* Main Content */}
          <View style={styles.content}>
            {/* Logo */}
            <Image
              style={styles.logo}
              contentFit="contain"
              source={require("../../assets/logo.png")}
            />

            {/* Title */}
            <Text style={styles.title}>Selamat Datang, di</Text>
            <Text style={styles.titleBold}>Otak-Atik Merah Putih</Text>

            {/* Verification Buttons */}
            <View style={styles.buttonContainer}>
              {/* Email Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  activeButton === "email" && styles.buttonActive,
                ]}
                onPress={handleEmailVerification}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>MASUKKAN EMAIL</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </TouchableOpacity>

              {/* Code Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  activeButton === "code" && styles.buttonActive,
                ]}
                onPress={handleCodeVerification}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>MASUKKAN KODE UNIK</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </TouchableOpacity>

              {/* Barcode Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  activeButton === "barcode" && styles.buttonActive,
                ]}
                onPress={handleBarcodeVerification}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>SCAN BARCODE</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Help Link */}
            <TouchableOpacity onPress={handleHelp} style={styles.helpContainer}>
              <Text style={styles.helpText}>Butuh bantuan akses?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  content: {
    alignItems: "center",
    zIndex: 1,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 16,
    fontWeight: "400",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  titleBold: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 40,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#c41e3a",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  buttonActive: {
    backgroundColor: "#a01730",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  buttonArrow: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  helpContainer: {
    marginTop: 20,
  },
  helpText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

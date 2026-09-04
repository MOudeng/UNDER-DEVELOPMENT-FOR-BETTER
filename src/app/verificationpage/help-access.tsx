import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PatternBackground from "../../components/PatternBackground";

export default function HelpAccess() {
  return (
    <LinearGradient colors={["#dc2626", "#f55023"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Pattern Background - Top Left & Bottom Right */}
          <PatternBackground position="topLeft" />
          <PatternBackground position="bottomRight" />

          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Logo */}
            <Image
              style={styles.logo}
              contentFit="contain"
              source={require("../../assets/logo.png")}
            />

            {/* Title */}
            <Text style={styles.title}>Butuh Bantuan?</Text>

            {/* Help Items */}
            <View style={styles.helpContainer}>
              <View style={styles.helpItem}>
                <Text style={styles.helpIcon}>❓</Text>
                <Text style={styles.helpTitle}>Tidak menemukan kode unik?</Text>
                <Text style={styles.helpDescription}>
                  Kode unik biasanya tercetak pada kemasan atau bagian dalam
                  Block Anda. Pastikan Anda sudah membeli Block original dari
                  Otak-Atik Merah Putih.
                </Text>
              </View>

              <View style={styles.helpItem}>
                <Text style={styles.helpIcon}>📲</Text>
                <Text style={styles.helpTitle}>Email tidak diterima?</Text>
                <Text style={styles.helpDescription}>
                  Periksa folder spam atau junk mail Anda. Jika tetap tidak
                  menemukan, hubungi customer service kami.
                </Text>
              </View>

              <View style={styles.helpItem}>
                <Text style={styles.helpIcon}>📷</Text>
                <Text style={styles.helpTitle}>Masalah scanning barcode?</Text>
                <Text style={styles.helpDescription}>
                  Pastikan kamera dalam kondisi baik, pencahayaan cukup, dan
                  barcode tidak rusak atau tergores.
                </Text>
              </View>

              <View style={styles.helpItem}>
                <Text style={styles.helpIcon}>🆘</Text>
                <Text style={styles.helpTitle}>Masalah lainnya?</Text>
                <Text style={styles.helpDescription}>
                  Hubungi tim customer service kami di email atau WhatsApp yang
                  tersedia di website resmi Otak-Atik Merah Putih.
                </Text>
              </View>
            </View>

            {/* Contact Button */}
            <TouchableOpacity style={styles.contactButton} activeOpacity={0.8}>
              <Text style={styles.contactButtonText}>
                HUBUNGI CUSTOMER SERVICE
              </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    zIndex: 1,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    zIndex: 1,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 30,
  },
  helpContainer: {
    gap: 16,
    marginBottom: 30,
  },
  helpItem: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FFFFFF",
  },
  helpIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  helpDescription: {
    fontSize: 12,
    fontWeight: "400",
    color: "#FFFFFF",
    opacity: 0.9,
    lineHeight: 18,
  },
  contactButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

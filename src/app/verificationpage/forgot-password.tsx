import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PatternBackground from "../../components/PatternBackground";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) {
      alert("Silakan masukkan email");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Link reset password telah dikirim ke email Anda!");
      router.back();
    }, 1500);
  };

  return (
    <LinearGradient colors={["#dc2626", "#f55023"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Pattern Background - Top Left & Bottom Right */}
            <PatternBackground position="topLeft" />
            <PatternBackground position="bottomRight" />

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.title}>Lupa Password?</Text>
              <Text style={styles.subtitle}>
                Masukkan email Anda untuk menerima link reset password
              </Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan email Anda"
                placeholderTextColor="#ccc"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!isLoading}
              />

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendReset}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Memproses..." : "Kirim Link Reset"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  patternTopRight: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    opacity: 0.1,
    overflow: "hidden",
  },
  patternBottomLeft: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 300,
    height: 300,
    opacity: 0.1,
    overflow: "hidden",
  },
  patternImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    alignSelf: "flex-start",
    zIndex: 10,
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(231, 189, 183, 0.85)",
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#dc2626",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
    marginBottom: 24,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#dc2626",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#000",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

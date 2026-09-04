import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import { IdentityService } from "../../services";
import {
  BorderRadius,
  Color,
  FontFamily,
  Gradient,
  Shadow,
} from "../../styles/globalstyle";

type PopupState = {
  visible: boolean;
  title: string;
  message: string;
  tone: "error" | "success";
  actionLabel: string;
};

export default function EmailVerification() {
  const { refreshUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState<PopupState>({
    visible: false,
    title: "",
    message: "",
    tone: "success",
    actionLabel: "OK",
  });

  const closePopup = () => {
    setPopup((current) => ({ ...current, visible: false }));
  };

  useEffect(() => {
    if (!popup.visible || popup.tone !== "success") {
      return;
    }

    const timer = setTimeout(() => {
      closePopup();
      router.push("/main/home");
    }, 1200);

    return () => clearTimeout(timer);
  }, [popup.visible, popup.tone]);

  const openPopup = (nextPopup: Omit<PopupState, "visible">) => {
    setPopup({ ...nextPopup, visible: true });
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      openPopup({
        title: "Data belum lengkap",
        message: "Silakan masukkan email dan password terlebih dahulu.",
        tone: "error",
        actionLabel: "Perbaiki",
      });
      return;
    }

    setIsLoading(true);
    const response = await IdentityService.loginWithEmail(email, password);
    setIsLoading(false);

    if (response.success) {
      await refreshUser();
      openPopup({
        title: "Berhasil diverifikasi",
        message: "Email kamu sudah berhasil diverifikasi.",
        tone: "success",
        actionLabel: "",
      });
      return;
    }

    openPopup({
      title: "Login gagal",
      message: response.error || "Email atau password tidak sesuai.",
      tone: "error",
      actionLabel: "Perbaiki",
    });
  };

  const handleForgotPassword = () => {
    router.push("/verificationpage/forgot-password");
  };

  const handleRegister = () => {
    router.push("/verificationpage/register");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Modal
          transparent
          visible={popup.visible}
          animationType="fade"
          statusBarTranslucent
          onRequestClose={closePopup}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closePopup}
            />

            <View style={styles.modalCard}>
              <View
                style={[
                  styles.modalAccent,
                  popup.tone === "success"
                    ? styles.modalAccentSuccess
                    : styles.modalAccentError,
                ]}
              />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{popup.title}</Text>
                <Text style={styles.modalMessage}>{popup.message}</Text>
              </View>
            </View>
          </View>
        </Modal>

        <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/verificationpage")}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            {/* Main Content Card */}
            <View style={styles.card}>
              {/* Title */}
              <Text style={styles.title}>Selamat Datang</Text>
              <Text style={styles.titleSub}>Kembali!</Text>

              <Text style={styles.subtitle}>
                Silakan masukkan detail akun Anda.
              </Text>
              <Text style={styles.label}>Email atau Username</Text>

              {/* Email/Username Input */}
              <TextInput
                style={styles.input}
                placeholder="Masukkan Email atau Username"
                placeholderTextColor="#ccc"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!isLoading}
              />

              {/* Password Label */}
              <Text style={styles.label}>Password</Text>

              {/* Password Input */}
              <TextInput
                style={styles.input}
                placeholder="Masukkan Password Anda"
                placeholderTextColor="#ccc"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />

              {/* Forgot Password Link */}
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordLink}>Lupa Password</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Memproses..." : "Login"}
                </Text>
              </TouchableOpacity>

              {/* Sign in with Google Button */}
              <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
                <Text style={styles.googleButtonIcon}>M</Text>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>

              {/* Register Link */}
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>
                  Belum punya Akun? Register
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    paddingVertical: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#f45023",
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
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Color.colorWhite,
    borderRadius: BorderRadius.lg,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: Shadow.high,
  },
  modalAccent: {
    height: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  modalAccentSuccess: {
    backgroundColor: Gradient.cta[1],
  },
  modalAccentError: {
    backgroundColor: "#b91c1c",
  },
  modalHeader: {
    gap: 8,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FontFamily.interBold,
    color: "#111827",
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4b5563",
    fontFamily: FontFamily.interMedium,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f45023",
    marginBottom: 4,
  },
  titleSub: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f45023",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f45023",
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
    marginBottom: 16,
  },
  forgotPasswordLink: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f45023",
    textAlign: "right",
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: "#f45023",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  googleButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  googleButtonIcon: {
    color: "#f45023",
    fontSize: 18,
    fontWeight: "700",
  },
  googleButtonText: {
    color: "#333",
    fontSize: 13,
    fontWeight: "600",
  },
  registerLink: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f45023",
    textAlign: "center",
    marginBottom: 40,
  },
});

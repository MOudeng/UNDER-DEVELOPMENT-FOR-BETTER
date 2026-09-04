import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import PatternBackground from "../../components/PatternBackground";
import { useUser } from "../../context/UserContext";
import { IdentityService } from "../../services";

const CODE_LENGTH = 6;

export default function CodeVerification() {
  const { refreshUser } = useUser();

  type PopupState = {
    visible: boolean;
    title: string;
    message: string;
    tone: "error" | "success";
    actionLabel: string;
  };

  const [popup, setPopup] = useState<PopupState>({
    visible: false,
    title: "",
    message: "",
    tone: "success",
    actionLabel: "OK",
  });

  const closePopup = () => setPopup((p) => ({ ...p, visible: false }));

  useEffect(() => {
    if (!popup.visible || popup.tone !== "success") return;

    const t = setTimeout(() => {
      closePopup();
      router.push("/main/home");
    }, 1200);

    return () => clearTimeout(t);
  }, [popup.visible, popup.tone]);

  const openPopup = (next: Omit<PopupState, "visible">) =>
    setPopup({ ...next, visible: true });
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const setInputRef = useCallback((index: number, ref: TextInput | null) => {
    if (ref) {
      inputRefs.current[index] = ref;
    }
  }, []);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text.toUpperCase().slice(-1); // Only last char
    setCode(newCode);

    // Auto-focus to next input
    if (text && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all fields filled
    if (newCode.every((c) => c.length > 0)) {
      const fullCode = newCode.join("");
      handleVerify(fullCode);
    }
  };

  const handleKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode: string) => {
    if (isLoading) return;
    setIsLoading(true);

    const response = await IdentityService.loginWithCode(fullCode);
    setIsLoading(false);

    if (response.success) {
      await refreshUser();
      openPopup({
        title: "Berhasil diverifikasi",
        message: `Kode ${fullCode} berhasil diverifikasi!`,
        tone: "success",
        actionLabel: "",
      });
      return;
    }

    openPopup({
      title: "Kode tidak valid",
      message: response.error || "Kode tidak valid. Coba lagi!",
      tone: "error",
      actionLabel: "OK",
    });
    setCode(Array(CODE_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
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
            <PatternBackground position="bottomRight" opacity={0.15} />

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/verificationpage")}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            {/* Main Card */}
            <View style={styles.card}>
              {/* Logo */}
              <Image
                style={styles.logo}
                contentFit="contain"
                source={require("../../assets/logo.png")}
              />

              {/* Title */}
              <Text style={styles.title}>Masukkan Kode</Text>
              <Text style={styles.subtitle}>
                Yuk, masukkan kode unik yang ada di kotak
              </Text>

              {/* Code Input Fields */}
              <View style={styles.codeInputContainer}>
                {Array(CODE_LENGTH)
                  .fill(null)
                  .map((_, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => setInputRef(index, ref)}
                      style={[
                        styles.codeInput,
                        code[index]
                          ? styles.codeInputFilled
                          : styles.codeInputEmpty,
                      ]}
                      maxLength={1}
                      placeholder=""
                      placeholderTextColor="#999"
                      value={code[index]}
                      onChangeText={(text) => handleCodeChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="default"
                      editable={!isLoading}
                    />
                  ))}
              </View>

              {/* Helper Text */}
              <Text style={styles.helperText}>Masukkan huruf atau angka</Text>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={() => handleVerify(code.join(""))}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.verifyButtonText}>
                  {isLoading ? "Memverifikasi..." : "Verifikasi Kode"}
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
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  backButtonText: {
    color: "#f45023",
    fontSize: 28,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    borderWidth: 1,
    borderColor: "rgba(231, 189, 183, 0.85)",
    zIndex: 5,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f45023",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    width: "100%",
  },
  codeInput: {
    width: 45,
    height: 45,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
  },
  codeInputEmpty: {
    borderColor: "#ccc",
    color: "#999",
  },
  codeInputFilled: {
    borderColor: "#f45023",
    color: "#f45023",
  },
  helperText: {
    fontSize: 11,
    color: "#999",
    opacity: 0.8,
    textAlign: "center",
    marginBottom: 20,
  },
  verifyButton: {
    backgroundColor: "#f45023",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  modalAccent: {
    height: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  modalAccentSuccess: {
    backgroundColor: "#f45023",
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
    fontWeight: "700",
    color: "#111827",
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4b5563",
  },
});

import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PatternBackground from "../../components/PatternBackground";
import { useUser } from "../../context/UserContext";
import { BarcodeValidationService, IdentityService } from "../../services";

export default function BarcodeVerification() {
  const { refreshUser } = useUser();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  type PopupState = {
    visible: boolean;
    title: string;
    message: string;
    tone: "error" | "success";
    actionLabel: string;
    navigateToHome?: boolean;
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
    if (!popup.visible || !popup.navigateToHome) return;

    const t = setTimeout(() => {
      closePopup();
      router.push("/main/home");
    }, 1200);

    return () => clearTimeout(t);
  }, [popup.navigateToHome, popup.visible]);

  const openPopup = (next: Omit<PopupState, "visible">) =>
    setPopup({ ...next, visible: true });

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  const handleBarcodeScanned = (barcode: string) => {
    const barcodeData = BarcodeValidationService.validate(barcode);
    if (barcodeData?.isValid && !isScanning) {
      setScannedCode(barcodeData.code);
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 1000);
    }
  };

  const handleUploadFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        // TODO: Send to backend untuk extract barcode dari image
        // For now, simulate barcode detection
        openPopup({
          title: "Fitur Lanjutan",
          message:
            "Barcode extraction dari image akan diimplementasi di backend 🔄",
          tone: "success",
          actionLabel: "",
        });
      }
    } catch (error) {
      openPopup({
        title: "Error",
        message: "Gagal membuka galeri: " + String(error),
        tone: "error",
        actionLabel: "OK",
      });
    }
  };

  const handleManualScan = () => {
    if (!permission?.granted) {
      requestPermission();
    }
    // Manual scan trigger (optional for testing)
  };

  const handleVerify = async () => {
    if (!scannedCode) {
      openPopup({
        title: "Error",
        message: "Silakan scan barcode terlebih dahulu",
        tone: "error",
        actionLabel: "OK",
      });
      return;
    }

    if (!BarcodeValidationService.isValid(scannedCode)) {
      openPopup({
        title: "Error",
        message: "Barcode tidak valid",
        tone: "error",
        actionLabel: "OK",
      });
      return;
    }

    const response = await IdentityService.loginWithBarcode(scannedCode);
    if (!response.success) {
      openPopup({
        title: "Verifikasi gagal",
        message: response.error || "Barcode tidak dapat digunakan.",
        tone: "error",
        actionLabel: "OK",
      });
      return;
    }

    await refreshUser();

    openPopup({
      title: "Verifikasi Sukses",
      message: `Barcode ${scannedCode} berhasil diverifikasi!`,
      tone: "success",
      actionLabel: "",
      navigateToHome: true,
    });
  };

  const handleReset = () => {
    setScannedCode(null);
    setIsScanning(false);
  };

  return (
    <LinearGradient colors={["#3a3a3a", "#2a2a2a"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
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
          {/* Pattern Background - Top Left & Bottom Right */}
          <PatternBackground position="topLeft" />
          <PatternBackground position="bottomRight" />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/verificationpage")}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Scan Barcode</Text>
            <Text style={styles.subtitle}>Arahkan kamera ke barcode</Text>
          </View>

          {/* Scanner Frame with Real Camera */}
          <View style={styles.scannerContainer}>
            {permission?.granted ? (
              <CameraView
                style={styles.scannerFrame}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: [
                    "qr",
                    "code128",
                    "code39",
                    "code93",
                    "ean13",
                    "ean8",
                  ],
                }}
                onBarcodeScanned={({ data }) => {
                  if (data) {
                    handleBarcodeScanned(data);
                  }
                }}
              />
            ) : (
              <View style={styles.scannerFrame}>
                <View style={styles.scannerContent}>
                  <Text style={styles.scanPlaceholder}>📷</Text>
                  <Text style={styles.scanPlaceholder}>
                    {permission === null
                      ? "Meminta izin kamera..."
                      : !permission.canAskAgain
                        ? "Akses kamera ditolak"
                        : "Meminta izin kamera..."}
                  </Text>
                </View>
              </View>
            )}

            {/* Corner Decorations */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* Show Result if Scanned */}
          {scannedCode && (
            <View style={styles.resultCard}>
              <Text style={styles.resultText}>Kode: {scannedCode}</Text>
            </View>
          )}

          {/* Upload from Gallery Button */}
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadFromGallery}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadButtonIcon}></Text>
            <Text style={styles.uploadButtonText}>UPLOAD FROM GALLERY</Text>
          </TouchableOpacity>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Large Circular Scan Button */}
          <TouchableOpacity
            style={[
              styles.largeCircleButton,
              isScanning && styles.buttonScanning,
            ]}
            onPress={handleManualScan}
            disabled={isScanning}
            activeOpacity={0.8}
          ></TouchableOpacity>

          {/* Verify Button (if barcode scanned) */}
          {scannedCode && (
            <>
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleVerify}
                activeOpacity={0.8}
              >
                <Text style={styles.verifyButtonText}>LANJUT VERIFIKASI</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
                activeOpacity={0.8}
              >
                <Text style={styles.resetButtonText}>SCAN ULANG</Text>
              </TouchableOpacity>
            </>
          )}
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
    alignItems: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 20,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    opacity: 0.8,
  },
  scannerContainer: {
    width: "100%",
    aspectRatio: 1,
    marginBottom: 30,
    position: "relative",
  },
  scannerFrame: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  scanResultContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanResultText: {
    color: "#90EE90",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  scanPlaceholder: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
    fontWeight: "500",
  },
  scannerContent: {
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  resultCard: {
    width: "100%",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(231, 189, 183, 0.85)",
    marginBottom: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  resultText: {
    color: "#90EE90",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
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
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#dc2626",
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 20,
  },
  uploadButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#dc2626",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 30,
  },
  uploadButtonIcon: {
    fontSize: 16,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  spacer: {
    height: 20,
  },
  largeCircleButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginBottom: 40,
  },
  buttonScanning: {
    opacity: 0.7,
  },
  circleInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ff6b35",
    justifyContent: "center",
    alignItems: "center",
  },
  circleIcon: {
    fontSize: 48,
  },
  verifyButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#dc2626",
    alignItems: "center",
    marginBottom: 12,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  resetButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

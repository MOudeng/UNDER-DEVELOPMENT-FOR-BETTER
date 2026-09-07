import { router } from "expo-router";
import { ArrowLeft, Calendar, Edit2 } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";

const createFormData = (user: ReturnType<typeof useUser>["user"]) => ({
  email: user.email || "",
  password: user.password || "",
  namaLengkap: user.name || "",
  gender:
    user.gender === "male"
      ? "Laki-laki"
      : user.gender === "female"
        ? "Perempuan"
        : "",
  tanggalLahir: user.birthDate || "",
  namaSekolah: user.school || "",
  tinggiBadan: user.height ? String(user.height) : "",
  beratBadan: user.weight ? String(user.weight) : "",
  tentangAnak: user.about || "",
});

export default function TentangSayaPage() {
  const { user, updateUser } = useUser();
  const [formData, setFormData] = useState(() => createFormData(user));

  const [isLoading, setIsLoading] = useState(false);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  const generateDays = () => {
    const days: number[] = [];
    for (let i = 1; i <= 31; i++) days.push(i);
    return days;
  };

  const generateMonths = () => {
    return [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
  };

  const generateYears = () => {
    const years: number[] = [];
    const current = new Date().getFullYear();
    for (let y = current; y >= current - 50; y--) years.push(y);
    return years;
  };

  const handleDateConfirm = () => {
    const monthNum = String(selectedMonth + 1).padStart(2, "0");
    const dayStr = String(selectedDay).padStart(2, "0");
    const dateStr = `${dayStr}/${monthNum}/${selectedYear}`;
    handleInputChange("tanggalLahir", dateStr);
    setShowDatePicker(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (
      !formData.email ||
      !formData.namaLengkap ||
      !formData.gender ||
      !formData.tanggalLahir ||
      !formData.namaSekolah
    ) {
      Alert.alert("Error", "Semua field wajib diisi!");
      return false;
    }

    if (formData.password && formData.password.length < 8) {
      Alert.alert("Error", "Password minimal 8 karakter!");
      return false;
    }

    return true;
  };

  const handleConfirm = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    const birthYear = Number(formData.tanggalLahir.split("/")[2]);
    const age = birthYear ? new Date().getFullYear() - birthYear : undefined;

    await updateUser({
      name: formData.namaLengkap.trim(),
      email: formData.email.trim(),
      password: formData.password || undefined,
      gender:
        formData.gender.toLowerCase().includes("laki") ? "male" : "female",
      birthDate: formData.tanggalLahir,
      school: formData.namaSekolah.trim(),
      height: Number(formData.tinggiBadan) || undefined,
      weight: Number(formData.beratBadan) || undefined,
      about: formData.tentangAnak.trim(),
      age,
      isVerified: true,
    });

    setIsLoading(false);
    Alert.alert("Sukses", "Data Anda berhasil disimpan!", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  const handleHelpPress = () => {
    Alert.alert(
      "Bantuan",
      "Hubungi customer service untuk bantuan lebih lanjut",
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Header with Avatar */}
          <View style={styles.headerContainer}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {formData.namaLengkap.charAt(0).toUpperCase() || "A"}
                </Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Edit2 color="#FFFFFF" size={14} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>Tentang Akun</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: kevinsanjaya67@gmail.com"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                editable={!user.email}
              />
            </View>

            {/* Password */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 8 karakter"
                placeholderTextColor="#999"
                secureTextEntry
                value={formData.password}
                onChangeText={(value) => handleInputChange("password", value)}
              />
            </View>

            {/* Nama Lengkap */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Kevin Sanjaya"
                placeholderTextColor="#999"
                value={formData.namaLengkap}
                onChangeText={(value) =>
                  handleInputChange("namaLengkap", value)
                }
              />
            </View>

            {/* Gender */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Gender</Text>
              <TextInput
                style={styles.input}
                placeholder="Pilih: Laki-laki / Perempuan"
                placeholderTextColor="#999"
                value={formData.gender}
                onChangeText={(value) => handleInputChange("gender", value)}
              />
            </View>

            {/* Tanggal Lahir */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tanggal Lahir</Text>
              <View style={styles.dateInputContainer}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.input, { flex: 1, justifyContent: "center" }]}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: formData.tanggalLahir ? "#1a1a1a" : "#999",
                    }}
                  >
                    {formData.tanggalLahir || "Pilih tanggal"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar color="#f45023" size={20} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Nama Sekolah */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Sekolah</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: SD Elektronika"
                placeholderTextColor="#999"
                value={formData.namaSekolah}
                onChangeText={(value) =>
                  handleInputChange("namaSekolah", value)
                }
              />
            </View>

            {/* Tinggi Badan & Berat Badan */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Tinggi Badan</Text>
                <TextInput
                  style={styles.input}
                  placeholder="cm"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={formData.tinggiBadan}
                  onChangeText={(value) =>
                    handleInputChange("tinggiBadan", value)
                  }
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Berat Badan</Text>
                <TextInput
                  style={styles.input}
                  placeholder="kg"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={formData.beratBadan}
                  onChangeText={(value) =>
                    handleInputChange("beratBadan", value)
                  }
                />
              </View>
            </View>

            {/* Tentang Anak Anda */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tentang Anak Anda</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Masukkan deskripsi singkat tentang hobi dan kebiasaan anak Anda. Deskripsi ini akan digunakan untuk analisa bersama dengan hasil akhir test."
                placeholderTextColor="#999"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={formData.tentangAnak}
                onChangeText={(value) =>
                  handleInputChange("tentangAnak", value)
                }
              />
            </View>

            {/* Konfirmasi Button */}
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={isLoading}
              style={[styles.confirmButton, isLoading && { opacity: 0.6 }]}
            >
              <Text style={styles.confirmButtonText}>
                {isLoading ? "MEMPROSES..." : "KONFIRMASI"}
              </Text>
            </TouchableOpacity>

            {/* Help Link */}
            <TouchableOpacity onPress={handleHelpPress}>
              <Text style={styles.helpLink}>Butuh bantuan?</Text>
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft color="#FFFFFF" size={20} strokeWidth={2.5} />
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Pilih Tanggal Lahir</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.helpLink}>Tutup</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.datePickersRow}>
                {[
                  {
                    label: "Tanggal",
                    values: generateDays(),
                    selected: selectedDay,
                    onSelect: setSelectedDay,
                  },
                  {
                    label: "Bulan",
                    values: generateMonths(),
                    selected: generateMonths()[selectedMonth],
                    onSelect: (value: string | number) =>
                      setSelectedMonth(generateMonths().indexOf(String(value))),
                  },
                  {
                    label: "Tahun",
                    values: generateYears(),
                    selected: selectedYear,
                    onSelect: setSelectedYear,
                  },
                ].map((picker) => (
                  <View key={picker.label} style={styles.pickerColumn}>
                    <Text style={styles.pickerLabel}>{picker.label}</Text>
                    <ScrollView style={styles.picker}>
                      {picker.values.map((value) => {
                        const isSelected = picker.selected === value;
                        return (
                          <TouchableOpacity
                            key={String(value)}
                            style={[
                              styles.pickerItem,
                              isSelected && styles.pickerItemSelected,
                            ]}
                            onPress={() => picker.onSelect(value as never)}
                          >
                            <Text
                              style={[
                                styles.pickerItemText,
                                isSelected && styles.pickerItemTextSelected,
                              ]}
                            >
                              {String(value)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.datePickerConfirmButton}
                onPress={handleDateConfirm}
              >
                <Text style={styles.datePickerConfirmButtonText}>Pilih</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#f45023",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#999",
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f45023",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(231, 189, 183, 0.85)",
    padding: 20,
    marginBottom: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color: "#1a1a1a",
  },
  textarea: {
    height: 100,
    paddingTop: 12,
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  calendarButton: {
    position: "absolute",
    right: 12,
    padding: 8,
  },
  twoColumnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmButton: {
    backgroundColor: "#f45023",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  helpLink: {
    fontSize: 13,
    color: "#f45023",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#f45023",
    marginHorizontal: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  // Date Picker Modal Styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  datePickerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "60%",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  datePickersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  pickerColumn: {
    flex: 1,
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  picker: {
    width: "100%",
    maxHeight: 220,
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: "center",
  },
  pickerItemSelected: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 14,
    color: "#1a1a1a",
  },
  pickerItemTextSelected: {
    color: "#f45023",
    fontWeight: "700",
  },
  datePickerConfirmButton: {
    backgroundColor: "#f45023",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  datePickerConfirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});

import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  ArrowLeft,
  Camera,
  Check,
  Edit3,
  Image as ImageIcon,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProfileAvatar from "../components/ProfileAvatar";
import { useProfiles } from "../context/ProfileContext";
import {
  PROFILE_AVATARS,
  type AvatarId,
  type PlayerProfile,
} from "../types/localProfiles";
import BlockBackground from "../components/BlockBackground";

export default function ProfilesPage() {
  const {
    profiles,
    activeProfile,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    selectProfile,
  } = useProfiles();
  const [editingProfile, setEditingProfile] = useState<PlayerProfile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [avatarId, setAvatarId] = useState<AvatarId>("puzzle");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetEditor = () => {
    setEditingProfile(null);
    setIsAdding(false);
    setDisplayName("");
    setAge("");
    setSchoolName("");
    setAvatarId("puzzle");
    setAvatarUri(null);
  };

  const beginEdit = (profile: PlayerProfile) => {
    setEditingProfile(profile);
    setIsAdding(false);
    setDisplayName(profile.displayName);
    setAge(profile.age?.toString() ?? "");
    setSchoolName(profile.schoolName ?? "");
    setAvatarId(profile.avatarId);
    setAvatarUri(profile.avatarUri);
  };

  const beginAdd = () => {
    setEditingProfile(null);
    setIsAdding(true);
    setDisplayName("");
    setAge("");
    setSchoolName("");
    setAvatarId("puzzle");
    setAvatarUri(null);
  };

  const pickPhoto = async (source: "gallery" | "camera") => {
    try {
      if (source === "camera") {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) {
          Alert.alert(
            "Izin kamera ditolak",
            "Izinkan akses kamera di pengaturan perangkat untuk memotret foto profil.",
          );
          return;
        }
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      };
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled) setAvatarUri(result.assets[0].uri);
    } catch (pickError) {
      Alert.alert(
        "Foto gagal diambil",
        pickError instanceof Error ? pickError.message : "Silakan coba lagi.",
      );
    }
  };

  const save = async () => {
    if (!displayName.trim()) {
      Alert.alert("Nama belum diisi", "Masukkan nama panggilan pemain.");
      return;
    }

    const parsedAge = age.trim() ? Number(age) : null;
    if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120)) {
      Alert.alert("Umur tidak valid", "Isi umur 1 sampai 120 tahun atau kosongkan.");
      return;
    }

    const input = {
      displayName,
      avatarId,
      avatarUri,
      age: parsedAge,
      schoolName: schoolName.trim() || null,
    };

    setIsSaving(true);
    try {
      if (editingProfile) {
        await updateProfile(editingProfile.id, input);
        resetEditor();
      } else {
        await createProfile(input);
        router.dismissTo("/main/home");
      }
    } catch (saveError) {
      Alert.alert(
        "Profil gagal disimpan",
        saveError instanceof Error ? saveError.message : "Silakan coba lagi.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const chooseProfile = async (profile: PlayerProfile) => {
    try {
      await selectProfile(profile);
      router.dismissTo("/main/home");
    } catch (selectionError) {
      Alert.alert(
        "Profil gagal dipilih",
        selectionError instanceof Error ? selectionError.message : "Silakan coba lagi.",
      );
    }
  };

  const confirmDelete = (profile: PlayerProfile) => {
    Alert.alert(
      "Hapus profil?",
      `Profil ${profile.displayName} dan seluruh riwayat permainannya akan dihapus permanen.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus profil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProfile(profile.id);
              if (editingProfile?.id === profile.id) resetEditor();
            } catch (deleteError) {
              Alert.alert(
                "Profil gagal dihapus",
                deleteError instanceof Error
                  ? deleteError.message
                  : "Silakan coba lagi.",
              );
            }
          },
        },
      ],
    );
  };

  const editorVisible = profiles.length === 0 || isAdding || editingProfile !== null;

  return (
    <View style={styles.container}>
      <BlockBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          {router.canGoBack() ? (
            <Pressable
              style={styles.backButton}
              accessibilityRole="button"
              onPress={() => router.back()}
            >
              <ArrowLeft color="#f45023" size={20} />
              <Text style={styles.backButtonText}>Kembali</Text>
            </Pressable>
          ) : null}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <UserRound color="#FFFFFF" size={30} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Profil Pemain</Text>
              <Text style={styles.subtitle}>
                Pilih profil pemain. Umur dan asal sekolah boleh dikosongkan.
              </Text>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {profiles.map((profile) => {
            const selected = activeProfile?.id === profile.id;
            return (
              <View key={profile.id} style={[styles.profileCard, selected && styles.selectedCard]}>
                <Pressable style={styles.profileMain} onPress={() => chooseProfile(profile)}>
                  <ProfileAvatar
                    avatarId={profile.avatarId}
                    avatarUri={profile.avatarUri}
                    size={52}
                  />
                  <View style={styles.profileText}>
                    <Text style={styles.profileName}>{profile.displayName}</Text>
                    <Text style={styles.profileStatus}>
                      {selected ? "Profil aktif" : "Ketuk untuk memilih"}
                    </Text>
                    {profile.age || profile.schoolName ? (
                      <Text style={styles.profileDetails}>
                        {[
                          profile.age ? `${profile.age} tahun` : null,
                          profile.schoolName,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </Text>
                    ) : null}
                  </View>
                  {selected ? <Check color="#16a34a" size={22} strokeWidth={3} /> : null}
                </Pressable>
                <View style={styles.profileActions}>
                  <Pressable style={styles.iconButton} onPress={() => beginEdit(profile)}>
                    <Edit3 color="#2563eb" size={18} />
                  </Pressable>
                  <Pressable
                    style={[styles.iconButton, styles.deleteButton]}
                    onPress={() => confirmDelete(profile)}
                  >
                    <Trash2 color="#dc2626" size={18} />
                  </Pressable>
                </View>
              </View>
            );
          })}

          {editorVisible ? (
            <View style={styles.editorCard}>
              <Text style={styles.editorTitle}>
                {editingProfile ? "Ubah Profil" : "Tambah Profil"}
              </Text>
              <Text style={styles.fieldLabel}>Nama panggilan</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Contoh: Bima"
                maxLength={30}
                autoCapitalize="words"
                style={styles.input}
              />
              <Text style={styles.fieldLabel}>Umur (opsional)</Text>
              <TextInput
                value={age}
                onChangeText={(value) => setAge(value.replace(/[^0-9]/g, ""))}
                placeholder="Contoh: 9"
                keyboardType="number-pad"
                maxLength={3}
                style={styles.input}
              />
              <Text style={styles.fieldLabel}>Asal sekolah (opsional)</Text>
              <TextInput
                value={schoolName}
                onChangeText={setSchoolName}
                placeholder="Contoh: SD Harapan"
                maxLength={80}
                autoCapitalize="words"
                style={styles.input}
              />
              <Text style={styles.fieldLabel}>Foto atau ikon profil</Text>
              <View style={styles.photoRow}>
                <ProfileAvatar avatarId={avatarId} avatarUri={avatarUri} size={72} />
                <View style={styles.photoActions}>
                  <Pressable
                    style={styles.photoButton}
                    onPress={() => pickPhoto("gallery")}
                  >
                    <ImageIcon color="#f45023" size={18} />
                    <Text style={styles.photoButtonText}>Galeri</Text>
                  </Pressable>
                  <Pressable
                    style={styles.photoButton}
                    onPress={() => pickPhoto("camera")}
                  >
                    <Camera color="#f45023" size={18} />
                    <Text style={styles.photoButtonText}>Kamera</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.avatarHint}>
                Atau pilih salah satu dari {PROFILE_AVATARS.length} ikon:
              </Text>
              <View style={styles.avatarGrid}>
                {PROFILE_AVATARS.map((avatar) => (
                  <Pressable
                    key={avatar.id}
                    accessibilityLabel={`Ikon ${avatar.label}`}
                    onPress={() => {
                      setAvatarId(avatar.id);
                      setAvatarUri(null);
                    }}
                    style={[
                      styles.avatarOption,
                      !avatarUri &&
                        avatarId === avatar.id &&
                        styles.avatarOptionSelected,
                    ]}
                  >
                    <Text style={styles.avatarOptionEmoji}>{avatar.emoji}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.editorActions}>
                {profiles.length > 0 ? (
                  <Pressable style={styles.secondaryButton} onPress={resetEditor}>
                    <Text style={styles.secondaryButtonText}>Batal</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  disabled={isSaving}
                  style={[styles.primaryButton, isSaving && styles.disabledButton]}
                  onPress={save}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSaving ? "Menyimpan..." : "Simpan Profil"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.addButton} onPress={beginAdd}>
              <Plus color="#f45023" size={20} />
              <Text style={styles.addButtonText}>Tambah Profil</Text>
            </Pressable>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f6f6" },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 36 },
  backButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backButtonText: { color: "#c2410c", fontSize: 15, fontWeight: "700" },
  header: {
    backgroundColor: "#f45023",
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: { color: "#FFFFFF", fontSize: 25, fontWeight: "900" },
  subtitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 18, marginTop: 4 },
  errorText: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    padding: 12,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ead8d4",
    overflow: "hidden",
  },
  selectedCard: { borderColor: "#16a34a", borderWidth: 2 },
  profileMain: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  profileText: { flex: 1 },
  profileName: { color: "#4d3532", fontSize: 17, fontWeight: "800" },
  profileStatus: { color: "#8f7b77", fontSize: 12, marginTop: 3 },
  profileDetails: { color: "#8f7b77", fontSize: 11, marginTop: 3 },
  profileActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  iconButton: { padding: 9, borderRadius: 10, backgroundColor: "#eff6ff" },
  deleteButton: { backgroundColor: "#fef2f2" },
  editorCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, gap: 10 },
  editorTitle: { color: "#4d3532", fontSize: 19, fontWeight: "900" },
  fieldLabel: { color: "#6b5a57", fontSize: 13, fontWeight: "700", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#d9cbc8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#332421",
    fontSize: 16,
  },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  photoActions: { flex: 1, flexDirection: "row", gap: 8 },
  photoButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f45023",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoButtonText: { color: "#f45023", fontSize: 13, fontWeight: "800" },
  avatarHint: { color: "#8f7b77", fontSize: 12, marginTop: 4 },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  avatarOption: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ead8d4",
  },
  avatarOptionSelected: { borderColor: "#f45023", backgroundColor: "#fff1ed" },
  avatarOptionEmoji: { fontSize: 26 },
  editorActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  primaryButton: {
    flex: 1,
    backgroundColor: "#f45023",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
  disabledButton: { opacity: 0.55 },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#f45023",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#f45023", fontWeight: "800" },
  addButton: {
    borderWidth: 1,
    borderColor: "#f45023",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addButtonText: { color: "#f45023", fontWeight: "800" },
});

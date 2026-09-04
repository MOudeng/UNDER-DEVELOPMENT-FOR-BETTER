import { useRouter } from "expo-router";
import {
  AlertCircle,
  BarChart3,
  ChevronRight,
  History,
  Lock,
  LogOut,
  User,
  UserCheck,
  X,
} from "lucide-react-native";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../context/UserContext";

export default function AkunPage() {
  const router = useRouter();
  const { user, logout } = useUser();
  const hasProfilePhoto = Boolean(user.profilePhoto?.trim());

  const handleDismissWarning = () => {
    // Optional: dismiss warning
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin keluar?", [
      {
        text: "Batal",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Keluar",
        onPress: async () => {
          await logout();
          router.replace("/splashscreen");
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* HEADER PROFILE */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            padding: 16,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          {/* Avatar Placeholder */}
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#E8E8E8",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
              marginTop: 20,
              overflow: "hidden",
            }}
          >
            {hasProfilePhoto ? (
              <Image
                source={{ uri: user.profilePhoto! }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <User color="#999" size={46} strokeWidth={2.3} />
            )}
          </View>

          {/* Name & Email */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: 4,
            }}
          >
            {user.name}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#666",
              marginBottom: 12,
            }}
          >
            {user.email || "belum@terverifikasi.com"}
          </Text>

          {/* Verification Status Badge */}
          {!user.isVerified && (
            <View
              style={{
                backgroundColor: "#FEE5E5",
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <AlertCircle color="#f45023" size={18} strokeWidth={2.5} />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#f45023",
                  }}
                >
                  Belum Terverifikasi
                </Text>
              </View>
              <TouchableOpacity onPress={handleDismissWarning}>
                <X color="#f45023" size={18} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          )}

          {user.isVerified && (
            <View
              style={{
                backgroundColor: "#E8F5E9",
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
              }}
            >
              <AlertCircle color="#2E7D32" size={18} strokeWidth={2.5} />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#2E7D32",
                }}
              >
                Terverifikasi
              </Text>
            </View>
          )}
        </View>

        {/* MENU ITEMS */}
        {/* Verifikasi Akun / Tentang Saya */}
        {!user.isVerified && (
          <TouchableOpacity
            onPress={() => router.push("/tentang-saya")}
            style={{
              backgroundColor: "#FFFFFF",
              marginHorizontal: 12,
              marginBottom: 12,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
              }}
            >
              <UserCheck color="#f45023" size={22} strokeWidth={2.5} />
              <Text
                style={{
                  marginLeft: 16,
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#1a1a1a",
                  flex: 1,
                }}
              >
                VERIFIKASI AKUN
              </Text>
            </View>
            <ChevronRight color="#999" size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {user.isVerified && (
          <TouchableOpacity
            onPress={() => router.push("/tentang-saya")}
            style={{
              backgroundColor: "#FFFFFF",
              marginHorizontal: 12,
              marginBottom: 12,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
              }}
            >
              <UserCheck color="#f45023" size={22} strokeWidth={2.5} />
              <Text
                style={{
                  marginLeft: 16,
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#1a1a1a",
                  flex: 1,
                }}
              >
                TENTANG SAYA
              </Text>
            </View>
            <ChevronRight color="#999" size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Riwayat */}
        <TouchableOpacity
          onPress={() =>
            user.isVerified
              ? router.push("/riwayat")
              : Alert.alert(
                  "Info",
                  "Selesaikan verifikasi akun terlebih dahulu",
                )
          }
          style={{
            backgroundColor: "#FFFFFF",
            marginHorizontal: 12,
            marginTop: 16,
            marginBottom: 12,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flex: 1,
            }}
          >
            <History color="#f45023" size={22} strokeWidth={2.5} />
            <Text
              style={{
                marginLeft: 16,
                fontSize: 14,
                fontWeight: "600",
                color: "#1a1a1a",
              }}
            >
              RIWAYAT
            </Text>
            {!user.isVerified && (
              <Lock color="#f45023" size={18} strokeWidth={2.5} />
            )}
          </View>
          <ChevronRight color="#999" size={20} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Data Analisa */}
        <TouchableOpacity
          onPress={() =>
            user.isVerified
              ? router.push("/data-analisa")
              : Alert.alert(
                  "Info",
                  "Selesaikan verifikasi akun terlebih dahulu",
                )
          }
          style={{
            backgroundColor: "#FFFFFF",
            marginHorizontal: 12,
            marginBottom: 24,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flex: 1,
            }}
          >
            <BarChart3 color="#f45023" size={22} strokeWidth={2.5} />
            <Text
              style={{
                marginLeft: 16,
                fontSize: 14,
                fontWeight: "600",
                color: "#1a1a1a",
              }}
            >
              DATA ANALISA
            </Text>
            {!user.isVerified && (
              <Lock color="#f45023" size={18} strokeWidth={2.5} />
            )}
          </View>
          <ChevronRight color="#999" size={20} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: "#f45023",
            marginHorizontal: 12,
            marginBottom: 16,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <LogOut color="#FFFFFF" size={20} strokeWidth={2.5} />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 14,
              fontWeight: "700",
              color: "#FFFFFF",
            }}
          >
            KELUAR
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

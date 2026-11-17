import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { getAvatarEmoji } from "../types/localProfiles";

type Props = {
  avatarId: string;
  avatarUri?: string | null;
  size: number;
};

export default function ProfileAvatar({ avatarId, avatarUri, size }: Props) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={styles.photo}
          contentFit="cover"
        />
      ) : (
        <Text style={{ fontSize: size * 0.54 }}>{getAvatarEmoji(avatarId)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: "#fff1ed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photo: { width: "100%", height: "100%" },
});

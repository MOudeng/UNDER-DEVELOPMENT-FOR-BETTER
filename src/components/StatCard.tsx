import React from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { FontFamily } from "../styles/globalstyle";

type Props = {
  icon: React.ReactNode;
  label: string;
  value?: string | number;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: (e: GestureResponderEvent) => void;
};

export default function StatCard({
  icon,
  label,
  value = "0",
  accentColor = "#f45023",
  style,
  onPress,
}: Props) {
  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: accentColor }]}>
          {icon}
        </View>

        <Text style={styles.label}>{label}</Text>
      </View>

      <Text style={styles.value}>{value}</Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(231, 189, 183, 0.85)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontFamily: FontFamily.interSemiBold,
    color: "#999",
    letterSpacing: 0.5,
  },
  value: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 36,
    fontFamily: FontFamily.interBold,
    color: "#333",
  },
});

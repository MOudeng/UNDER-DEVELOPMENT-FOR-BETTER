import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProfiles } from "../context/ProfileContext";

export default function SplashScreen() {
  const { activeProfile, isGuest, isLoading, termsAccepted } = useProfiles();
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),

      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (!termsAccepted) router.replace("/Welcomepage/welcomepage");
      else if (activeProfile || isGuest) router.replace("/main/home");
      else router.replace("/main/akun");
    }, 1800);

    return () => clearTimeout(timer);
  }, [activeProfile, isGuest, isLoading, termsAccepted]);

  return (
    <LinearGradient colors={["#dc2626", "#f55023"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <Image
              style={styles.logo}
              contentFit="contain"
              source={require("../assets/logo.png")}
            />
            <Text style={styles.title}>BrainBlock.id</Text>
          </Animated.View>
        </View>
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

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  logo: {
    width: 170,
    height: 170,
  },
  title: {
    marginTop: 14,
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: 0.4,
    textAlign: "center",
  },
});

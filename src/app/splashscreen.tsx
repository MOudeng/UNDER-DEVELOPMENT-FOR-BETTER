// @ts-ignore React types are resolved from the project's installed dependencies.
import React, { useEffect, useRef } from "react";
// @ts-ignore React Native types are resolved from the project's installed dependencies.
import { Animated, StyleSheet, View } from "react-native";

import { Image } from "expo-image";
// @ts-ignore The Expo bundler resolves the PNG asset at runtime.
const logo = require("../assets/logo.png");
// Resolve the router at runtime so TypeScript does not require expo-router's declarations here.
// @ts-ignore expo-router is resolved by the Expo runtime.
const { router } = require("expo-router");
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthenticationService } from "../services";

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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

    const timer = setTimeout(async () => {
      const isAuthenticated = await AuthenticationService.isAuthenticated();
      router.replace(
        isAuthenticated ? "/main/home" : "/Welcomepage/welcomepage",
      );
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim]);

  return React.createElement(
    View,
    { style: styles.container },
    React.createElement(
      SafeAreaView,
      { style: styles.safeArea },
      React.createElement(
        View,
        { style: styles.content },
        React.createElement(
          Animated.View,
          {
            style: {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          },
          React.createElement(Image, {
            style: styles.logo,
            contentFit: "contain",
            source: logo,
          }),
        ),
      ),
    ),
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#dc2626",
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
});

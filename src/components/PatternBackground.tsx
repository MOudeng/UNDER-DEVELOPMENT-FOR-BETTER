import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

interface PatternBackgroundProps {
  position:
    | "topLeft"
    | "topRight"
    | "bottomLeft"
    | "bottomRight"
    | "custompattern"
    | "custombottomleft"
    | "center1"
    | "center2";

  opacity?: number;
  rotate?: string;
}

export default function PatternBackground({
  position,
  opacity = 0.08,
  rotate = "0deg",
}: PatternBackgroundProps) {
  const positions = {
    topLeft: styles.topLeft,
    topRight: styles.topRight,
    bottomLeft: styles.bottomLeft,
    bottomRight: styles.bottomRight,
    custompattern: styles.custompattern,
    custombottomleft: styles.custombottomleft,
    center1: styles.center1,
    center2: styles.center2,
  };

  return (
    <View style={[styles.container, positions[position], { opacity }]}>
      <Image
        style={[styles.patternImage, { transform: [{ rotate }] }]}
        contentFit="cover"
        source={require("../assets/pattern.svg")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 200,
    height: 200,
    zIndex: 0,
  },
  topLeft: {
    top: -50,
    left: -50,
  },
  topRight: {
    top: 0,
    right: -100,
    transform: [
      {
        translateY: 20,
      },
    ],
  },
  bottomLeft: {
    bottom: -50,
    left: -25,
  },
  bottomRight: {
    bottom: -50,
    right: -50,
  },
  patternImage: {
    width: "100%",
    height: "100%",
  },
  custompattern: {
    bottom: -30,
    left: -20,
    transform: [
      {
        translateX: -50,
      },
      {
        translateY: -150,
      },
    ],
  },
  custombottomleft: {
    transform: [
      {
        translateX: -70,
      },
      {
        translateY: -200,
      },
    ],
  },
  center1: {
    top: "0%",
    left: "50%",
    transform: [
      {
        translateX: -20,
      },
      {
        translateY: -100,
      },
    ],
    width: 350,
    height: 400,
  },
  scrollviewLayout: {},
  center2: {
    bottom: "0%",
    left: "50%",
    transform: [
      { translateX: -150 },
      {
        translateY: 100,
      },
    ],
    width: 350,
    height: 400,
  },
});

import { Tabs } from "expo-router";
import React from "react";
import { ColorValue, Text } from "react-native";

export default function MainLayout() {
  return React.createElement(
    Tabs,
    {
      screenOptions: {
        headerShown: false,
        tabBarActiveTintColor: "#f45023",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E0E0E0",
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
      },
    },
    React.createElement(Tabs.Screen, {
      name: "home",
      options: {
        title: "Beranda",
        tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) =>
          React.createElement(Text, { style: { color, fontSize: size } }, "⌂"),
      },
    }),
    React.createElement(Tabs.Screen, {
      name: "akun",
      options: {
        title: "User",
        tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) =>
          React.createElement(Text, { style: { color, fontSize: size } }, "●"),
      },
    }),
  );
}

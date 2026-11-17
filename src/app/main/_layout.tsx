import { Tabs } from "expo-router";
import { Home, UserRound } from "lucide-react-native";
import React from "react";
import { ColorValue } from "react-native";

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
          React.createElement(Home, { color: color as string, size }),
      },
    }),
    React.createElement(Tabs.Screen, {
      name: "akun",
      options: {
        title: "Akun",
        tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) =>
          React.createElement(UserRound, { color: color as string, size }),
      },
    }),
  );
}

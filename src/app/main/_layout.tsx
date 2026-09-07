// @ts-expect-error expo-router is provided by the Expo runtime but may not be
// available to the editor's TypeScript module resolver.
import { Tabs } from "expo-router";
// @ts-expect-error React is provided by the Expo runtime but may not be
// available to the editor's TypeScript module resolver.
import React from "react";

const Text = "Text" as any;

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
        tabBarIcon: ({ color, size }: { color: string; size: number }) =>
          React.createElement(Text, { style: { color, fontSize: size } }, "⌂"),
      },
    }),
    React.createElement(Tabs.Screen, {
      name: "akun",
      options: {
        title: "User",
        tabBarIcon: ({ color, size }: { color: string; size: number }) =>
          React.createElement(Text, { style: { color, fontSize: size } }, "●"),
      },
    }),
  );
}

import { Stack } from "expo-router";

export default function WelcomepageLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    />
  );
}

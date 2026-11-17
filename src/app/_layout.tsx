import { Stack } from "expo-router";
import { ProfileProvider } from "../context/ProfileContext";
import { UserProvider } from "../context/UserContext";

export default function Layout() {
  return (
    <UserProvider>
      <ProfileProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
          }}
        />
      </ProfileProvider>
    </UserProvider>
  );
}

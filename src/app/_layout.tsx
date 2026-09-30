import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0F172A" },
        }}
      >
        {/* Головна таб-навігація (Bottom Tabs) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Повноекранний екран співбесіди (поверх табів) */}
        <Stack.Screen
          name="interview"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

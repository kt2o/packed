import { Stack } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import { Provider as PaperProvider } from "react-native-paper";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import React from "react";

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </ClerkProvider>
  );
}

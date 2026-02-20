import { Stack, Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import React from "react";

export default function ProtectedLayout() {
  const { isSignedIn } = useAuth();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

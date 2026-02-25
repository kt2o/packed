
import { useEffect } from "react";

import * as Location from "expo-location";

import { Stack, Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import React from "react";


export default function ProtectedLayout() {
  const router = useRouter();

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
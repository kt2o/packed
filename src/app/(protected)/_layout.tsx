import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import * as Location from "expo-location";

export default function ProtectedLayout() {
  const router = useRouter();

  useEffect(() => {
    async function checkPermission() {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        // Only redirect if they haven't dealt with permissions yet
        router.replace("/location-permission");
      }
    }
    checkPermission();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

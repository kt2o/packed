import { useEffect } from "react";
import { Stack, Redirect } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";

import { registerForPushNotificationsAsync } from "src/lib/notifications";
import { saveTokenToSupabase } from "src/lib/notifications";

/**
 * Protected route layout.
 *
 * Ensures only authenticated users can access protected routes and
 * registers push notifications once the user is available.
 */
export default function ProtectedLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  // 1. Wait for Clerk to load
  if (!isLoaded) return null;

  // 2. Redirect if not signed in
  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  // 3. Register push token AFTER user is ready
  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().then((token) => {
      console.log("Got push token:", token);
      saveTokenToSupabase(token, user.id);
    });
  }, [user]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

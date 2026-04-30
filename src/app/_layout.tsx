import { Slot, Stack } from "expo-router";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { ActivityIndicator, Provider as PaperProvider } from "react-native-paper";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { SupabaseProvider, useSupabase } from "src/providers/SupabaseProvider";
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync, saveTokenToSupabase } from "src/lib/notifications";
import { useRouter } from "expo-router";
import { Platform } from "react-native";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}


/**
 * Private stack component that decides which flow to render based on user auth.
 *
 * It also initializes push notification registration once Clerk is ready.
 */
function RootStack() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const supabase = useSupabase();

  // Save token ONLY after Clerk is loaded and user is signed in
 useEffect(() => {
  if (Platform.OS === "web") return;
  if (!isLoaded || !isSignedIn || !user) return;

  (async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await saveTokenToSupabase(supabase, token, user.id);
    }
  })();
}, [isLoaded, isSignedIn]);

  /**
   * Render the protected auth flow for the root navigator.
   */


  if (!isLoaded) return <ActivityIndicator />;

  return (
    <PaperProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={!!isSignedIn}>
          <Stack.Screen name="(protected)" />
        </Stack.Protected>
      </Stack>
    </PaperProvider>
  );
}

/**
 * Root layout for the app.
 *
 * This module wires together Clerk authentication, Supabase, and Expo
 * notifications. It chooses the authenticated or unauthenticated flow based
 * on the user's sign-in state, and also listens for notification responses
 * to route the user into the app.
 */
export default function RootLayout() {
  const router = useRouter();

  // Notification tap handler
  useEffect(() => {
  if (Platform.OS === "web") return;

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const route = response.notification.request.content.data?.route;
    if (route === "todo") {
      router.replace("/(protected)/(tabs)/todo");
    }
  });

  return () => sub.remove();
}, []);

  /**
   * Root application container. Wraps the app in Clerk and Supabase providers
   * so that auth and database clients are available to child routes.
   */

  return (
    <ClerkProvider
    publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
    tokenCache={tokenCache}>
      <SupabaseProvider>
        <RootStack />
      </SupabaseProvider>
    </ClerkProvider>
  );
}
import { Slot, Stack } from "expo-router";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { ActivityIndicator, Provider as PaperProvider } from "react-native-paper";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { SupabaseProvider, useSupabase } from "src/providers/SupabaseProvider";
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync, saveTokenToSupabase } from "src/lib/notifications";
import { useRouter } from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function RootStack() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const supabase = useSupabase();

  // ⭐ Save token ONLY after Clerk is loaded and user is signed in
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await saveTokenToSupabase(supabase, token, user.id);
      }
    })();
  }, [isLoaded, isSignedIn]);

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

export default function RootLayout() {
  const router = useRouter();

  // Notification tap handler
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route;
      if (route === "todo") {
        router.replace("/(protected)/(tabs)/todo");
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SupabaseProvider>
        <RootStack />
      </SupabaseProvider>
    </ClerkProvider>
  );
}

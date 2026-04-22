
import { Slot, Stack } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import {
  ActivityIndicator,
  Provider as PaperProvider,
} from "react-native-paper";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { useAuth } from "@clerk/clerk-expo";
import { SupabaseProvider } from "src/providers/SupabaseProvider";
import * as Notifications from 'expo-notifications';
import { useRouter, useLocalSearchParams } from "expo-router";

import { useEffect } from 'react';
import { registerForPushNotificationsAsync, saveTokenToSupabase } from "src/lib/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});



function RootStack() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <ActivityIndicator />;
  }

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
  useEffect(() => {
      const sub = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const route = response.notification.request.content.data?.route;

          if (route === "todo") {
            router.replace("/(protected)/(tabs)/todo");
          }

        }
      );

      return () => sub.remove();
    }, []);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      saveTokenToSupabase(token);
    });
  }, []);

  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SupabaseProvider>
        <RootStack />
      </SupabaseProvider>
    </ClerkProvider>
  );
}

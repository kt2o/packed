import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web") return null;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;

    if (finalStatus !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      finalStatus = newStatus;
    }

    if (finalStatus !== "granted") return null;

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    return tokenResponse.data;

  } catch (error) {
    console.error("Failed to get push token:", error);
    return null;
  }
}

export async function saveTokenToSupabase(supabase, token, userId) {
  if (!token || !userId) return;

  await supabase
    .from("user_push_notifications")
    .upsert({
      user_id: userId,
      expo_push_token: token,
    });
}
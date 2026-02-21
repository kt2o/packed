import { View, Text, Button } from "react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React from "react";

export default function LocationPermissionScreen() {
  const router = useRouter();

  async function requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === "granted") {
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      router.replace("/home");
    } else {
      alert("Location is required to use check-in features.");
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Enable Location
      </Text>

      <Text style={{ marginBottom: 20 }}>
        We use your location only to verify that you're at a study spot.
      </Text>

      <Button title="Allow Location Access" onPress={requestPermission} />
    </View>
  );
}

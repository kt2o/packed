import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { spots } from "../../config/studySpots";
import { getCurrentLocation } from "../../lib/location";
import { useSupabase } from "src/lib/supabase-client";
import { getDistanceMeters } from "../../lib/distance";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

export default function SpotScreen() {
  console.log("Spot Details screen mounted");
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  const DEV_MODE = true;

  const DEV_USER_ID = "6759bbaf-0fad-4c73-910f-1ee43570d3d1";

  const spot = spots.find((s) => s.id === id);

  const supabase = useSupabase();

  async function handleCheckin() {
    //Check for Location
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status !== "granted") {
      //Ask for location again
      const { status: newStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (newStatus !== "granted") {
        router.push("/location-permission");
        return;
      }
    }

    if (!spot) {
      return <Text>Spot not found.</Text>;
    }

    //Get spot location
    const spotLat = Number(spot.lat);
    const spotLng = Number(spot.lng);


    //user location
    const location = await getCurrentLocation();
    const userLat = location.coords.latitude;
    const userLng = location.coords.longitude;

    //Get distance
    const distance = getDistanceMeters(userLat, userLng, spotLat, spotLng);
    console.log("Distance:", distance);

    if (isNaN(distance) || distance > spot.radius) {
      alert("You are not close enough to this study spot.");
      router.replace({ pathname: "/submit", params: { verified: "false" } });
      return;
    }


 //Pull user
 let userId;
 if (DEV_MODE) {
   userId = DEV_USER_ID;
 } else{
  const {
   data: {user},
  } = await supabase.auth.getUser();
 if (!user) {
   alert("You must be logged in to check in.");
   return;
   }
   userId = user.id;
}
  //update supabase
  const { error } = await supabase
  .from("locations")
  .insert({
  user_id: userId,
  spot_id: spot.id,
  lat: location.coords.latitude,
  lng: location.coords.longitude,
  updated_at: new Date().toISOString(),
  });


  if (error) {
  console.log("Insert error:", error);
  alert("Could not check in.");
  router.replace({ pathname: "/submit", params: { verified: "false" } });
  return;
  }
    //alert("Checked in successfully!");
    router.replace({ pathname: "/submit", params: { verified: "true" } });
  }
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>{spot.displayName}</Text>
        <Text style={styles.subtitle}>Radius: {spot.radius} meters</Text>
        <Pressable
          onPress={handleCheckin}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
          ]}
        >
          <Text style={styles.primaryButtonText}>I’m here</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.secondaryButtonText}>← Back to Submit</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F0FF",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,

    shadowColor: "#6320c7",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 18,

    elevation: 8,

    borderWidth: 1,
    borderColor: "#E7DEFF",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2F1C6B",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#6B6B6B",
    marginBottom: 22,
  },

  primaryButton: {
    backgroundColor: "#6A4BCB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  secondaryButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#6A4BCB",
    fontSize: 14,
    fontWeight: "600",
  },
});

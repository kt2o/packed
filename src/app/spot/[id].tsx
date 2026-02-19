import { useLocalSearchParams } from "expo-router";
import { View, Text, Button } from "react-native";
import { spots } from "../../config/studySpots";
import { getCurrentLocation } from "../../lib/location";
import { useSupabase } from "../../lib/supabase-client";
import { getDistanceMeters } from "../../lib/distance";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

export default function SpotScreen(){
  console.log("Spot Details screen mounted");
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const supabase = useSupabase();
  const DEV_MODE = true;

  // Replace this with your actual dev user UUID from Supabase
  const DEV_USER_ID = "6759bbaf-0fad-4c73-910f-1ee43570d3d1";


  const spot = spots.find((s) => s.id === id);

  if (!spot) {
  return <Text>Spot not found.</Text>; }

  async function handleCheckin(){
 //Check for Location
 const { status } = await Location.getForegroundPermissionsAsync();

 if (status !== "granted"){

  //Ask for location again
  const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
  if (newStatus !== "granted") {
   router.push("/location-permission");
   return;
  }

  }
  //Get location
  const location = await getCurrentLocation();

  //Get distance
  const distance = getDistanceMeters(
  location.coords.latitude,
  location.coords.longitude,
  spot.lat,
  spot.lng
  );

 if (distance > spot.radius) {
 alert("You are not close enough to this study spot.");
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
  await supabase.from("locations").insert({
  user_id: userId,
  spot_id: spot.id,
  lat: location.coords.latitude,
  lng: location.coords.longitude,
  updated_at: new Date().toISOString(),
  });


  alert("Checked in successfully!");
  router.replace({
  pathname: "/submit",
  params: { location: spot.id },
  });


  }
    return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        {spot.displayName}
      </Text>
      <Text style={{ marginTop: 10 }}>
        Radius: {spot.radius} meters
      </Text>
      <Button title="I'm here" onPress={handleCheckin} />
    </View>
    );

   }

















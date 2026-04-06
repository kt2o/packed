import { useEffect, useMemo, useState } from "react";
import { useSupabase } from "../../../lib/supabase-client";
import type { Status } from "../../../types/status";
import { useLocalSearchParams, useRouter } from "expo-router";
import { spots } from "src/config/studySpots";
import { useUser } from "@clerk/clerk-expo";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";

import { RadioButton } from "react-native-paper";
import LocationDropDown from "../../../components/LocationDropDown";

export default function SubmitScreen() {
  const router = useRouter();
  const { user } = useUser();
  const supabase = useSupabase();


  const { verified, id, floorId, status } = useLocalSearchParams<{
    verified: string;
    id?: string;
    floorId?: string;
    status?: string;
  }>();

  const [selectedSpot, setSelectedSpot] = useState<string>("");
  const [selectedFloor, setSelectedFloor] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<Status>("empty");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (verified === "true") {
      // 1. Sync the UI state (for the form display)
      console.log("URL Params received:", { id, floorId, status });
      if (id) setSelectedSpot(String(id));
      if (floorId) setSelectedFloor(String(floorId));
      if (status) setSelectedStatus(status as Status);

      // 2. Pass the params DIRECTLY to the function
      // instead of waiting for state to update
      submitToSupabase(id, floorId, status as Status);
    }
  }, [verified]);

  const locations = useMemo(() => {
    return spots.map((spot) => ({
      label: spot.displayName,
      value: String(spot.id),
    }));
  }, [spots]);

  const floors = useMemo(
    () => spots.find((s) => s.id === selectedSpot)?.floors ?? [],
    [selectedSpot]
  );

  const handleSubmit = async () => {
    if (!selectedSpot) {
      Alert.alert("Error", "No location was provided.");
      return;
    }

    setSubmitting(true);

    router.push({
      pathname: "/spot/[id]",
      params: {
      id: selectedSpot,
      floorId: selectedFloor,
      status: selectedStatus,
      returnTo: "submit" },
    });

  };

  const submitToSupabase = async (passedId?: string, passedFloorId?: string, passedStatus?: Status) => {
    const userId = user.id;

    // Use the passed arguments OR the state as a fallback
    const finalSpotId = passedId || selectedSpot;
    const finalFloorId = passedFloorId || selectedFloor;
    const finalStatus = passedStatus || selectedStatus;

    const { error } = await supabase.from("study_spot_status").insert([
      {
        spot_id: finalSpotId,
        status: finalStatus,
        user_id: userId,
        floor_id: finalFloorId,
      },
    ]);

    setSubmitting(false);

    if (error) {
      console.error("Insert error:", error);
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Success", `Reported as ${finalStatus}`, [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollView}
    >
      <Text style={styles.title}>Study Location Status</Text>
      <LocationDropDown
        label={"Location"}
        data={locations}
        value={selectedSpot}
        onChange={setSelectedSpot}
        placeholder="Where are you?"
      ></LocationDropDown>

      {floors.length > 0 && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Which floor are you on?</Text>
          <RadioButton.Group
            onValueChange={(value) => setSelectedFloor(value)}
            value={selectedFloor}
          >
            {floors.map((floor) => (
              <TouchableOpacity
                key={floor.id}
                style={styles.radioOption}
                onPress={() => setSelectedFloor(floor.id)}
              >
                <RadioButton value={floor.id} />
                <Text style={styles.radioLabel}>{floor.displayName}</Text>
              </TouchableOpacity>
            ))}
          </RadioButton.Group>
        </View>
      )}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>How busy is this location?</Text>
        <RadioButton.Group
          onValueChange={(value) => setSelectedStatus(value as Status)}
          value={selectedStatus}
        >
          <TouchableOpacity style={styles.radioOption} onPress={() => setSelectedStatus("empty")}>
            <RadioButton value="empty" />
            <Text style={styles.radioLabel}>Empty</Text>
          </TouchableOpacity>
          {/* <View style={styles.radioOption}>
            <RadioButton value="normal" />
            <Text style={styles.radioLabel}>Normal</Text>
          </View> */}
          <TouchableOpacity style={styles.radioOption} onPress={() => setSelectedStatus("packed")}>
            <RadioButton value="packed" />
            <Text style={styles.radioLabel}>Packed</Text>
          </TouchableOpacity>
        </RadioButton.Group>
      </View>

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={() => handleSubmit()}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Submitting..." : "Submit"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#333",
  },
  form: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

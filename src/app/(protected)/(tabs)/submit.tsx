import { useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase-client";
import type { Status } from "../../../types/status";
import { useRouter } from "expo-router";
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

  const [selectedSpot, setSelectedSpot] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<Status>("empty");
  const [submitting, setSubmitting] = useState(false);

  const locations = useMemo(() => {
    return spots.map((spot) => ({
      label: spot.displayName,
      value: String(spot.id),
    }));
  }, [spots]);

  const handleSubmit = async () => {
    if (!selectedSpot) {
      Alert.alert("Error", "No location was provided.");
      return;
    }

    setSubmitting(true);

    const { data: row } = await supabase
     .from("user_database")
     .select("id")
     .eq("user_email", user.primaryEmailAddress.emailAddress)
     .single();

     const userId = user.id;

    const { error } = await supabase.from("study_spot_status").insert([
      {
        spot_id: selectedSpot,
        status: selectedStatus,
        user_id: userId,
      },
    ]);

    setSubmitting(false);

    if (error) {
      console.error("Insert error:", error);
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Success", `Reported ${selectedSpot} as ${selectedStatus}`, [
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
      <View style={styles.inputContainer}>
        <Text style={styles.label}>How busy is this location?</Text>
        <RadioButton.Group
          onValueChange={(value) => setSelectedStatus(value as Status)}
          value={selectedStatus}
        >
          <View style={styles.radioOption}>
            <RadioButton value="empty" />
            <Text style={styles.radioLabel}>Empty</Text>
          </View>
          <View style={styles.radioOption}>
            <RadioButton value="normal" />
            <Text style={styles.radioLabel}>Normal</Text>
          </View>
          <View style={styles.radioOption}>
            <RadioButton value="packed" />
            <Text style={styles.radioLabel}>Packed</Text>
          </View>
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

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabase } from "../../../lib/supabase-client";
import type { Status } from "../../../types/status";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { spots } from "../../../config/studySpots";
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

  const userId = user?.id;
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

  useFocusEffect(
    useCallback(() => {
      setSubmitting(false);
    }, [])
  );

  useEffect(() => {
    if (verified === "true") {
      if (id) setSelectedSpot(String(id));
      if (floorId) setSelectedFloor(String(floorId));
      if (status) setSelectedStatus(status as Status);
      submitToSupabase(id, floorId, status as Status);
    }
  }, [verified, id, floorId, status, submitToSupabase]);

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

    try {
      setSubmitting(true);
      const { data: lastCheckin } = await supabase
        .from("study_spot_status")
        .select("created_at, checked_out_at")
        .eq("user_id", userId)
        .eq("spot_id", selectedSpot)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastCheckin) {
        const lastTime = new Date(lastCheckin.created_at);
        const now = new Date();
        const diff = (now.getTime() - lastTime.getTime()) / (1000 * 60);
        const isStillCheckedIn = lastCheckin.checked_out_at === null;

        if (isStillCheckedIn && diff < 30) {
          Alert.alert(
            "Check-In Complete",
            `You must wait ${Math.ceil(30 - diff)} more minutes.`
          );
          return;
        }
      }

      router.push({
        pathname: "/spot/[id]",
        params: {
          id: selectedSpot,
          floorId: selectedFloor,
          status: selectedStatus,
          returnTo: "submit",
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitToSupabase = async (
    passedId?: string,
    passedFloorId?: string,
    passedStatus?: Status
  ) => {
    const finalSpotId = passedId || selectedSpot;
    const finalFloorId = passedFloorId || selectedFloor;
    const finalStatus = passedStatus || selectedStatus;

    const { error } = await supabase.from("study_spot_status").insert([
      {
        spot_id: finalSpotId,
        status: finalStatus,
        user_id: user.id,
        floor_id: finalFloorId,
        still_here: false,
        still_here_at: new Date(Date.now() + 30 * 1000).toISOString(),
      },
    ]);

    setSubmitting(false);

    if (error) {
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
      <View style={styles.formCard}>
        <Text style={styles.title}>Update Status</Text>

        <View style={styles.inputGroup}>
          <LocationDropDown
            label={"Location"}
            data={locations}
            value={selectedSpot}
            onChange={setSelectedSpot}
            placeholder="Where are you?"
          />
        </View>

        {floors.length > 0 && (
          <View style={styles.inputGroup}>
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
                  <RadioButton.Android value={floor.id} color="#7C3AED" />
                  <Text style={styles.radioLabel}>{floor.displayName}</Text>
                </TouchableOpacity>
              ))}
            </RadioButton.Group>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>How busy is it?</Text>
          <RadioButton.Group
            onValueChange={(value) => setSelectedStatus(value as Status)}
            value={selectedStatus}
          >
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedStatus("empty")}
            >
              <RadioButton.Android value="empty" color="#7C3AED" />
              <Text style={styles.radioLabel}>Empty</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedStatus("packed")}
            >
              <RadioButton.Android value="packed" color="#7C3AED" />
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    padding: 20,
    justifyContent: "center",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 24,
    shadowColor: "#2E1065",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 24,
    color: "#1F1637",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    color: "#413A5F",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  radioLabel: {
    fontSize: 16,
    color: "#1F1637",
    marginLeft: 8,
  },
  button: {
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    backgroundColor: "#C4B5FD",
    opacity: 0.8,
  },
});
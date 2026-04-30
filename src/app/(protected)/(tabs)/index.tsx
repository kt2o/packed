import { useEffect, useState, useCallback, useMemo } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  Platform
} from "react-native";
import { useSupabase } from "../../../lib/supabase-client";
import React from "react";

import LocationCard from "../../../components/LocationCard";
import { spots } from "../../../config/studySpots";
import FloorAccordion from "src/components/FloorAccordion";
import * as Notifications from "expo-notifications";
import { useUser } from "@clerk/clerk-expo";

/**
 * Convert a spot occupancy ratio into a normalized status label.
 */
function getStatus(count: number, capacity: number) {
  const ratio = count / capacity;
  if (ratio >= 1) return "full";
  if (ratio >= 0.7) return "packed";
  if (ratio >= 0.3) return "moderate";
  return "empty";
}

/**
 * Home/status screen showing study spots and their current busyness.
 *
 * Includes refresh behavior, floor status, and in-app notification handling.
 */
export default function HomeScreen() {
  const { user } = useUser();
  const userId = user?.id;

useEffect(() => {
  if (Platform.OS === "web") return;

  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const type = response.notification.request.content.data?.type;

      if (type === "still_here_check") {
        setShowStillHerePrompt(true);
      }
    }
  );

  return () => subscription.remove();
}, []);

  /**
   * Record the user's response to the "still here" prompt.
   */
  const handleStillHereResponse = async (response: "yes" | "no") => {
    setShowStillHerePrompt(false);

    const { data: latestRow, error: fetchError } = await supabase
      .from("study_spot_status")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !latestRow) {
      console.log("No recent row found:", fetchError);
      return;
    }

    // 2. Update only that row
    await supabase
      .from("study_spot_status")
      .update({ still_here_response: response })
      .eq("id", latestRow.id);

    // 3. Optional: auto-checkout if "no"
    if (response === "no") {
      await supabase
        .from("study_spot_status")
        .update({ checked_out_at: new Date().toISOString() })
        .eq("id", latestRow.id);
    }
  };

  //hooks
  const router = useRouter();
  const supabase = useSupabase();

  const [spotsWithStatus, setSpotsWithStatus] = useState([]);
  const [spotsWithOpinion, setSpotsWithOpinion] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSpotId, setExpandedSpotId] = useState<string | null>(null);
  const [showStillHerePrompt, setShowStillHerePrompt] = useState(false);

  const selectedSpotObj = useMemo(() => {
    return spotsWithOpinion.find((s) => s.id === expandedSpotId);
  }, [expandedSpotId, spotsWithOpinion]);

  /**
   * Fetch the latest spot occupancy counts from Supabase.
   */
  async function fetchStudySpotStatus() {
    const { data: counts, error } = await supabase
      .from("spot_counts")
      .select("*");
    console.log("Capacity:", counts);
    if (error) {
      console.error(error);
      return;
    }

    const merged = spots.map((spot) => {
      const count = counts?.find((c) => c.spot_id === spot.id)?.user_count ?? 0;

      return {
        ...spot,
        count,
        capacity: spot.capacity,
        status: getStatus(count, spot.capacity),
      };
    });

    setSpotsWithStatus(merged);
  }

  const [statusByFloorId, setStatusByFloorId] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      spots.flatMap((s) =>
        (s.floors ?? []).map((f) => [f.id, "unknown" as string])
      )
    )
  );
  /**
   * Fetch the latest floor-level status updates from Supabase.
   */
  async function fetchFloorStatus() {
    const { data, error } = await supabase
      .from("study_spot_status")
      .select("spot_id,floor_id,status,created_at")
      .not("floor_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Error fetching floor statuses:", error);
      return;
    }

    const latestFloor: Record<string, string> = {};

    for (const row of data ?? []) {
      const floorId = row.floor_id as string;
      const status = row.status as string;

      if (!latestFloor[floorId]) {
        latestFloor[floorId] =
          status === "empty" || status === "packed" ? status : "unknown";
      }
    }

    setStatusByFloorId((prev) => ({ ...prev, ...latestFloor }));
  }

  useEffect(() => {
    fetchStudySpotStatus();
    fetchOpinion();
    fetchFloorStatus();
  }, []);

  /**
   * Refresh all spot status data when the user pulls down.
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchStudySpotStatus(),
      fetchOpinion(),
      fetchFloorStatus(),
    ]);
    setRefreshing(false);
  };

  const [openId, setOpenId] = useState<string | null>(null);

  /**
   * Fetch community opinion data for each spot from Supabase.
   */
  async function fetchOpinion() {
    const { data, error } = await supabase
      .from("spot_opinion_summary")
      .select("*")
      .throwOnError();

    console.log("Opinion summary from DB:", data, error);
    const merged = spots.map((spot) => {
      const match = data?.find((o) => o.spot_id === spot.id);

      return {
        ...spot,
        majorityStatus: match?.majority_status ?? "unknown",
        percentage: match?.percentage ?? 0,
      };
    });

    setSpotsWithOpinion(merged);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {showStillHerePrompt && (
        <View style={styles.promptCard}>
          <Text style={styles.promptText}>Are you still here?</Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={styles.yesButton}
              onPress={() => handleStillHereResponse("yes")}
            >
              <Text style={styles.buttonText}>Yes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.noButton}
              onPress={() => handleStillHereResponse("no")}
            >
              <Text style={styles.buttonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {spotsWithStatus.map((spot) => {
        const opinion = spotsWithOpinion.find((o) => o.id === spot.id);

        return (
          <View key={spot.id}>
            <LocationCard
              id={spot.id}
              displayName={spot.displayName}
              image={spot.image}
              status={spot.status}
              count={spot.count}
              capacity={spot.capacity}
              percentage={Math.round((spot.count / spot.capacity) * 100)}
              onPress={() =>
                setExpandedSpotId((prev) => (prev === spot.id ? null : spot.id))
              }
            />

            {expandedSpotId === spot.id && selectedSpotObj && (
              <View style={styles.infoCard}>
                {selectedSpotObj.majorityStatus === "unknown" ? (
                  <Text style={styles.infoText}>
                    The status of the spot is currently unavailable.
                  </Text>
                ) : (
                  <Text style={styles.infoText}>
                    {selectedSpotObj.percentage}% of users think this spot is{" "}
                    {selectedSpotObj.majorityStatus}.
                  </Text>
                )}
              </View>
            )}

            {spot.floors && (
              <FloorAccordion
                isOpen={expandedSpotId === spot.id}
                floors={spot.floors}
                statusByFloorId={statusByFloorId}
              />
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
  },

  promptCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },

  promptText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6320c7",
    marginBottom: 12,
  },

  yesButton: {
    backgroundColor: "#7B4DFF",
    color: "white",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    overflow: "hidden",
    fontWeight: "700",
  },

  noButton: {
    backgroundColor: "#E5E5EA",
    color: "#333",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    overflow: "hidden",
    fontWeight: "700",
  },

  infoCard: {
    backgroundColor: "#7B4DFF",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },

  dots: {
    fontSize: 22,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  infoBody: {
    marginTop: 10,
  },

  infoText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    paddingVertical: 4,
  },
});
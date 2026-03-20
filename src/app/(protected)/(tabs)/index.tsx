import { useEffect, useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, ScrollView, RefreshControl, View } from "react-native";
import React from "react";

import { useSupabase } from "../../../lib/supabase-client";
import LocationCard from "../../../components/LocationCard";
import { spots } from "../../../config/studySpots";
import FloorAccordion from "src/components/FloorAccordion";

function getStatus(count: number, capacity: number) {
  const ratio = count / capacity;
  if (ratio >= 1) return "full";
  if (ratio >= 0.7) return "packed";
  if (ratio >= 0.3) return "moderate";
  return "empty";
}

export default function HomeScreen() {
  const router = useRouter();
  const supabase = useSupabase();

  const [spotsWithStatus, setSpotsWithStatus] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchStudySpotStatus() {
    const { data: counts, error } = await supabase
      .from("spot_counts")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    const merged = spots.map((spot) => {
      const count =
        counts?.find((c) => c.spot_id === spot.id)?.user_count ?? 0;


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
        (s.floors ?? []).map((f) => [f.id, "unknown" as string]),
      ),
    ),
  );
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
          status === "empty" || status === "packed"
            ? status
            : "unknown";
      }
    }

    setStatusByFloorId((prev) => ({ ...prev, ...latestFloor }));
  };

  useEffect(() => {
    fetchStudySpotStatus();
    fetchFloorStatus();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStudySpotStatus(), fetchFloorStatus()]);
    setRefreshing(false);
  };

  const [openId, setOpenId] = useState<string | null>(null);

return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {spotsWithStatus.map((spot) => {
        const percentage = Math.round((spot.count / spot.capacity) * 100);
        return (
          <View key={spot.id}>
          <LocationCard
            key={spot.id}
            id={spot.id}
            displayName={spot.displayName}
            image={spot.image}
            status={spot.status}
            count={spot.count}
            capacity={spot.capacity}
            percentage={percentage}
            onPress={
              () => setOpenId((prev) => prev === spot.id ? null : spot.id)
              /* () =>
              router.push({
                pathname: "/spot/[id]",
                params: { id: spot.id },
              }) */
            }
          />
          {/* {spot.floors && spot.floors.length > 0 && (
            <FloorAccordion floors={spot.floors} statusByFloorId={statusByFloorId} />
          )} */}
          {spot.floors && spot.floors.length > 0 && (
    <FloorAccordion isOpen={openId === spot.id} floors={spot.floors} statusByFloorId={statusByFloorId} />
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
});
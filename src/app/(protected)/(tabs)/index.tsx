import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { useState } from "react";
import { useSupabase } from "../../../lib/supabase-client";

import { useRouter } from "expo-router";
import { StyleSheet, ScrollView, RefreshControl, View } from "react-native";

import LocationCard from "../../../components/LocationCard";
import { spots } from "../../../config/studySpots";
import type { Status } from "../../../types/status";
import React from "react";
import FloorAccordion from "src/components/FloorAccordion";

export default function HomeScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const initialStatus: Record<string, Status> = Object.fromEntries(
    spots.map((s) => [s.id, "unknown" as Status]),
  );

  const [statusBySpotId, setStatusBySpotId] = useState<Record<string, Status>>(
    () => Object.fromEntries(spots.map((s) => [s.id, "unknown" as Status])),
  );

  const [refreshing, setRefreshing] = useState(false);

  const fetchStatuses = async () => {
    const { data, error } = await supabase
      .from("study_spot_status")
      .select("spot_id,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Error fetching statuses:", error);
      return;
    }

    const latest: Record<string, Status> = {};

    for (const row of data ?? []) {
      const spotId = row.spot_id as string;
      const status = row.status as Status;

      if (!latest[spotId]) {
        if (status === "empty" || status === "normal" || status === "packed") {
          latest[spotId] = status;
        } else {
          latest[spotId] = "unknown";
        }
      }
    }

    setStatusBySpotId((prev) => ({ ...prev, ...latest }));
  };

  const [statusByFloorId, setStatusByFloorId] = useState<
    Record<string, Status>
  >(() =>
    Object.fromEntries(
      spots.flatMap((s) =>
        (s.floors ?? []).map((f) => [f.id, "unknown" as Status]),
      ),
    ),
  );

  const fetchFloorStatuses = async () => {
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

    const latestFloor: Record<string, Status> = {};

    for (const row of data ?? []) {
      const floorId = row.floor_id as string;
      const status = row.status as Status;

      if (!latestFloor[floorId]) {
        latestFloor[floorId] =
          status === "empty" || status === "normal" || status === "packed"
            ? status
            : "unknown";
      }
    }

    setStatusByFloorId((prev) => ({ ...prev, ...latestFloor }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStatuses(), fetchFloorStatuses()]);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchStatuses();
      fetchFloorStatuses();
    }, []),
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {spots.map((spot) => (
        <View key={spot.id}>
          <LocationCard
            key={spot.id}
            id={spot.id}
            displayName={spot.displayName}
            image={spot.image}
            status={statusBySpotId[spot.id] ?? "unknown"}
            onPress={() =>
              router.push({
                pathname: "/spot/[id]",
                params: { id: spot.id },
              })
            }
          />
          {spot.floors && spot.floors.length > 0 && (
            <FloorAccordion floors={spot.floors} statusByFloorId={statusByFloorId} />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
  },
});

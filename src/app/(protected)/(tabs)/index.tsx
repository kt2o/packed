import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { useState } from "react";
import { useSupabase } from "../../../lib/supabase-client";

import { useRouter } from "expo-router";
import { StyleSheet, ScrollView, RefreshControl } from "react-native";

import LocationCard from "../../../components/LocationCard";
import { spots } from "../../../config/studySpots";
import type { Status } from "../../../types/status";
import React from "react";

export default function HomeScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const initialStatus: Record<string, Status> = Object.fromEntries(
    spots.map((s) => [s.id, "unknown" as Status])
  );

  const [statusBySpotId, setStatusBySpotId] = useState<Record<string, Status>>(
    () => Object.fromEntries(spots.map((s) => [s.id, "unknown" as Status]))
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatuses();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchStatuses();
    }, [])
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {spots.map((spot) => (
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

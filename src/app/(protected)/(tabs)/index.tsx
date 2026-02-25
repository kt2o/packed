import { useEffect, useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, ScrollView, RefreshControl } from "react-native";
import React from "react";

import { useSupabase } from "../../../lib/supabase-client";
import LocationCard from "../../../components/LocationCard";
import { spots } from "../../../config/studySpots";

function getStatus(count: number, capacity: number) {
  const ratio = count / capacity;
  if (ratio >= 1) return "full";
  if (ratio >= 0.7) return "busy";
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

  useEffect(() => {
    fetchStudySpotStatus();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudySpotStatus();
    setRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {spotsWithStatus.map((spot) => (
        <LocationCard
          key={spot.id}
          id={spot.id}
          displayName={spot.displayName}
          image={spot.image}
          status={spot.status}
          count={spot.count}
          capacity={spot.capacity}
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
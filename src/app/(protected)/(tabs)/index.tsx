import { useEffect, useState, useCallback, useMemo } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, ScrollView, RefreshControl, View, Text } from "react-native";
import { useSupabase } from "../../../lib/supabase-client";
import React from "react";

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
  const [spotsWithOpinion, setSpotsWithOpinion] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSpotId, setExpandedSpotId] = useState<string | null>(null);

    const selectedSpotObj = useMemo(() => {
      return spotsWithOpinion.find((s) => s.id === expandedSpotId);
    }, [expandedSpotId, spotsWithOpinion]);


  async function fetchStudySpotStatus() {
    const { data: counts, error } = await supabase
      .from("spot_counts")
      .select("*");

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
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStudySpotStatus(), fetchOpinion()]);
    setRefreshing(false);
  };

  const [openId, setOpenId] = useState<string | null>(null);

  async function fetchOpinion() {
    const { data } = await supabase.from("spot_opinion_summary").select("*");

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
                <Text style={styles.infoText}>
                  {selectedSpotObj.percentage}% of users think this spot is{" "}
                  {selectedSpotObj.majorityStatus}.
                </Text>
              </View>
            )}

            {spot.floors && (
              <FloorAccordion
                isOpen={expandedSpotId === spot.id}
                floors={spot.floors}
                statusByFloorId={{}}
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
  infoCard: {
    backgroundColor: "#fff",
    padding: 12,
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
    fontSize: 15,
    color: "#6A4BCB",
    marginBottom: 4,
  },
});

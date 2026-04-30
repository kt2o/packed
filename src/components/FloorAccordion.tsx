// components/FloorAccordion.tsx
import { List } from "react-native-paper";
import { spots } from "../config/studySpots";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useSupabase } from "src/lib/supabase-client";

type Floor = NonNullable<(typeof spots)[number]["floors"]>[number];

type Props = {
  floors: Floor[];
  statusByFloorId: Record<string, string>;
  isOpen: boolean;
};

const statusColor: Record<string, string> = {
        empty: "green",
        normal: "yellow",
        packed: "red",
        unknown: "gray",
    };


/**
 * Accordion component for displaying floor-level status details.
 *
 * It renders floor entries for a selected study spot and shows a
 * color-coded status dot for each floor.
 */
export default function FloorAccordion({ floors, statusByFloorId, isOpen }: Props) {

  return (
    <View>
      {isOpen && floors.map((floor) => (
        <List.Item
          key={floor.id}
          title={floor.displayName}
          right={() => (
    <View style={[styles.statusDot, { backgroundColor: statusColor[statusByFloorId[floor.id] ?? "unknown"] }]} />
  )}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
    statusDot: {
        position: "absolute",
        bottom: 12,
        right: 12,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "green",
        borderWidth: 2,
        borderColor: "black",
    },
});
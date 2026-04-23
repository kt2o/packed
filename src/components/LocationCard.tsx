import {
    Text,
    View,
    StyleSheet,
    ImageBackground,
    TouchableOpacity,
} from "react-native";
import { ImageSourcePropType } from "react-native";
import type { Status } from "../types/status";

const LocationCard = (props: {

    id: string;
    displayName: string;
    image: ImageSourcePropType;
    status: Status;
    count?: number;
    capacity?: number;
    percentage: number;
    onPress: () => void;
}) => {
    const { id, displayName, image, status, count, capacity, percentage, onPress } = props;

    const statusColor: Record<Status, string> = {
        empty: "#4CAF50",
        moderate: "#FFC107",
        busy: "#FF9800",
        full: "#F44336",
        unknown: "gray",
    };

   const badgeColor = {
   empty: "rgba(76, 175, 80, 0.8)", // green
   moderate: "rgba(255, 193, 7, 0.8)", // yellow
   busy: "rgba(255, 87, 34, 0.8)", // orange
   full: "rgba(244, 67, 54, 0.8)", // red
   }


  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <ImageBackground
        source={image}
        style={styles.cardBackground}
        resizeMode="cover"
      >

        <View style={styles.overlay}>
          <Text style={styles.locationName}>{displayName}</Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColor[status] },
              ]}
            />
            <Text style={styles.statusText}>{status}</Text>
          </View>

          {count !== undefined && capacity !== undefined && (
          <View style={[styles.capacityBadge, { backgroundColor: badgeColor[status] }]}>
             <Text style={styles.capacityText}>{percentage}%</Text>
             </View>
          )}

        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

};

export default LocationCard;

const styles = StyleSheet.create({

  card: {
    height: 120,
    width: "100%",
    marginBottom: 14,
    overflow: "hidden",
    borderRadius: 12,
  },
  locationName: {
    position: "absolute",
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    top: 12,
    left: 12,
  },
  cardBackground: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    borderRadius: 16,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  statusRow: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "white",
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  countText: {
    position: "absolute",
    bottom: 12,
    right: 12,
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  capacityBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  capacityText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

});

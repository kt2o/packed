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
    onPress: () => void;
}) => {
    const { id, displayName, image, status, count, capacity, onPress } = props;

    const statusColor: Record<Status, string> = {
        empty: "#4CAF50",
        moderate: "#FFC107",
        busy: "#FF9800",
        full: "#F44336",
        unknown: "gray",
    };


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
            <Text style={styles.countText}>
              {count} / {capacity} people
            </Text>
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

});

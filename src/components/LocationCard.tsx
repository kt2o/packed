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
  onPress: () => void;
}) => {
  const { id, displayName, image, status, onPress } = props;

  const statusColor: Record<Status, string> = {
    empty: "green",
    normal: "yellow",
    packed: "red",
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
          <View
            style={[styles.statusDot, { backgroundColor: statusColor[status] }]}
          />
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
  statusDot: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "green",
    borderWidth: 2,
    borderColor: "white",
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
});

import { Text, View, StyleSheet, ImageBackground } from "react-native";

export default function HomeScreen() {
  return (
    <>
      <View style={styles.card}>
        <ImageBackground
          source={require("../../../assets/ksl.png")}
          style={styles.cardBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <Text style={styles.locationName}>KSL</Text>
            <View style={styles.statusDot} />
          </View>
        </ImageBackground>
      </View>
      <View style={styles.card}>
        <ImageBackground
          source={require("../../../assets/tink.png")}
          style={styles.cardBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <Text style={styles.locationName}>Tink</Text>
            <View style={styles.statusDot} />
          </View>
        </ImageBackground>
      </View>
      <View style={styles.card}>
        <ImageBackground
          source={require("../../../assets/pbl.png")}
          style={styles.cardBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <Text style={styles.locationName}>PBL</Text>
            <View style={styles.statusDot} />
          </View>
        </ImageBackground>
      </View>
      <View style={styles.card}>
        <ImageBackground
          source={require("../../../assets/tomlinson.png")}
          style={styles.cardBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <Text style={styles.locationName}>Tomlinson</Text>
            <View style={styles.statusDot} />
          </View>
        </ImageBackground>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    height: "20%",
    width: "100%",
    paddingTop: 16,
    paddingHorizontal: 16,
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
    justifyContent: "center",
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

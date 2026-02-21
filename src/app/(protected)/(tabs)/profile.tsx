import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  // Static placeholder facts to build off of later
  const [facts, setFacts] = useState([
    { id: "1", label: "Prefered Location", value: "PBL" },
    { id: "2", label: "Study Type", value: "Prefer Quiet" },
    {
      id: "3",
      label: "Average Study Time",
      value: "4 Hours",
    },
    { id: "4", label: "Major", value: "Computer Science" },
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header - Settings Button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="settings-outline" size={28} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Top Section: Profile Picture, Name, Bio */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: "https://avatar.iran.liara.run/public" }} // Placeholder avatar
            style={styles.avatar}
          />
          <Text style={styles.username}>@diego</Text>
          <Text style={styles.bio}>Tryna find the best study spot fr</Text>
        </View>

        {/* Subtle Purple Divider */}
        <View style={styles.divider} />

        {/* Lower Middle Section: User Facts */}
        <View style={styles.factsSection}>
          <Text style={styles.sectionTitle}>About Me</Text>

          {facts.map((fact) => (
            <View key={fact.id} style={styles.factRow}>
              <Text style={styles.factLabel}>{fact.label}:</Text>
              <Text style={styles.factValue}>{fact.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF", // White background
  },
  container: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  iconButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 30,
    marginTop: 10,
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F0F0F0",
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000", // Black text, bold
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    color: "#000000",
    textAlign: "center",
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0D4F5", // Subtle purple divider
    width: "85%",
    alignSelf: "center",
    marginVertical: 10,
  },
  factsSection: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 15,
  },
  factRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2EDFA", // Extremely subtle purple for list items
  },
  factLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    flex: 1,
  },
  factValue: {
    fontSize: 16,
    color: "#000000",
    flex: 2,
    textAlign: "right",
  },
});

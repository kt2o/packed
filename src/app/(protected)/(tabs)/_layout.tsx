import { Tabs } from "expo-router";
import { Entypo } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { View, Text } from "react-native";

/**
 * Tab layout for the protected app section.
 *
 * Defines the main bottom-tab navigation for status, submit, chat, todo, and profile.
 */
export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Status",
          headerTitle: () => (
            <View
              style={{
                backgroundColor: "#7B4DFF",
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 16,
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>
                Packed
              </Text>
            </View>
          ),
          headerTitleAlign: "center",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="building" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="submit"
        options={{
          title: "Submit",
          headerTitle: "",
          headerTintColor: "#6320c7",
          tabBarIcon: ({ color }) => (
            <Entypo name="location" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerTitle: "",
          headerTintColor: "#6320c7",
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbox" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: "Study",
          headerTitle: "",
          headerTintColor: "#6320c7",
          tabBarIcon: ({ color }) => (
            <Ionicons name="clipboard-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "",
          headerTintColor: "#6320c7",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
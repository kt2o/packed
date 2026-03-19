import { Tabs } from "expo-router";
import { Entypo } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Status",
          headerTitle: "Packed",
          headerTintColor: "#6320c7",
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
          href: null,
          headerTintColor: "#6320c7",
          tabBarIcon: ({ color }) => (
            <Entypo name="location" size={24} color={color} />
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
      <Tabs.Screen
        name="todo"
        options={{
          title: "To-Do",
          headerTitle: "",
          headerTintColor: "#6320c7",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="clipboard-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

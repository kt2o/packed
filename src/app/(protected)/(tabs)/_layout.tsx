import { Tabs } from "expo-router";
import React from "react";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";

export default function TabLayout() {
  const { signOut } = useAuth();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6320c7",
        headerRight: () => (
          <Feather
            name="log-out"
            size={22}
            color="black"
            style={{ paddingRight: 10 }}
            onPress={() => signOut()}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Status",
          headerTitle: "Packed",
          headerTintColor: "#6320c7",
        }}
      />
      <Tabs.Screen
        name="submit"
        options={{
          title: "Submit",
          headerTitle: "Submit Location Status",
          headerTintColor: "#6320c7",
        }}
      />
    </Tabs>
  );
}

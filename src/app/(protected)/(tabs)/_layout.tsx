import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
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
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "",
          headerTintColor: "#6320c7",
        }}
      />
    </Tabs>
  );
}

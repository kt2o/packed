import { View, Button } from "react-native";
import { useSupabase } from "../../../lib/supabase-client";
import { useUser } from "@clerk/clerk-expo";

export default function NotesPage() {
  const client = useSupabase();
  const { user } = useUser();

  const testConnection = async () => {
    const { data, error } = await client
      .from("test_connection")
      .insert({ message: "Hello from my app" })
      .select();

    console.log("DATA:", data);
    console.log("ERROR:", error);
  };
  const addNote = async () => {
    if (!user) return;

    const { data, error } = await client.from("notes").insert({
      user_id: user.id,
      content: "Hello world",
    });
  };
  return (
    <View>
      <Button title="Add Note" onPress={addNote} />
    </View>
  );
}

import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, Alert } from "react-native";
import { useSupabase } from "../../../lib/supabase-client";
import { useUser } from "@clerk/clerk-expo";

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const supabase = useSupabase();
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();

    // subscribe to new messages in real time
    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    // loctcation check
    const verifyAccess = async () => {
      // 1. Create a timestamp for 2 hours ago
      const twoHoursAgo = new Date(
        Date.now() - 2 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await supabase
        .from("check_ins")
        .select("spot_id, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }) // Get the absolute newest one
        .limit(1)
        .maybeSingle();

      if (data && data.updated_at > twoHoursAgo) {
        // If their latest check-in matches THIS page's spot ID, they are in!
        if (data.spot_id === currentPageSpotId) {
          setIsVerified(true);
        } else {
          setIsVerified(false); // They are checked in somewhere else
        }
      } else {
        setIsVerified(false); // No recent check-in found
      }
      setLoading(false);
    };

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // send a message
  const sendMessage = async () => {
    if (!text.trim()) return; // Stop empty messages

    // 1. MATCH YOUR TABLE SCHEMA
    // Ensure 'content' is the name of your column in Supabase
    const newMessage = {
      id: Math.random().toString(),
      text: text, // <--- We use 'content' here
      user_id: userId,
      username: user?.username,
      // CRITICAL: If your DB requires a location/spot ID, you CANNOT send null.
      // Replace 'locationId' with the actual ID of the library/room.
      spot_id: null,
      created_at: new Date().toISOString(),
    };

    // 2. Optimistic Update (Sender sees it immediately)
    setMessages((prev) => [...prev, newMessage]);
    const textToSend = text;
    setText("");

    // 3. Database Insert
    const { error } = await supabase.from("messages").insert([
      {
        text: textToSend,
        username: user?.username,
        user_id: userId,
        spot_id: null, // Ensure this matches your DB column name
      },
    ]);

    if (error) {
      console.error("DB Error:", error.message);
      // Remove the fake message if the real one failed
      setMessages((prev) => prev.filter((m) => m.id !== newMessage.id));
      Alert.alert("Error", "Message failed to save to database.");
    }
  };

  //return statement
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Verifying your location...</Text>
      </View>
    );
  }

  // 2. Handle the "Locked" state
  if (!isVerified) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 40, marginBottom: 10 }}>📍</Text>
        <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center" }}>
          Chat Locked
        </Text>
        <Text
          style={{ textAlign: "center", color: "#666", marginVertical: 10 }}
        >
          You must contribute a "Pack Level" update at this location to join the
          chat.
        </Text>
        <Button
          title="Contribute Now"
          onPress={() => {
            /* Navigate to check-in screen */
          }}
        />
      </View>
    );
  }

  // 3. The "Unlocked" Chat UI (Your existing code)
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: "bold" }}>{item.username}: </Text>
            {/* REMINDER: Use item.content if that's what you named it in your DB! */}
            <Text>{item.content || item.text}</Text>
          </View>
        )}
      />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Type a message..."
        style={{ borderWidth: 1, padding: 8, marginTop: 8, borderRadius: 8 }}
      />
      <Button title="Send" onPress={sendMessage} />
    </View>
  );
}

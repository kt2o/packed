import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, Alert, ActivityIndicator } from "react-native";
import { useSupabase } from "../../../lib/supabase-client";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = useSupabase();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const [spotId, setSpotId] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) return;

    const getUserLocation = async () => {
      try {
        const { data } = await supabase
          .from("locations")
          .select("spot_id")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setSpotId(data.spot_id);
          setIsVerified(true);
        }
      } catch (e) {
        console.error("Error fetching spotId:", e.message);
      } finally {
        setLoading(false);
      }
    };

    getUserLocation();
  }, [isLoaded, userId]);

  useEffect(() => {
    if (!spotId) return; // Wait until we know the spot

    let isMounted = true;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("spot_id", spotId)
        .order("created_at", { ascending: true });

      if (!error && isMounted) {
        setMessages(data);
      }
    };

    loadMessages();

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `spot_id=eq.${spotId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
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
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [spotId]);




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
        spot_id: spotId,
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
          spot_id: spotId, // Ensure this matches your DB column name
        },
      ]);

      if (error) {
        console.error("DB Error:", error.message);
        // Remove the fake message if the real one failed
        setMessages((prev) => prev.filter((m) => m.id !== newMessage.id));
        Alert.alert("Error", "Message failed to save to database.");
      }
   };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }


  // Handle the case where no spotId was passed to the screen
  if (!spotId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>No Location Selected</Text>
        <Text style={{ textAlign: "center", color: "#666", marginTop: 8 }}>
          Please select a study spot from the map to enter its chat.
        </Text>
        <Button title="Contribute" onPress={() => router.replace({ pathname: "/submit", params: { verified: "false" } }) } />
      </View>
    );
  }

  if (!isVerified) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}>📍</Text>
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>Chat Locked</Text>
        <Text style={{ textAlign: "center", color: "#666", marginVertical: 10 }}>
          You haven't verified your location at this spot in the last 2 hours.
        </Text>
        <Button title="Contribute Now" onPress={() => router.push("/submit")} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 4 }}>
            <Text style={{ fontWeight: "bold", fontSize: 12 }}>{item.username}</Text>
            <Text>{item.text}</Text>
          </View>
        )}
      />
      <View style={{ flexDirection: "row", paddingVertical: 10 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Send a message..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 8,
            marginRight: 8
          }}
        />
        {/* Fixed the onPress syntax below */}
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
  }
import { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, Button, FlatList, Alert, ActivityIndicator } from "react-native";
import { useSupabase } from "../../../lib/supabase-client";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useUser } from "@clerk/clerk-expo";

export default function ChatScreen() {

  //States
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spotName, setSpotName] = useState("");
  const formattedSpotName = spotName.toUpperCase();
  const [activeCheckin, setActiveCheckin] = useState(null);



  //Hooks
  const supabase = useSupabase();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const [spotId, setSpotId] = useState(null);
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();





    const fetchActiveCheckin = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("study_spot_status")
        .select("spot_id, checked_out_at")
        .eq("user_id", userId)
        .is("checked_out_at", null)   // ONLY active check-ins
        .order("created_at", { ascending: false })
        .gte("created_at", twoHoursAgo)
        .limit(1)
        .single();

      if (error) {
        console.log("Error fetching active checkin:", error);
        setActiveCheckin(null);
        setSpotId(null);
        setIsVerified(false);
        setLoading(false);
        return;
      }

     // CASE 1 — user has NEVER checked in
         if (!data) {
           setActiveCheckin(null);
           setSpotId(null);
           setIsVerified(false);
           setLoading(false);
           return;
         }

         // CASE 2 — user IS checked in (checked_out_at is null)
         if (data.checked_out_at === null) {
           setActiveCheckin(data);
           setSpotId(data.spot_id);
           setSpotName(data.spot_id);
           setIsVerified(true);
           setLoading(false);
           return;
         }else{

         // CASE 3 — user checked out
         setActiveCheckin(null);
         setSpotId(null);
         setIsVerified(false);
         setLoading(false);
         }

       };

    useEffect(() => {
      if (userId) fetchActiveCheckin();
    }, [userId]);


  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchActiveCheckin();
      }
    }, [userId])
  );

  useEffect(() => {
    if (!spotId) return; // Wait until we know the spot

    let isMounted = true;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("spot_id", spotId)
        .gte("created_at", twoHoursAgo)
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


  if (!activeCheckin) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}> 🔒</Text>
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>Chat Locked</Text>
        <Text style={{ textAlign: "center", color: "#666", marginVertical: 10 }}>
          You have Checked out of your location
        </Text>
        <Button title="Contribute Now" onPress={() => router.replace({ pathname: "/submit", params: { verified: "false" } }) } />
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

  return (
    <View
       style={{
         flex: 1,
         padding: 16
        }}>

    <View
      style={{
        backgroundColor: "#7B4DFF",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      {/* Title */}
      <Text
        style={{
          color: "white",
          fontSize: 20,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {formattedSpotName} Chat
      </Text>
    </View>


      <FlatList
        data={messages}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({ item }) => {

          const isMe = item.user_id === userId;

          return (
            <View
              style={{
                flexDirection: "row",
                justifyContent: isMe ? "flex-end" : "flex-start",
                marginVertical: 4,
              }}
            >
              <View
                style={{
                  backgroundColor: isMe ? "#3064f2" : "#E5E5EA",
                  padding: 10,
                  borderRadius: 16,
                  maxWidth: "75%",
                  borderBottomRightRadius: isMe ? 0 : 16,
                  borderBottomLeftRadius: isMe ? 16 : 0,
                }}
              >
                {!isMe && (
                  <Text style={{ fontWeight: "bold", fontSize: 12, marginBottom: 2 }}>
                    {item.username}
                  </Text>
                )}

                <Text style={{ color: isMe ? "white" : "black" }}>
                  {item.text}
                </Text>

                <Text
                  style={{
                    fontSize: 10,
                    color: isMe ? "#E0D4FF" : "#555",
                    textAlign: "right",
                    marginTop: 4,
                  }}
                >
                  {new Date(item.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          );
        }}
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
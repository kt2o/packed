import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { useSupabase } from "../../../lib/supabase-client";
import { useUser } from "@clerk/clerk-expo";


export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const supabase = useSupabase();
  const { user, isLoaded } = useUser();
  const userId = user?.id

  useEffect(() => {
    // 1. Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();

    // 2. Subscribe to new messages in real time
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
  }, []);

  // 3. Send a message
  const sendMessage = async () => {
    if (!text.trim()) return;
    await supabase.from('messages').insert({
      user_id: userId,      // replace with real auth user ID
      username: user?.username,          // replace with real username
      text: text.trim(),
    });
    setText('');
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text>{item.username}: {item.text}</Text>
        )}
      />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Type a message..."
        style={{ borderWidth: 1, padding: 8, marginTop: 8 }}
      />
      <Button title="Send" onPress={sendMessage} />
    </View>
  );
}
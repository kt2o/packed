import { supabase } from "../../../lib/supabase-client";
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

type Todo = {
    id: string,
    user_id: string,
    title: string,
    is_completed: boolean,
    created_at: string;
};

export default function TodoScreen() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadTodos() {
        setLoading(true);

        const { data, error } = await supabase
            .from('todo_list')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error.message);
        } else {
            setTodos(data || []);
        }

        setLoading(false);
    }

    useEffect(() => {
        loadTodos();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My To-Do List</Text>

            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <FlatList
                    data={todos}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Text style={styles.todoText}>
                            {item.is_completed ? '✅' : '⬜'} {item.title}
                        </Text>
                    )}
                    ListEmptyComponent={<Text>No To-Do's yet.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    todoText: {
        fontSize: 16,
        marginBottom: 12,
    },
});

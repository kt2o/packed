import { supabase } from "../../../lib/supabase-client";
import { useUser } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

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
    const [title, setTitle] = useState('');
    const [adding, setAdding] = useState(false);
    const { user } = useUser();

    async function loadTodos() {
        setLoading(true);

        const { data, error } = await supabase
            .from('todo_list')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading to-dos: ', error.message);
        } else {
            setTodos(data || []);
        }

        setLoading(false);
    }

    async function handleAddTodo() {
        const trimmedTitle = title.trim();

        if (!trimmedTitle) return;

        if (!user) {
            console.error('No user found');
            return;
        }

        setAdding(true);

        const { data, error } = await supabase
            .from('todo_list')
            .insert([
                {
                    title: trimmedTitle,
                    user_id: user.id,
                    is_completed: false,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Error adding to-do', error.message);
        } else if (data) {
            setTodos((prev) => [data, ...prev]);
            setTitle('');
        }

        setAdding(false);
    }

    async function toggleTodo(item: Todo) {
        const { data, error } = await supabase
            .from('todo_list')
            .update({ is_completed: !item.is_completed })
            .eq('id', item.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating todo:', error.message);
            return;
        }

        if (data) {
            setTodos((prev) =>
                prev.map((todo) => (todo.id === item.id ? data : todo))
            );
        }
    }

    useEffect(() => {
        loadTodos();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My To-Do List</Text>

            <View style={styles.inputRow}>
                <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter a task"
                    style={styles.input}
                />
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddTodo}
                    disabled={adding}
                >
                    <Text style={styles.addButtonText}>
                        {adding ? 'Adding...' : 'Add'}
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <FlatList
                    data={todos}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => toggleTodo(item)}>
                            <View style={styles.todoItem}>
                                <Text style={[
                                    styles.todoText,
                                    item.is_completed && styles.completed
                                ]}>
                                    {item.is_completed ? '✅' : '⬜'} {item.title}
                                </Text>
                            </View>
                        </TouchableOpacity>
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
    inputRow: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        backgroundColor: '#fff',
    },
    addButton: {
        backgroundColor: '#6320c7',
        paddingHorizontal: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    todoItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    todoText: {
        fontSize: 16,
    },
    completed: {
        textDecorationLine: 'line-through',
        color: 'gray',
    },
});

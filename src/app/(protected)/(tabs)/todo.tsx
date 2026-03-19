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
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
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

    async function deleteTodo(id: string) {
        const { error } = await supabase
            .from('todo_list')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting todo:', error.message);
            return;
        }

        setTodos((prev) => prev.filter((todo) => todo.id !== id));
    }

    useEffect(() => {
        loadTodos();
    }, []);

    const filteredTodos = todos.filter((todo) => {
        if (filter === 'active') return !todo.is_completed;
        if (filter === 'completed') return todo.is_completed;
        return true;
    });

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

            <View style={styles.filterRow}>
                <TouchableOpacity onPress={() => setFilter('all')}>
                    <Text style={[styles.filterText, filter === 'all' && styles.activeFilter]}>
                        All
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setFilter('active')}>
                    <Text style={[styles.filterText, filter === 'active' && styles.activeFilter]}>
                        Active
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setFilter('completed')}>
                    <Text style={[styles.filterText, filter === 'completed' && styles.activeFilter]}>
                        Completed
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <FlatList
                    data={filteredTodos}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.todoItem}>
                            <TouchableOpacity
                                onPress={() => toggleTodo(item)}
                                style={styles.todoContent}
                            >
                                <Text
                                    style={[
                                        styles.todoText,
                                        item.is_completed && styles.completed,
                                    ]}
                                >
                                    {item.is_completed ? '✅' : '⬜'} {item.title}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => deleteTodo(item.id)}>
                                <Text style={styles.deleteText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    todoContent: {
        flex: 1,
    },
    deleteText: {
        color: 'red',
        fontWeight: '600',
        marginLeft: 12,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    filterText: {
        fontSize: 16,
        color: '#444',
    },
    activeFilter: {
        color: '#6320c7',
        fontWeight: '700',
    },
});

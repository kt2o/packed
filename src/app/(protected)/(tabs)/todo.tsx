import { supabase } from "../../../lib/supabase-client";
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

type Todo = {
    id: string,
    user_id: string,
    title: string,
    is_completed: boolean,
    created_at: string;
    deadline_at: string | null;
};

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

async function scheduleDeadlineReminder(
    title: string,
    deadlineAt: string | null
) {
    if (!deadlineAt) return;

    const deadlineDate = new Date(deadlineAt);
    const now = new Date();

    const reminderOffsets = [
        { label: '1 week', ms: 7 * 24 * 60 * 60 * 1000 },
        { label: '3 days', ms: 3 * 24 * 60 * 60 * 1000 },
        { label: '1 day', ms: 1 * 24 * 60 * 60 * 1000 },
    ];

    for (const reminder of reminderOffsets) {
        const triggerDate = new Date(deadlineDate.getTime() - reminder.ms);

        if (triggerDate > now) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Task deadline coming up',
                    body: `"${title}" is due in ${reminder.label}.`,
                    data: { deadlineAt, reminder: reminder.label },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: triggerDate,
                },
            });
        }
    }
}

function getDeadlineStatus(deadlineAt: string | null) {
    if (!deadlineAt) return 'none';

    const now = new Date();
    const deadline = new Date(deadlineAt);

    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 1) return 'oneDay';
    if (diffDays <= 3) return 'threeDays';
    if (diffDays <= 7) return 'oneWeek';
    return 'normal';
}

function getDeadlineStyle(status: string) {
    switch (status) {
        case 'completed':
            return { backgroundColor: '#f5f5f5', borderColor: '#d9d9d9' };
        case 'overdue':
            return { backgroundColor: '#ffe5e5', borderColor: '#ff4d4f' };
        case 'oneDay':
            return { backgroundColor: '#fff1e6', borderColor: '#ff7a45' };
        case 'threeDays':
            return { backgroundColor: '#fff7e6', borderColor: '#fa8c16' };
        case 'oneWeek':
            return { backgroundColor: '#fffbe6', borderColor: '#fadb14' };
        default:
            return { backgroundColor: '#ffffff', borderColor: '#eeeeee' };
    }
}

function getDeadlineLabel(status: string) {
    switch (status) {
        case 'overdue':
            return 'Overdue';
        case 'oneDay':
            return 'Due within 1 day';
        case 'threeDays':
            return 'Due within 3 days';
        case 'oneWeek':
            return 'Due within 1 week';
        default:
            return '';
    }
}

function sortTodosByDeadline(items: Todo[]) {
    return [...items].sort((a, b) => {
        if (a.deadline_at && b.deadline_at) {
            return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
        }

        if (a.deadline_at && !b.deadline_at) return -1;
        if (!a.deadline_at && b.deadline_at) return 1;

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}


export default function TodoScreen() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [adding, setAdding] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const { user } = useUser();

    async function loadTodos() {
        if (!user) return;

        setLoading(true);

        const { data, error } = await supabase
            .from('todo_list')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error loading todos:', error.message);
        } else {
            setTodos(sortTodosByDeadline(data || []));
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

        const deadlineValue = selectedDate
            ? selectedDate.toISOString()
            : null;

        const { data, error } = await supabase
            .from('todo_list')
            .insert([
                {
                    title: trimmedTitle,
                    user_id: user.id,
                    is_completed: false,
                    deadline_at: deadlineValue,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Error adding todo:', error.message);
        } else if (data) {
            setTodos((prev) => sortTodosByDeadline([data, ...prev]));
            setTitle('');
            setSelectedDate(null);

            const granted = await requestNotificationPermission();
            if (granted) {
                await scheduleDeadlineReminder(
                    data.title ?? trimmedTitle,
                    data.deadline_at ?? deadlineValue
                );
            }
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

    async function updateTodo(id: string) {
        const trimmedTitle = editingTitle.trim();
        if (!trimmedTitle) return;

        const { data, error } = await supabase
            .from('todo_list')
            .update({ title: trimmedTitle })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating todo:', error.message);
            return;
        }

        if (data) {
            setTodos((prev) => prev.map((todo) => (todo.id === id ? data : todo)));
        }

        setEditingId(null);
        setEditingTitle('');
    }


    async function requestNotificationPermission() {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.error('Notification permission not granted');
            return false;
        }

        return true;
    }

    useEffect(() => {
        if (user) {
            loadTodos();
        }
    }, [user]);

    const filteredTodos = todos.filter((todo) => {
        if (filter === 'active') return !todo.is_completed;
        if (filter === 'completed') return todo.is_completed;
        return true;
    });

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My To-Do List</Text>

            <TouchableOpacity
                style={styles.dropdownHeader}
                onPress={() => setShowAddForm((prev) => !prev)}
                activeOpacity={0.8}
            >
                <Text style={styles.dropdownHeaderText}>
                    {showAddForm ? 'Hide Add Task' : 'Add New Task'}
                </Text>
                <Text style={styles.dropdownArrow}>
                    {showAddForm ? '▲' : '▼'}
                </Text>
            </TouchableOpacity>

            {showAddForm && (
                <View style={styles.dropdownContent}>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Enter a task"
                        style={styles.input}
                    />

                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowPicker((prev) => !prev)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.inputLikeText,
                                !selectedDate && styles.placeholderText,
                            ]}
                        >
                            {selectedDate
                                ? selectedDate.toLocaleDateString()
                                : 'Select Deadline'}
                        </Text>
                    </TouchableOpacity>

                    {showPicker && (
                        <>
                            <DateTimePicker
                                value={selectedDate || new Date()}
                                mode="date"
                                display="inline"
                                onChange={(event, date) => {
                                    if (date) {
                                        setSelectedDate(date);
                                    }
                                }}
                                style={{ marginBottom: 10 }}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPicker(false)}
                                style={styles.doneButton}
                            >
                                <Text style={styles.doneButtonText}>Done</Text>
                            </TouchableOpacity>
                        </>
                    )}

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
            )}

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
                    renderItem={({ item }) => {
                        const deadlineStatus = item.is_completed
                            ? 'completed'
                            : getDeadlineStatus(item.deadline_at);
                        const deadlineStyle = getDeadlineStyle(deadlineStatus);

                        return (
                            <View style={[styles.todoItem, deadlineStyle]}>
                                {editingId === item.id ? (
                                    <View style={styles.editRow}>
                                        <TextInput
                                            value={editingTitle}
                                            onChangeText={setEditingTitle}
                                            style={styles.editInput}
                                        />
                                        <TouchableOpacity onPress={() => updateTodo(item.id)}>
                                            <Text style={styles.saveText}>Save</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditingId(null);
                                                setEditingTitle('');
                                            }}
                                        >
                                            <Text style={styles.cancelText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <>
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

                                            {item.deadline_at ? (
                                                <Text style={styles.deadlineText}>
                                                    Due: {new Date(item.deadline_at).toLocaleDateString()}
                                                </Text>
                                            ) : null}

                                            {deadlineStatus !== 'none' && getDeadlineLabel(deadlineStatus) ? (
                                                <Text style={styles.deadlineLabel}>
                                                    {getDeadlineLabel(deadlineStatus)}
                                                </Text>
                                            ) : null}
                                        </TouchableOpacity>

                                        <View style={styles.actionsRow}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setEditingId(item.id);
                                                    setEditingTitle(item.title);
                                                }}
                                            >
                                                <Text style={styles.editText}>Edit</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity onPress={() => deleteTodo(item.id)}>
                                                <Text style={styles.deleteText}>Delete</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
                            </View>
                        );
                    }}
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
        textAlign: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 8,
        paddingHorizontal: 12,
        height: 44,
        justifyContent: 'center',
        backgroundColor: '#fff',
        fontSize: 16,
    },
    addButton: {
        backgroundColor: '#6320c7',
        padding: 8,
        marginTop: 16,
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
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 10,
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
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    editText: {
        color: '#6320c7',
        fontWeight: '600',
        marginRight: 8,
    },
    editRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    editInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40,
        backgroundColor: '#fff',
    },
    saveText: {
        color: '#6320c7',
        fontWeight: '700',
    },
    cancelText: {
        color: 'gray',
        fontWeight: '600',
    },
    deadlineText: {
        fontSize: 12,
        color: '#555',
        marginTop: 4,
    },
    inputColumn: {
        marginBottom: 20,
        gap: 10,
    },
    deadlineLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
        color: '#444',
    },
    inputLikeText: {
        fontSize: 16,
        lineHeight: 20,
        color: '#000',
    },
    placeholderText: {
        color: '#999',
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#6320c7',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 16,
    },
    dropdownHeaderText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    dropdownArrow: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    dropdownContent: {
        backgroundColor: '#f8f6fc',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    doneButton: {
        alignSelf: 'flex-end',
        marginBottom: 10,
    },
    doneButtonText: {
        color: '#6320c7',
        fontWeight: '600',
    },
});

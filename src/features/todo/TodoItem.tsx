import React from "react";
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from "react-native";
import { DeadlineStatus, Todo } from "./todo.types";
import {
    getDeadlineLabel,
    getDeadlineStatus,
    getDeadlineStyle,
} from "./todo.utils";

type TodoItemProps = {
    item: Todo;
    editingId: string | null;
    editingTitle: string;
    setEditingTitle: (value: string) => void;
    setEditingId: (value: string | null) => void;
    onToggle: (item: Todo) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string) => void;
};

export default function TodoItem({
    item,
    editingId,
    editingTitle,
    setEditingTitle,
    setEditingId,
    onToggle,
    onDelete,
    onUpdate,
}: TodoItemProps) {
    const status: DeadlineStatus = item.is_completed
        ? "completed"
        : getDeadlineStatus(item.deadline_at);

    if (editingId === item.id) {
        return (
            <View style={[styles.todoItem, getDeadlineStyle(status)]}>
                <View style={styles.editRow}>
                    <TextInput
                        value={editingTitle}
                        onChangeText={setEditingTitle}
                        style={styles.editInput}
                    />
                    <TouchableOpacity onPress={() => onUpdate(item.id)}>
                        <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            setEditingId(null);
                            setEditingTitle("");
                        }}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.todoItem, getDeadlineStyle(status)]}>
            <TouchableOpacity onPress={() => onToggle(item)} style={styles.todoContent}>
                <Text style={[styles.todoText, item.is_completed && styles.completed]}>
                    {item.is_completed ? "✅" : "⬜"} {item.title}
                </Text>

                {item.deadline_at && (
                    <Text style={styles.deadlineText}>
                        Due: {new Date(item.deadline_at).toLocaleDateString()}
                    </Text>
                )}

                {status !== "none" && getDeadlineLabel(status) ? (
                    <Text style={styles.deadlineLabel}>{getDeadlineLabel(status)}</Text>
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

                <TouchableOpacity onPress={() => onDelete(item.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    todoItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 10,
    },
    todoText: { fontSize: 16 },
    completed: { textDecorationLine: "line-through", color: "gray" },
    todoContent: { flex: 1 },
    deadlineText: { fontSize: 12, color: "#555", marginTop: 4 },
    deadlineLabel: {
        fontSize: 11,
        fontWeight: "600",
        marginTop: 2,
        color: "#444",
    },
    actionsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    editText: { color: "#6320c7", fontWeight: "600", marginRight: 8 },
    deleteText: { color: "red", fontWeight: "600", marginLeft: 12 },
    editRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    editInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40,
        backgroundColor: "#fff",
    },
    saveText: { color: "#6320c7", fontWeight: "700" },
    cancelText: { color: "gray", fontWeight: "600" },
});
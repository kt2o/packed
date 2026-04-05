import { useUser } from "@clerk/clerk-expo";
import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import PomodoroTimer from "../../../components/PomodoroTimer";

import TodoItem from "../../../features/todo/TodoItem";
import { usePomodoro } from "../../../features/todo/usePomodoro";
import {
  configureNotificationHandler,
  requestNotificationPermission,
  scheduleDeadlineReminders,
  sortTodosByDeadline,
} from "../../../features/todo/todo.utils";
import {
  createTodo,
  fetchTodosByUser,
  removeTodo,
  updateTodoCompletion,
  updateTodoTitle,
} from "../../../features/todo/todo.service";
import { Todo, TodoFilter } from "../../../features/todo/todo.types";

configureNotificationHandler();

export default function TodoScreen() {
  const { user } = useUser();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const [filter, setFilter] = useState<TodoFilter>("all");
  const [activeTab, setActiveTab] = useState<"list" | "pomodoro">("list");
  const [showAddForm, setShowAddForm] = useState(false);

  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    minutes,
    seconds,
    isActive,
    isBreak,
    handleToggle,
    handleSwitchMode,
    resetTimerState,
  } = usePomodoro();

  const loadTodos = async (): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await fetchTodosByUser(user.id);

      if (error) {
        console.error("Error loading todos:", error.message);
        return;
      }

      setTodos(sortTodosByDeadline(data || []));
    } catch (err) {
      console.error("Unexpected error loading todos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (): Promise<void> => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !user) return;

    try {
      setAdding(true);
      const deadlineValue = selectedDate ? selectedDate.toISOString() : null;

      const { data, error } = await createTodo({
        title: trimmedTitle,
        user_id: user.id,
        is_completed: false,
        deadline_at: deadlineValue,
      });

      if (error) {
        console.error("Error adding todo:", error.message);
        return;
      }

      if (!data) return;

      setTodos((prev) => sortTodosByDeadline([data, ...prev]));
      setTitle("");
      setSelectedDate(null);
      setShowPicker(false);

      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleDeadlineReminders(
          data.title ?? trimmedTitle,
          data.deadline_at ?? deadlineValue
        );
      }
    } catch (err) {
      console.error("Unexpected error adding todo:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleToggleTodo = async (item: Todo): Promise<void> => {
    try {
      const { data, error } = await updateTodoCompletion(
        item.id,
        !item.is_completed
      );

      if (error) {
        console.error("Error toggling todo:", error.message);
        return;
      }

      if (data) {
        setTodos((prev) =>
          prev.map((todo) => (todo.id === item.id ? data : todo))
        );
      }
    } catch (err) {
      console.error("Unexpected error toggling todo:", err);
    }
  };

  const handleDeleteTodo = async (id: string): Promise<void> => {
    try {
      const { error } = await removeTodo(id);

      if (error) {
        console.error("Error deleting todo:", error.message);
        return;
      }

      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (err) {
      console.error("Unexpected error deleting todo:", err);
    }
  };

  const handleUpdateTodo = async (id: string): Promise<void> => {
    const trimmedTitle = editingTitle.trim();
    if (!trimmedTitle) return;

    try {
      const { data, error } = await updateTodoTitle(id, trimmedTitle);

      if (error) {
        console.error("Error updating todo:", error.message);
        return;
      }

      if (data) {
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? data : todo))
        );
      }

      setEditingId(null);
      setEditingTitle("");
    } catch (err) {
      console.error("Unexpected error updating todo:", err);
    }
  };

  useEffect(() => {
    void loadTodos();
  }, [user]);

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (filter === "active") return !todo.is_completed;
      if (filter === "completed") return todo.is_completed;
      return true;
    });
  }, [todos, filter]);

  return (
    <View style={styles.container}>
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          onPress={() => setActiveTab("list")}
          style={[
            styles.tabItem,
            activeTab === "list" && styles.activeTabBorder,
          ]}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === "list" && styles.activeTabLabel,
            ]}
          >
            Tasks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("pomodoro")}
          style={[
            styles.tabItem,
            activeTab === "pomodoro" && styles.activeTabBorder,
          ]}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === "pomodoro" && styles.activeTabLabel,
            ]}
          >
            Pomodoro
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "list" ? (
        <>
          <Text style={styles.header}>My To-Do List</Text>

          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setShowAddForm((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownHeaderText}>
              {showAddForm ? "Hide Add Task" : "Add New Task"}
            </Text>
            <Text style={styles.dropdownArrow}>{showAddForm ? "▲" : "▼"}</Text>
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
                    : "Select Deadline"}
                </Text>
              </TouchableOpacity>

              {showPicker && (
                <>
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={(event, date) => {
                      if (Platform.OS === "android") {
                        setShowPicker(false);
                        if (event.type === "set" && date) {
                          setSelectedDate(date);
                        }
                        return;
                      }

                      if (date) {
                        setSelectedDate(date);
                      }
                    }}
                    style={{ marginBottom: 10 }}
                  />

                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      onPress={() => setShowPicker(false)}
                      style={styles.doneButton}
                    >
                      <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => void handleAddTodo()}
                disabled={adding}
              >
                <Text style={styles.addButtonText}>
                  {adding ? "Adding..." : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.filterRow}>
            {(["all", "active", "completed"] as TodoFilter[]).map((value) => (
              <TouchableOpacity key={value} onPress={() => setFilter(value)}>
                <Text
                  style={[
                    styles.filterText,
                    filter === value && styles.activeFilter,
                  ]}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <FlatList
              data={filteredTodos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TodoItem
                  item={item}
                  editingId={editingId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  setEditingId={setEditingId}
                  onToggle={(todo) => void handleToggleTodo(todo)}
                  onDelete={(id) => void handleDeleteTodo(id)}
                  onUpdate={(id) => void handleUpdateTodo(id)}
                />
              )}
              ListEmptyComponent={<Text>No To-Do's yet.</Text>}
            />
          )}
        </>
      ) : (
        <PomodoroTimer
          minutes={minutes}
          seconds={seconds}
          isActive={isActive}
          isBreak={isBreak}
          onToggle={() => void handleToggle()}
          onReset={() => void resetTimerState()}
          onSwitchMode={(toBreak: boolean) => void handleSwitchMode(toBreak)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
    backgroundColor: "#fff",
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#6320c7",
    padding: 8,
    marginTop: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "600" },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  filterText: { fontSize: 16, color: "#444" },
  activeFilter: { color: "#6320c7", fontWeight: "700" },
  inputLikeText: { fontSize: 16, lineHeight: 20, color: "#000" },
  placeholderText: { color: "#999" },
  tabSwitcher: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: "center" },
  activeTabBorder: { borderBottomWidth: 3, borderBottomColor: "#6320c7" },
  tabLabel: { fontSize: 16, color: "#999", fontWeight: "600" },
  activeTabLabel: { color: "#6320c7" },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#6320c7",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  dropdownHeaderText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  dropdownArrow: { color: "#fff", fontSize: 16, fontWeight: "700" },
  dropdownContent: {
    backgroundColor: "#f8f6fc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  doneButton: { alignSelf: "flex-end", marginBottom: 10 },
  doneButtonText: { color: "#6320c7", fontWeight: "600" },
});
import { supabase } from "../../../lib/supabase-client";
import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  Vibration,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import PomodoroTimer from "../../../components/PomodoroTimer";

type Todo = {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
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
    { label: "1 week", ms: 7 * 24 * 60 * 60 * 1000 },
    { label: "3 days", ms: 3 * 24 * 60 * 60 * 1000 },
    { label: "1 day", ms: 1 * 24 * 60 * 60 * 1000 },
  ];

  for (const reminder of reminderOffsets) {
    const triggerDate = new Date(deadlineDate.getTime() - reminder.ms);

    if (triggerDate > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Task deadline coming up",
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
  if (!deadlineAt) return "none";

  const now = new Date();
  const deadline = new Date(deadlineAt);

  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "overdue";
  if (diffDays <= 1) return "oneDay";
  if (diffDays <= 3) return "threeDays";
  if (diffDays <= 7) return "oneWeek";
  return "normal";
}

function getDeadlineStyle(status: string) {
  switch (status) {
    case "completed":
      return { backgroundColor: "#f5f5f5", borderColor: "#d9d9d9" };
    case "overdue":
      return { backgroundColor: "#ffe5e5", borderColor: "#ff4d4f" };
    case "oneDay":
      return { backgroundColor: "#fff1e6", borderColor: "#ff7a45" };
    case "threeDays":
      return { backgroundColor: "#fff7e6", borderColor: "#fa8c16" };
    case "oneWeek":
      return { backgroundColor: "#fffbe6", borderColor: "#fadb14" };
    default:
      return { backgroundColor: "#ffffff", borderColor: "#eeeeee" };
  }
}

function getDeadlineLabel(status: string) {
  switch (status) {
    case "overdue":
      return "Overdue";
    case "oneDay":
      return "Due within 1 day";
    case "threeDays":
      return "Due within 3 days";
    case "oneWeek":
      return "Due within 1 week";
    default:
      return "";
  }
}

function sortTodosByDeadline(items: Todo[]) {
  return [...items].sort((a, b) => {
    if (a.deadline_at && b.deadline_at) {
      return (
        new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime()
      );
    }

    if (a.deadline_at && !b.deadline_at) return -1;
    if (!a.deadline_at && b.deadline_at) return 1;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export default function TodoScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editingTitle, setEditingTitle] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "pomodoro">("list");

  const [showAddForm, setShowAddForm] = useState(false);

  // persistent timer state
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const expirationTimeRef = useRef<number | null>(null);

  // handle backgrounding
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive) {
      interval = setInterval(() => {
        const now = Date.now();
        if (expirationTimeRef.current && now >= expirationTimeRef.current) {
          setMinutes(0);
          setSeconds(0);
          setIsActive(false);
          expirationTimeRef.current = null;
          triggerCompletionAlert();
        } else if (expirationTimeRef.current) {
          const diff = expirationTimeRef.current - now;
          setMinutes(Math.floor(diff / 1000 / 60));
          setSeconds(Math.floor((diff / 1000) % 60));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleToggle = async () => {
    if (!isActive) {
      const totalSeconds = minutes * 60 + seconds;
      const totalMs = totalSeconds * 1000;
      expirationTimeRef.current = Date.now() + totalMs;
      setIsActive(true);

      if (totalSeconds > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Time's Up!",
            body: `Your ${isBreak ? "Break" : "Focus"
              } session is finished. Tap to return.`,
            data: { type: "pomodoro_end" },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: totalSeconds,
          },
        });
      }
    } else {
      setIsActive(false);
      expirationTimeRef.current = null;
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const handleSwitchMode = async (toBreak: boolean) => {
    setIsActive(false);
    expirationTimeRef.current = null;
    await Notifications.cancelAllScheduledNotificationsAsync();
    setIsBreak(toBreak);
    setMinutes(toBreak ? 5 : 25);
    setSeconds(0);
  };

  const triggerCompletionAlert = () => {
    Vibration.vibrate([500, 500, 500]);
    Alert.alert("Time's Up!", `Ready for your ${isBreak ? "Work" : "Break"}?`, [
      { text: "OK", onPress: () => handleSwitchMode(!isBreak) },
    ]);
  };

  const { user } = useUser();

  async function loadTodos() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("todo_list")
      .select("*")
      .eq("user_id", user.id);
    if (error) {
      console.error("Error loading todos:", error.message);
    } else {
      setTodos(sortTodosByDeadline(data || []));
    }
    setLoading(false);
  }

  async function handleAddTodo() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !user) return;
    setAdding(true);
    const deadlineValue = selectedDate ? selectedDate.toISOString() : null;
    const { data, error } = await supabase
      .from("todo_list")
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
      console.error("Error adding todo:", error.message);
    } else if (data) {
      setTodos((prev) => sortTodosByDeadline([data, ...prev]));
      setTitle("");
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
      .from("todo_list")
      .update({ is_completed: !item.is_completed })
      .eq("id", item.id)
      .select()
      .single();
    if (data) {
      setTodos((prev) =>
        prev.map((todo) => (todo.id === item.id ? data : todo))
      );
    }
  }

  async function deleteTodo(id: string) {
    const { error } = await supabase.from("todo_list").delete().eq("id", id);
    if (!error) setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  async function updateTodo(id: string) {
    const trimmedTitle = editingTitle.trim();
    if (!trimmedTitle) return;
    const { data, error } = await supabase
      .from("todo_list")
      .update({ title: trimmedTitle })
      .eq("id", id)
      .select()
      .single();
    if (data)
      setTodos((prev) => prev.map((todo) => (todo.id === id ? data : todo)));
    setEditingId(null);
    setEditingTitle("");
  }

  async function requestNotificationPermission() {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === "granted";
  }

  useEffect(() => {
    if (user) loadTodos();
  }, [user]);

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.is_completed;
    if (filter === "completed") return todo.is_completed;
    return true;
  });

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
                onPress={() => setShowPicker(true)}
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
                onPress={handleAddTodo}
                disabled={adding}
              >
                <Text style={styles.addButtonText}>
                  {adding ? "Adding..." : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.filterRow}>
            {["all", "active", "completed"].map((f) => (
              <TouchableOpacity key={f} onPress={() => setFilter(f as any)}>
                <Text
                  style={[
                    styles.filterText,
                    filter === f && styles.activeFilter,
                  ]}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
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
              renderItem={({ item }) => {
                const status = item.is_completed
                  ? "completed"
                  : getDeadlineStatus(item.deadline_at);
                return (
                  <View style={[styles.todoItem, getDeadlineStyle(status)]}>
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
                            setEditingTitle("");
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
                            {item.is_completed ? "✅" : "⬜"} {item.title}
                          </Text>
                          {item.deadline_at && (
                            <Text style={styles.deadlineText}>
                              Due:{" "}
                              {new Date(item.deadline_at).toLocaleDateString()}
                            </Text>
                          )}
                          {status !== "none" && getDeadlineLabel(status) && (
                            <Text style={styles.deadlineLabel}>
                              {getDeadlineLabel(status)}
                            </Text>
                          )}
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
        </>
      ) : (
        <PomodoroTimer
          minutes={minutes}
          seconds={seconds}
          isActive={isActive}
          isBreak={isBreak}
          onToggle={handleToggle}
          onReset={() => {
            setIsActive(false);
            expirationTimeRef.current = null;
            setMinutes(isBreak ? 5 : 25);
            setSeconds(0);
          }}
          onSwitchMode={handleSwitchMode}
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
  deleteText: { color: "red", fontWeight: "600", marginLeft: 12 },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  filterText: { fontSize: 16, color: "#444" },
  activeFilter: { color: "#6320c7", fontWeight: "700" },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  editText: { color: "#6320c7", fontWeight: "600", marginRight: 8 },
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
  deadlineText: { fontSize: 12, color: "#555", marginTop: 4 },
  deadlineLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    color: "#444",
  },
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

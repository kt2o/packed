import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface PomodoroProps {
  minutes: number;
  seconds: number;
  isActive: boolean;
  isBreak: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSwitchMode: (toBreak: boolean) => void;
}

export default function PomodoroTimer({
  minutes,
  seconds,
  isActive,
  isBreak,
  onToggle,
  onReset,
  onSwitchMode,
}: PomodoroProps) {
  const displayTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  return (
    <View style={styles.content}>
      <View style={styles.modeToggle}>
        <TouchableOpacity
          onPress={() => onSwitchMode(false)}
          style={[styles.modeBtn, !isBreak && styles.activeModeBtn]}
        >
          <Text style={[styles.modeText, !isBreak && styles.activeModeText]}>
            Focus
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSwitchMode(true)}
          style={[styles.modeBtn, isBreak && styles.activeModeBtn]}
        >
          <Text style={[styles.modeText, isBreak && styles.activeModeText]}>
            Break
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.timerText}>{displayTime}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.startBtn} onPress={onToggle}>
          <Text style={styles.startBtnText}>
            {isActive ? "PAUSE" : "START"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetBtnText}>RESET</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    marginBottom: 50,
  },
  modeBtn: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20 },
  activeModeBtn: { backgroundColor: "#6320c7" },
  modeText: { color: "#666", fontWeight: "600" },
  activeModeText: { color: "#FFF" },
  timerText: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 50,
  },
  buttonRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  startBtn: {
    backgroundColor: "#6320c7",
    paddingHorizontal: 45,
    paddingVertical: 15,
    borderRadius: 30,
  },
  startBtnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  resetBtn: { padding: 10 },
  resetBtnText: { color: "#999", fontWeight: "600" },
});

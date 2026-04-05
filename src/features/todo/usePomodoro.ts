import { useEffect, useRef, useState } from "react";
import { Alert, Vibration } from "react-native";
import * as Notifications from "expo-notifications";
import { BREAK_MINUTES, FOCUS_MINUTES } from "./todo.utils";

export function usePomodoro() {
  const [minutes, setMinutes] = useState(FOCUS_MINUTES);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const expirationTimeRef = useRef<number | null>(null);

  const resetTimerState = async (nextIsBreak: boolean = isBreak) => {
    setIsActive(false);
    expirationTimeRef.current = null;
    await Notifications.cancelAllScheduledNotificationsAsync();
    setMinutes(nextIsBreak ? BREAK_MINUTES : FOCUS_MINUTES);
    setSeconds(0);
  };

  const handleSwitchMode = async (toBreak: boolean): Promise<void> => {
    setIsBreak(toBreak);
    await resetTimerState(toBreak);
  };

  const triggerCompletionAlert = (): void => {
    Vibration.vibrate([500, 500, 500]);
    Alert.alert("Time's Up!", `Ready for your ${isBreak ? "Work" : "Break"}?`, [
      {
        text: "OK",
        onPress: () => {
          void handleSwitchMode(!isBreak);
        },
      },
    ]);
  };

  const handleToggle = async (): Promise<void> => {
    if (isActive) {
      await resetTimerState();
      return;
    }

    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds <= 0) return;

    expirationTimeRef.current = Date.now() + totalSeconds * 1000;
    setIsActive(true);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time's Up!",
        body: `Your ${isBreak ? "Break" : "Focus"} session is finished. Tap to return.`,
        data: { type: "pomodoro_end" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: totalSeconds,
      },
    });
  };

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();

      if (expirationTimeRef.current && now >= expirationTimeRef.current) {
        setMinutes(0);
        setSeconds(0);
        setIsActive(false);
        expirationTimeRef.current = null;
        triggerCompletionAlert();
        return;
      }

      if (expirationTimeRef.current) {
        const diff = expirationTimeRef.current - now;
        setMinutes(Math.floor(diff / 1000 / 60));
        setSeconds(Math.floor((diff / 1000) % 60));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isBreak]);

  return {
    minutes,
    seconds,
    isActive,
    isBreak,
    handleToggle,
    handleSwitchMode,
    resetTimerState,
  };
}
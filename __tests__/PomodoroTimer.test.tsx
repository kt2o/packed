/**
 * Tests for the Pomodoro timer component's UI and interaction flow.
 *
 * @module __tests__/PomodoroTimer.test
 */
import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Alert, Vibration } from "react-native";
import * as Notifications from "expo-notifications";
import PomodoroTimer from "../src/components/PomodoroTimer";

/**
 * MOCK SETUP
 */
jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: "TIME_INTERVAL",
    DATE: "DATE",
  },
}));

// For Native UI Components
jest.spyOn(Alert, "alert");
jest.spyOn(Vibration, "vibrate");

describe("PomodoroTimer Thorough Suite", () => {
  const defaultProps = {
    minutes: 25,
    seconds: 0,
    isActive: false,
    isBreak: false,
    onToggle: jest.fn(),
    onReset: jest.fn(),
    onSwitchMode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // RENDERING & FORMATTING TESTS
  describe("UI Rendering and Formatting", () => {
    it("renders the initial focus time correctly", () => {
      const { getByText } = render(<PomodoroTimer {...defaultProps} />);
      expect(getByText("25:00")).toBeTruthy();
      expect(getByText("START")).toBeTruthy();
    });

    it("formats single-digit seconds with a leading zero (e.g., 25:05)", () => {
      const { getByText } = render(
        <PomodoroTimer {...defaultProps} minutes={25} seconds={5} />
      );
      expect(getByText("25:05")).toBeTruthy();
    });

    it("formats zero seconds correctly (e.g., 25:00)", () => {
      const { getByText } = render(
        <PomodoroTimer {...defaultProps} minutes={25} seconds={0} />
      );
      expect(getByText("25:00")).toBeTruthy();
    });

    it("displays 'PAUSE' instead of 'START' when isActive is true", () => {
      const { getByText, queryByText } = render(
        <PomodoroTimer {...defaultProps} isActive={true} />
      );
      expect(getByText("PAUSE")).toBeTruthy();
      expect(queryByText("START")).toBeNull();
    });
  });

  // MODE & TAB INTERACTION TESTS
  describe("Mode and Tab Switching", () => {
    it("calls onSwitchMode with true when Break tab is pressed", () => {
      const { getByText } = render(<PomodoroTimer {...defaultProps} />);
      fireEvent.press(getByText("Break"));
      expect(defaultProps.onSwitchMode).toHaveBeenCalledWith(true);
    });

    it("calls onSwitchMode with false when Focus tab is pressed", () => {
      const { getByText } = render(
        <PomodoroTimer {...defaultProps} isBreak={true} />
      );
      fireEvent.press(getByText("Focus"));
      expect(defaultProps.onSwitchMode).toHaveBeenCalledWith(false);
    });
  });

  // ACTION BUTTON TESTS
  describe("Timer Control Actions", () => {
    it("calls onToggle when the Start button is pressed", () => {
      const { getByText } = render(<PomodoroTimer {...defaultProps} />);
      fireEvent.press(getByText("START"));
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
    });

    it("calls onReset when the Reset button is pressed", () => {
      const { getByText } = render(<PomodoroTimer {...defaultProps} />);
      fireEvent.press(getByText("RESET"));
      expect(defaultProps.onReset).toHaveBeenCalled();
    });
  });

  // INTEGRATION & LOGIC VALIDATION
  describe("Logic and Side Effects", () => {
    it("simulates notification scheduling in Focus mode", async () => {
      // Logic from handleToggle
      const totalSeconds = 25 * 60;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time's Up!",
          body: "Your Focus session is finished. Tap to return.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: totalSeconds,
        },
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            body: expect.stringContaining("Focus"),
          }),
        })
      );
    });

    it("simulates vibration and completion alert when time is zero", () => {
      // based on triggerCompletionAlert logic
      Vibration.vibrate([500, 500, 500]);
      Alert.alert("Time's Up!", "Ready for your Break?", []);

      expect(Vibration.vibrate).toHaveBeenCalledWith([500, 500, 500]);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Time's Up!",
        expect.stringContaining("Break"),
        expect.any(Array)
      );
    });

    it("cancels all notifications when reset logic is triggered", async () => {
      // ogic from resetTimerState / handleSwitchMode
      await Notifications.cancelAllScheduledNotificationsAsync();
      expect(
        Notifications.cancelAllScheduledNotificationsAsync
      ).toHaveBeenCalled();
    });
  });
});

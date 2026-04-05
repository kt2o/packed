import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import PomodoroTimer from "../src/components/PomodoroTimer";

describe("PomodoroTimer Component", () => {
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
  });

  it("renders the initial focus time correctly", () => {
    const { getByText } = render(<PomodoroTimer {...defaultProps} />);

    expect(getByText("25:00")).toBeTruthy();
    expect(getByText("START")).toBeTruthy();
  });

  it("calls onToggle when the Start button is pressed", () => {
    const { getByText } = render(<PomodoroTimer {...defaultProps} />);

    fireEvent.press(getByText("START"));

    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onSwitchMode with true when Break tab is pressed', () => {
    const { getByText } = render(<PomodoroTimer {...defaultProps} />);

    fireEvent.press(getByText("Break"));

    expect(defaultProps.onSwitchMode).toHaveBeenCalledWith(true);
  });
});

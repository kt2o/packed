import { render, fireEvent } from "@testing-library/react-native";
import PomodoroTimer from "../src/components/PomodoroTimer";

describe("PomodoroTimer Component", () => {
  // fake props
  const defaultProps = {
    minutes: 25,
    seconds: 0,
    isActive: false,
    isBreak: false,
    onToggle: jest.fn(),
    onReset: jest.fn(),
    onSwitchMode: jest.fn(),
  };

  it("renders the initial focus time correctly", () => {
    const { getByText } = render(<PomodoroTimer {...defaultProps} />);

    // check if 25:00 is visible
    expect(getByText("25:00")).toBeTruthy();
    expect(getByText("START")).toBeTruthy();
  });

  it("calls onToggle when the Start button is pressed", () => {
    const { getByText } = render(<PomodoroTimer {...defaultProps} />);

    // simulate clicking START
    const startButton = getByText("START");
    fireEvent.press(startButton);

    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onSwitchMode with "true" when Break tab is pressed', () => {
    const { getByText } = render(<PomodoroTimer {...defaultProps} />);

    // simulate switching to Break mode
    const breakButton = getByText("Break");
    fireEvent.press(breakButton);

    expect(defaultProps.onSwitchMode).toHaveBeenCalledWith(true);
  });
});

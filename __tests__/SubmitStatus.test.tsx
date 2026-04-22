import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SubmitScreen from "../src/app/(protected)/(tabs)/submit";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSupabase } from "../src/lib/supabase-client";
import { useUser } from "@clerk/clerk-expo";
import { spots } from "../src/config/studySpots";

// ---- MOCKS ----
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  useFocusEffect: jest.fn(() => {}),
}));

jest.mock("@clerk/clerk-expo", () => ({
  useUser: jest.fn(),
}));

jest.mock("../src/lib/supabase-client", () => ({
  useSupabase: jest.fn(),
}));

jest.mock("../src/config/studySpots", () => ({
  spots: [
    {
      id: "ksl",
      displayName: "KSL",
      floors: [{ id: "ksl1", displayName: "Floor 1" }],
    },
  ],
}));

jest.mock("react-native-element-dropdown", () => ({
  Dropdown: () => null,
}));

jest.mock("../src/components/LocationDropDown", () => {
  return () => null;
});

global.alert = jest.fn();

// ---- TEST SETUP ----
const mockRouter = { push: jest.fn(), back: jest.fn() };
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
  })),
};

describe("SubmitScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useUser as jest.Mock).mockReturnValue({ user: { id: "user-123" } });
    (useSupabase as jest.Mock).mockReturnValue(mockSupabase);

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      verified: "false",
    });
  });

  test("renders title and dropdown", () => {
    const { getByText } = render(<SubmitScreen />);

    expect(getByText("Study Location Status")).toBeTruthy();
    expect(getByText("Location")).toBeTruthy();
  });

  test("shows error if submitting with no selected spot", () => {
    const { getByText } = render(<SubmitScreen />);

    fireEvent.press(getByText("Submit"));

    expect(global.alert).toHaveBeenCalledWith(
      "Error",
      "No location was provided."
    );
  });

  test("navigates to SpotScreen when cooldown allows", async () => {
    // Mock cooldown query: no recent check-ins
    mockSupabase.from().select().eq().eq().order().limit.mockResolvedValue({
      data: [],
    });

    const { getByText, getByPlaceholderText } = render(<SubmitScreen />);

    // Select spot
    fireEvent.press(getByText("Where are you?"));
    fireEvent.press(getByText("KSL"));

    // Select floor
    fireEvent.press(getByText("Floor 1"));

    // Select status
    fireEvent.press(getByText("Empty"));

    // Submit
    fireEvent.press(getByText("Submit"));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/spot/[id]",
        params: {
          id: "ksl",
          floorId: "ksl1",
          status: "empty",
          returnTo: "submit",
        },
      });
    });
  });

  test("blocks submission if cooldown not expired", async () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

    mockSupabase.from().select().eq().eq().order().limit.mockResolvedValue({
      data: [{ updated_at: recent.toISOString() }],
    });

    const { getByText } = render(<SubmitScreen />);

    fireEvent.press(getByText("Where are you?"));
    fireEvent.press(getByText("KSL"));
    fireEvent.press(getByText("Floor 1"));
    fireEvent.press(getByText("Empty"));

    fireEvent.press(getByText("Submit"));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });
});

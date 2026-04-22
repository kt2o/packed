import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSupabase } from "../src/lib/supabase-client";
import { useUser } from "@clerk/clerk-expo";


// 1. Load react-native WITHOUT hoisting
const RN = require("react-native");

// 2. Mock Alert BEFORE importing SubmitScreen
jest.spyOn(RN.Alert, "alert").mockImplementation(() => {});

// 2. IMPORT THE COMPONENT
import SubmitScreen from "../src/app/(protected)/(tabs)/submit";

// ---- MODULE MOCKS ----
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockInsert = jest.fn();
const mockFrom = jest.fn();

const staticParams = { verified: "false", id: undefined, floorId: undefined, status: undefined };

// At the top of your test file
jest.mock("expo-router", () => ({
  // Instead of an arrow function, use jest.fn()
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  useFocusEffect: jest.fn(),
}));

jest.mock("@clerk/clerk-expo", () => ({
  useUser: jest.fn(),
}));

jest.mock("../src/lib/supabase-client", () => ({
  useSupabase: jest.fn(),
}));

// Mock the study spots config
jest.mock("../src/config/studySpots", () => ({
  spots: [
    {
      id: "ksl",
      displayName: "KSL",
      floors: [{ id: "ksl1", displayName: "Floor 1" }],
    },
  ],
}));

// Mock icons to prevent 'act' warnings or rendering errors
jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
  Ionicons: () => null,
  FontAwesome: () => null,
}));

// Mock the dropdown component
jest.mock("../src/components/LocationDropDown", () => {
  const { Text, TouchableOpacity } = require("react-native");
  return ({ label, onChange }) => (
    <TouchableOpacity testID="location-dropdown" onPress={() => onChange("ksl")}>
      <Text>{label}</Text>
    </TouchableOpacity>
  );
});

// ---- THE KEY FIX: MOCKING ALERT ----
// Instead of global.alert (which works for web-style alert()),
// we spy on the specific RN Alert object.


const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  insert: jest.fn().mockResolvedValue({ error: null }),
};

const mockRouter = { push: jest.fn(), back: jest.fn() };

 const stableSupabase = { from: () => mockSupabase };


 describe("SubmitScreen", () => {
   beforeEach(() => {
     jest.clearAllMocks();

     // Return the STABLE object reference
     (useSupabase as jest.Mock).mockReturnValue(stableSupabase);

     // Do the same for router and user
     (useRouter as jest.Mock).mockReturnValue({
       push: mockPush,
       back: mockBack,
     });

     (useUser as jest.Mock).mockReturnValue({
       user: { id: "test-user-id" },
     });

     // CRITICAL: Ensure search params are stable
     (useLocalSearchParams as jest.Mock).mockImplementation(() => staticParams);
   });

  test("shows error if submitting with no selected spot", () => {
    const { Alert } = RN;

    const { getByText } = render(<SubmitScreen />);

    fireEvent.press(getByText("Submit"));

    // Now this matches the style of your other test
    expect(RN.Alert.alert).toHaveBeenCalledWith(
      "Error",
      "No location was provided."
    );
  });

  test("blocks submission if cooldown not expired", async () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 10 * 60 * 1000); // 10 mins ago

    // Mock supabase response for the check
    const mockFrom = mockSupabase.from();
    mockFrom.select().eq().eq().order().limit.mockResolvedValue({
      data: [{ updated_at: recent.toISOString() }],
    });

    const { getByText, getByTestId } = render(<SubmitScreen />);

    // Select location and floor to get past initial validation
    fireEvent.press(getByTestId("location-dropdown"));
    fireEvent.press(getByText("Floor 1"));
    fireEvent.press(getByText("Submit"));

    await waitFor(() => {
      expect(RN.Alert.alert).toHaveBeenCalledWith(
        "Check-In Complete",
        expect.stringContaining("minutes before checking in again")
      );
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });
});
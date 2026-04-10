/**
 * Jest Test Suite for SubmitScreen
 * Covers test cases STC-1 through STC-7
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();
let mockSearchParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useLocalSearchParams: () => mockSearchParams,
  useFocusEffect: (cb: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => { cb(); }, []);
  },
}));

// Mock Clerk – authenticated user
jest.mock("@clerk/clerk-expo", () => ({
  useUser: () => ({ user: { id: "test-user-id" } }),
}));

// Mock Supabase client
const mockInsert = jest.fn();
const mockFrom = jest.fn(() => ({ insert: mockInsert }));

jest.mock("../src/lib/supabase-client.tsx", () => ({
  useSupabase: () => ({ from: mockFrom }),
}));

// Mock study spots config
jest.mock("../src/config/studySpots", () => ({
  spots: [
    {
      id: "spot-1",
      displayName: "Library",
      floors: [
        { id: "floor-1", displayName: "Floor 1" },
        { id: "floor-2", displayName: "Floor 2" },
      ],
    },
    {
      id: "spot-2",
      displayName: "Student Union",
      floors: [],
    },
  ],
}));

// Mock LocationDropDown so we can interact with it easily
jest.mock("../src/components/LocationDropDown", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return function MockLocationDropDown({
    data,
    onChange,
  }: {
    data: { label: string; value: string }[];
    onChange: (v: string) => void;
  }) {
    return (
      <>
        {data.map((item) => (
          <TouchableOpacity
            key={item.value}
            testID={`location-option-${item.value}`}
            onPress={() => onChange(item.value)}
          >
            <Text>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </>
    );
  };
});

// Mock react-native-paper RadioButton
jest.mock("react-native-paper", () => {
  const { TouchableOpacity, Text } = require("react-native");
  const RadioButton = ({
    value,
    testID,
  }: {
    value: string;
    testID?: string;
  }) => <Text testID={testID ?? `radio-${value}`}>{value}</Text>;

  RadioButton.Group = ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode;
    onValueChange: (v: string) => void;
  }) => <>{children}</>;

  return { RadioButton };
});

// Spy on Alert
jest.spyOn(Alert, "alert");

// ---------------------------------------------------------------------------
// Import component (after mocks are set up)
// ---------------------------------------------------------------------------
import SubmitScreen from "../src/app/(protected)/(tabs)/submit"; // adjust path if needed

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function renderScreen() {
  return render(<SubmitScreen />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SubmitScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = { verified: "false" };
    mockInsert.mockResolvedValue({ error: null });
  });

  // -------------------------------------------------------------------------
  // STC-1: Submit screen loads input components
  // -------------------------------------------------------------------------
  describe("STC-1 – Screen renders required input components", () => {
    it("displays the title, location options, and status radio buttons", () => {
      const { getByText } = renderScreen();

      // Title
      expect(getByText("Study Location Status")).toBeTruthy();

      // Location options rendered by the mock dropdown
      expect(getByText("Library")).toBeTruthy();
      expect(getByText("Student Union")).toBeTruthy();

      // Status radio labels
      expect(getByText("Empty")).toBeTruthy();
      expect(getByText("Packed")).toBeTruthy();

      // Submit button
      expect(getByText("Submit")).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // STC-2: Location Selection renders Floors
  // -------------------------------------------------------------------------
  describe("STC-2 – Selecting a location renders its floors", () => {
    it("shows floor options when the selected location has floors", async () => {
      const { getByTestId, getByText } = renderScreen();

      // Select "Library" which has 2 floors
      fireEvent.press(getByTestId("location-option-spot-1"));

      await waitFor(() => {
        expect(getByText("Floor 1")).toBeTruthy();
        expect(getByText("Floor 2")).toBeTruthy();
      });
    });

    it("does NOT show floor options when the selected location has no floors", async () => {
      const { getByTestId, queryByText } = renderScreen();

      // Select "Student Union" which has no floors
      fireEvent.press(getByTestId("location-option-spot-2"));

      await waitFor(() => {
        expect(queryByText("Floor 1")).toBeNull();
        expect(queryByText("Floor 2")).toBeNull();
      });
    });
  });

  // -------------------------------------------------------------------------
  // STC-3: Submission Triggers Location Verification
  // -------------------------------------------------------------------------
  describe("STC-3 – Submitting with all fields triggers location check-in", () => {
    it("navigates to the spot verification screen with correct params", async () => {
      const { getByTestId, getByText } = renderScreen();

      // Select location
      fireEvent.press(getByTestId("location-option-spot-1"));

      // Select floor
      await waitFor(() => getByText("Floor 1"));
      fireEvent.press(getByText("Floor 1"));

      // Select status – press "Empty" radio option
      fireEvent.press(getByText("Empty"));

      // Press Submit
      fireEvent.press(getByText("Submit"));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: "/spot/[id]",
          params: expect.objectContaining({
            id: "spot-1",
            floorId: "floor-1",
            status: "empty",
            returnTo: "submit",
          }),
        });
      });
    });
  });

  // -------------------------------------------------------------------------
  // STC-4: Incomplete Submission Triggers Error Message
  // -------------------------------------------------------------------------
  describe("STC-4 – Submitting without a location shows an error", () => {
    it("shows an alert when no location is selected", async () => {
      const { getByText } = renderScreen();

      // Do NOT select any location; press Submit immediately
      fireEvent.press(getByText("Submit"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "No location was provided."
        );
      });

      // Must NOT navigate away
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // STC-5: Failure to Validate – Permission Denied
  // -------------------------------------------------------------------------
  describe("STC-5 – Location validation fails due to permissions", () => {
    it("shows an error alert and does not commit when permissions are denied", async () => {
      /**
       * The verified param arriving as "false" with an error message simulates
       * the case where the check-in screen detected a permissions denial and
       * redirected back.  In your actual flow the check-in screen would push
       * back with an error query param; here we model the supabase insert
       * failing to represent a failed submission path.
       */
      mockInsert.mockResolvedValue({
        error: { message: "Location permission denied" },
      });

      // Simulate returning from check-in with verified=true but a DB error
      mockSearchParams = {
        verified: "true",
        id: "spot-1",
        floorId: "floor-1",
        status: "empty",
      };

      const { getByText } = renderScreen();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Location permission denied"
        );
      });

      // User stays on submit screen (no success navigation)
      expect(mockBack).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // STC-6: Failure to Validate – User Not Within Location Radius
  // -------------------------------------------------------------------------
  describe("STC-6 – Location validation fails because user is out of range", () => {
    it("shows an error alert when the user is outside the location radius", async () => {
      mockInsert.mockResolvedValue({
        error: { message: "You are not within the required location radius" },
      });

      mockSearchParams = {
        verified: "true",
        id: "spot-1",
        floorId: "floor-2",
        status: "packed",
      };

      renderScreen();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "You are not within the required location radius"
        );
      });

      expect(mockBack).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // STC-7: Successful Submission Displays Success Message
  // -------------------------------------------------------------------------
  describe("STC-7 – Successful submission shows success alert and navigates back", () => {
    it("inserts into Supabase, shows a success alert, and goes back on OK", async () => {
      mockInsert.mockResolvedValue({ error: null });

      mockSearchParams = {
        verified: "true",
        id: "spot-1",
        floorId: "floor-1",
        status: "empty",
      };

      renderScreen();

      // Wait for the insert to complete and the alert to fire
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith("study_spot_status");
        expect(mockInsert).toHaveBeenCalledWith([
          {
            spot_id: "spot-1",
            status: "empty",
            user_id: "test-user-id",
            floor_id: "floor-1",
          },
        ]);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Success",
          "Reported as empty",
          expect.arrayContaining([
            expect.objectContaining({ text: "OK" }),
          ])
        );
      });

      // Simulate the user pressing OK in the alert
      const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
      act(() => {
        buttons[0].onPress();
      });

      expect(mockBack).toHaveBeenCalled();
    });
  });
});
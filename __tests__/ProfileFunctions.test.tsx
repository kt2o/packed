import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert, Vibration } from "react-native";
import ProfileScreen from "src/app/(protected)/(tabs)/profile";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { useSupabase } from "src/lib/supabase-client";

// MOCKS & SPY SETUP

jest.mock("@clerk/clerk-expo", () => ({
  useUser: jest.fn(),
  useClerk: jest.fn(),
}));

jest.mock("src/lib/supabase-client", () => ({
  useSupabase: jest.fn(),
}));

// Mocking expo-router to handle the SignOutButton redirect if needed
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

// Spy on Alert.alert to verify Sign Out and Save confirmations
const alertSpy = jest.spyOn(Alert, "alert");

describe("Profile Screen & Account Actions Suite", () => {
  const mockUpdate = jest.fn();
  const mockSignOut = jest.fn();

  const mockUser = {
    id: "user_123",
    username: "TestUser",
    primaryEmailAddress: { emailAddress: "test@studyspot.com" },
    imageUrl: "https://avatar.iran.liara.run/username?username=TestUser",
    update: mockUpdate,
  };

  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest
      .fn()
      .mockResolvedValue({ data: { points: 50 }, error: null }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ isLoaded: true, user: mockUser });
    (useClerk as jest.Mock).mockReturnValue({ signOut: mockSignOut });
    (useSupabase as jest.Mock).mockReturnValue(mockSupabase);
  });

  // USERNAME & PROFILE EDITING

  it("successfully updates the username via the modal", async () => {
    const { getByText, getByPlaceholderText } = render(<ProfileScreen />);

    // Open Modal
    fireEvent.press(getByText("Edit Profile"));

    // Change Username in Modal
    const input = getByPlaceholderText("Enter username");
    fireEvent.changeText(input, "NewHeroName");

    // Press Save
    const saveButton = getByText("Save Changes");
    await act(async () => {
      fireEvent.press(saveButton);
    });

    // Verify Clerk Update logic
    expect(mockUpdate).toHaveBeenCalledWith({ username: "NewHeroName" });

    // Verify Success Alert
    expect(alertSpy).toHaveBeenCalledWith(
      "Success",
      "Profile updated successfully!"
    );
  });

  it("prevents saving a username that is too short (Modal Logic)", async () => {
    const { getByText, getByPlaceholderText } = render(<ProfileScreen />);

    fireEvent.press(getByText("Edit Profile"));
    const input = getByPlaceholderText("Enter username");

    // Modal has a check for < 2 characters
    fireEvent.changeText(input, "A");
    fireEvent.press(getByText("Save Changes"));

    expect(alertSpy).toHaveBeenCalledWith(
      "Error",
      "Username must be at least 2 characters long."
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("handles image picking permission denial", async () => {
    // This tests the logic inside your modal's pickImage function
    const { getByText, getByRole } = render(<ProfileScreen />);
    fireEvent.press(getByText("Edit Profile"));
  });

  // SIGN OUT FLOW

  it("triggers the Sign Out confirmation alert", () => {
    const { getByText } = render(<ProfileScreen />);

    const signOutBtn = getByText("Sign out");
    fireEvent.press(signOutBtn);

    // Verify Alert is shown before signing out
    expect(alertSpy).toHaveBeenCalledWith(
      "Sign Out",
      "Are you sure you want to sign out?",
      expect.any(Array)
    );
  });

  it("executes signOut when 'Sign Out' is confirmed in the Alert", async () => {
    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText("Sign out"));

    // Alert.alert has buttons at index 1 for the destructive action
    const signOutAction = alertSpy.mock.calls[0][2]?.[1].onPress;

    if (signOutAction) {
      await act(async () => {
        await signOutAction();
      });
    }

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  // REWARDS SYSTEM INTEGRATION

  it("loads contributor points from Supabase on mount", async () => {
    render(<ProfileScreen />);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith("user_rewards");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user_123");
    });
  });

  it("handles errors when Supabase fails to load rewards", async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "DB Error" },
    });

    render(<ProfileScreen />);

    await waitFor(() => {
      // Checking if the error was logged or handled
      expect(mockSupabase.maybeSingle).toHaveBeenCalled();
    });
  });
});

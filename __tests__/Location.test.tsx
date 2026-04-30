/**
 * Location-related tests for study spot validation and geolocation helpers.
 *
 * @module __tests__/Location.test
 */
jest.mock("../src/config/studySpots", () => ({
  spots: [
    {
      id: "ksl",
      displayName: "KSL",
      lat: 10,
      lng: 20,
      radius: 50,
      floors: [{ id: "ksl1", displayName: "Floor 1" }],
    },
  ],
}));

// __tests__/Location.test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SpotScreen from "../src/app/spot/[id]";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSupabase } from "../src/lib/supabase-client";
import { useUser } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { getCurrentLocation } from "../src/lib/location";
import { getDistanceMeters } from "../src/lib/distance";

// ---- MODULE MOCKS ----
jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock("@clerk/clerk-expo", () => ({
  useUser: jest.fn(),
}));

jest.mock("../src/lib/supabase-client", () => ({
  useSupabase: jest.fn(),
}));

jest.mock("../src/lib/location", () => ({
  getCurrentLocation: jest.fn(),
}));

jest.mock("../src/lib/distance", () => ({
  getDistanceMeters: jest.fn(),
}));

jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
}));

// avoid crashes on alert()
global.alert = jest.fn() as any;

// ---- TEST DATA ----
const mockRouter = { replace: jest.fn(), push: jest.fn(), back: jest.fn() };
const mockInsert = jest.fn();

const mockSupabase = {
  from: () => ({
    insert: mockInsert,
  }),
};

const mockUser = { id: "user-123" };

describe("SpotScreen (Location)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: "ksl",
      floorId: "ksl1",
      status: "empty",
    });

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (useSupabase as jest.Mock).mockReturnValue(mockSupabase);
  });

  test("renders spot name and radius", () => {
    const { getByText } = render(<SpotScreen />);

    expect(getByText("KSL")).toBeTruthy();
    expect(getByText("Radius: 50 meters")).toBeTruthy();
  });

  test("redirects to permission screen if location denied", async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "denied",
    });

    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      {
        status: "denied",
      }
    );

    const { getByText } = render(<SpotScreen />);

    fireEvent.press(getByText("I’m here"));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/location-permission");
    });
  });

  test("fails check-in if user is too far", async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });

    (getCurrentLocation as jest.Mock).mockResolvedValue({
      coords: { latitude: 0, longitude: 0 },
    });

    (getDistanceMeters as jest.Mock).mockReturnValue(999); // too far

    const { getByText } = render(<SpotScreen />);

    fireEvent.press(getByText("I’m here"));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/submit",
        params: { verified: "false" },
      });
    });
  });

  test("inserts into Supabase and navigates on success", async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });

    (getCurrentLocation as jest.Mock).mockResolvedValue({
      coords: { latitude: 10, longitude: 20 },
    });

    (getDistanceMeters as jest.Mock).mockReturnValue(10); // within radius
    mockInsert.mockResolvedValue({ error: null });

    const { getByText } = render(<SpotScreen />);

    fireEvent.press(getByText("I’m here"));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/submit",
        params: {
          verified: "true",
          id: "ksl",
          floorId: "ksl1",
          status: "empty",
        },
      });
    });
  });

  test("handles Supabase insert error", async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });

    (getCurrentLocation as jest.Mock).mockResolvedValue({
      coords: { latitude: 10, longitude: 20 },
    });

    (getDistanceMeters as jest.Mock).mockReturnValue(10);

    mockInsert.mockResolvedValue({ error: { message: "Insert failed" } });

    const { getByText } = render(<SpotScreen />);

    fireEvent.press(getByText("I’m here"));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/submit",
        params: { verified: "false" },
      });
    });
  });
});

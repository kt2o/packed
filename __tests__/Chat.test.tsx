/**
 * Tests for the chat route UI and availability states.
 *
 * These tests validate chat screen rendering, loading behavior, and locked-state messaging.
 *
 * @module __tests__/Chat.test
 */
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import ChatScreen from "../src/app/(protected)/(tabs)/chat";

// ----------------------
// MOCK: Clerk
// ----------------------
jest.mock("@clerk/clerk-expo", () => ({
  useUser: () => ({
    user: { id: "user123", username: "TestUser" },
    isLoaded: true,
  }),
}));

// ----------------------
// MOCK: Expo Router
// ----------------------
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
}));

// ----------------------
// MOCK: Supabase
// ----------------------
jest.mock("../src/lib/supabase-client", () => {
  const buildQuery = () => {
    const qb: any = {};

    qb.select = jest.fn(() => qb);
    qb.eq = jest.fn(() => qb);
    qb.is = jest.fn(() => qb);
    qb.order = jest.fn(() => qb);
    qb.gte = jest.fn(() => qb);
    qb.limit = jest.fn(() => qb);

    qb.single = jest.fn(() => ({ data: null, error: null }));
    qb.maybeSingle = jest.fn(() => ({ data: null, error: null }));

    return qb;
  };

  return {
    useSupabase: () => ({
      from: () => buildQuery(),
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      })),
      removeChannel: jest.fn(),
    }),
  };
});

// ----------------------
// TESTS
// ----------------------
describe("ChatScreen — Option 1 (Valid UI States Only)", () => {
  test("renders loading spinner initially", () => {
    const { getByTestId } = render(<ChatScreen />);
    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  test("shows Chat Locked when no active check‑in", async () => {
    const { getByText } = render(<ChatScreen />);

    await waitFor(() => {
      expect(getByText("Chat Locked")).toBeTruthy();
      expect(getByText("You have Checked out of your location")).toBeTruthy();
    });
  });
});

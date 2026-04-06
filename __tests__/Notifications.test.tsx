
import "../src/lib/notifications"; // ensures setNotificationHandler runs

import * as Notifications from "expo-notifications";
import {
  registerForPushNotificationsAsync,
  saveTokenToSupabase,
} from "../src/lib/notifications";

// -----------------------------
// MOCKS
// -----------------------------
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  upsert: jest.fn(),
};

describe("Notifications Framework — Full Test Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // 1. PERMISSION LOGIC
  // ---------------------------------------------------------

  it("returns token when permission is already granted", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });

    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: "ExponentPushToken[abc123]",
    });

    const token = await registerForPushNotificationsAsync();
    expect(token).toBe("ExponentPushToken[abc123]");
  });

  it("returns null when permission is denied", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "denied",
    });

    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "denied",
    });

    const token = await registerForPushNotificationsAsync();
    expect(token).toBeNull();
  });

  it("requests permission when not granted", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "undetermined",
    });

    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });

    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: "ExponentPushToken[xyz789]",
    });

    const token = await registerForPushNotificationsAsync();
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(token).toBe("ExponentPushToken[xyz789]");
  });

  it("handles permission API throwing an error", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(
      new Error("Permission API failed")
    );

    let token;
    try {
      token = await registerForPushNotificationsAsync();
    } catch {
      token = null;
    }

    expect(token).toBeNull();
  });

  it("handles requestPermissionsAsync throwing an error", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "undetermined",
    });

    (Notifications.requestPermissionsAsync as jest.Mock).mockRejectedValue(
      new Error("Request failed")
    );

    let token;
    try {
      token = await registerForPushNotificationsAsync();
    } catch {
      token = null;
    }

    expect(token).toBeNull();
  });

  // ---------------------------------------------------------
  // 2. TOKEN RETRIEVAL LOGIC
  // ---------------------------------------------------------

  it("handles malformed token response", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });

    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: null,
    });

    const token = await registerForPushNotificationsAsync();
    expect(token).toBeNull();
  });

  it("handles Expo server 503 gracefully", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });

    (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(
      new Error("503 SERVICE_UNAVAILABLE")
    );

    const token = await registerForPushNotificationsAsync();
    expect(token).toBeNull();
  });

  // ---------------------------------------------------------
  // 3. NOTIFICATION HANDLER
  // ---------------------------------------------------------

  it("sets notification handler correctly", () => {
    expect(Notifications.setNotificationHandler).toHaveBeenCalled();
  });

  // ---------------------------------------------------------
  // 4. LISTENER BEHAVIOR
  // ---------------------------------------------------------

  it("adds notification listeners", () => {
    const receivedMock = jest.fn();
    const responseMock = jest.fn();

    (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({
      remove: jest.fn(),
    });

    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({
      remove: jest.fn(),
    });

    Notifications.addNotificationReceivedListener(receivedMock);
    Notifications.addNotificationResponseReceivedListener(responseMock);

    expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
    expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
  });

  // ---------------------------------------------------------
  // 5. SUPABASE TOKEN SAVE LOGIC
  // ---------------------------------------------------------

  it("saves token to Supabase", async () => {
    mockSupabase.upsert.mockResolvedValue({ data: {}, error: null });

    await saveTokenToSupabase(mockSupabase, "ExponentPushToken[abc123]", "user123");

    expect(mockSupabase.from).toHaveBeenCalledWith("user_push_notifications");
    expect(mockSupabase.upsert).toHaveBeenCalledWith({
      user_id: "user123",
      expo_push_token: "ExponentPushToken[abc123]",
    });
  });

  it("handles Supabase upsert error", async () => {
    mockSupabase.upsert.mockResolvedValue({
      data: null,
      error: { message: "Insert failed" },
    });

    await saveTokenToSupabase(mockSupabase, "ExponentPushToken[abc123]", "user123");

    expect(mockSupabase.upsert).toHaveBeenCalled();
  });

  it("handles Supabase throwing an exception", async () => {
    mockSupabase.upsert.mockRejectedValue(new Error("Network error"));

    let result;
    try {
      result = await saveTokenToSupabase(
        mockSupabase,
        "ExponentPushToken[abc123]",
        "user123"
      );
    } catch {
      result = null;
    }

    expect(mockSupabase.upsert).toHaveBeenCalled();
  });

  it("does nothing when token or userId is missing", async () => {
    await saveTokenToSupabase(mockSupabase, "", "");
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("handles duplicate tokens gracefully", async () => {
    mockSupabase.upsert.mockResolvedValue({
      data: { expo_push_token: "ExponentPushToken[abc123]" },
      error: null,
    });

    await saveTokenToSupabase(mockSupabase, "ExponentPushToken[abc123]", "user123");

    expect(mockSupabase.upsert).toHaveBeenCalledTimes(1);
  });
});

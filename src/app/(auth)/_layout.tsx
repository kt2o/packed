import { Stack } from "expo-router";

/**
 * Public auth layout for sign-in and sign-up routes.
 */
export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="sign-in" options={{ title: "Sign In" }} />
      <Stack.Screen name="sign-up" options={{ title: "Sign Up" }} />
    </Stack>
  );
}


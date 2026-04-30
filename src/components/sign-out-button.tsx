import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, Alert } from "react-native";

/**
 * Sign-out button component.
 *
 * Prompts the user for confirmation and signs out via Clerk.
 */
export const SignOutButton = () => {
  // Use `useClerk()` to access the `signOut()` function
  const { signOut } = useClerk();
  const router = useRouter();

  /**
   * Sign the current user out via Clerk.
   */
  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to your desired page
      // router.replace("/sign-in");
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  /**
   * Confirm sign-out with the user before performing the action.
   */
  const onPressSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: handleSignOut,
      },
    ]);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={onPressSignOut}
    >
      <Text style={styles.buttonText}>Sign out</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    marginTop: 30,
    alignItems: "center",
  },
  buttonPressed: { opacity: 0.5 },
  buttonText: {
    color: "#888", // Faded color
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

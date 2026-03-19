import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

export const SignOutButton = () => {
  // Use `useClerk()` to access the `signOut()` function
  const { signOut } = useClerk();
  const router = useRouter();

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

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={handleSignOut}
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

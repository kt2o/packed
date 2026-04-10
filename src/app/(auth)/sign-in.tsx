import { useSignIn } from "@clerk/clerk-expo";
import type { EmailCodeFactor } from "@clerk/types";
import { Link, useRouter } from "expo-router";
import * as React from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [showEmailCode, setShowEmailCode] = React.useState(false);

  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) return;
    try {
      const signInAttempt = await signIn.create({
        identifier: identifier,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
      } else if (signInAttempt.status === "needs_second_factor") {
        const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
          (factor): factor is EmailCodeFactor =>
            factor.strategy === "email_code"
        );
        if (emailCodeFactor) {
          await signIn.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });
          setShowEmailCode(true);
        }
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  }, [isLoaded, signIn, setActive, router, identifier, password]);

  const onVerifyPress = React.useCallback(async () => {
    if (!isLoaded) return;
    try {
      const signInAttempt = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  }, [isLoaded, signIn, setActive, router, code]);

  if (showEmailCode) {
    return (
      <SafeAreaView style={styles.mainBackground}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.brandTitle}>Packed</Text>
            <View style={styles.card}>
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.description}>
                A verification code has been sent to your email.
              </Text>
              <TextInput
                style={styles.input}
                value={code}
                placeholder="Enter verification code"
                placeholderTextColor="#A0A0A0"
                onChangeText={(code) => setCode(code)}
                keyboardType="numeric"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                ]}
                onPress={onVerifyPress}
              >
                <Text style={styles.buttonText}>Verify</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainBackground}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brandTitle}>Packed</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>

            <Text style={styles.label}>Email or Username</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={identifier}
              placeholder="Enter email or username"
              placeholderTextColor="#A0A0A0"
              onChangeText={(text) => setIdentifier(text)}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              placeholder="Enter password"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={true}
              onChangeText={(password) => setPassword(password)}
            />

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (!identifier || !password) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={onSignInPress}
              disabled={!identifier || !password}
            >
              <Text style={styles.buttonText}>Sign In</Text>
            </Pressable>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Don't have an account? </Text>
              <Link href="/sign-up">
                <Text style={styles.linkAction}>Sign Up</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainBackground: {
    flex: 1,
    backgroundColor: "#6320c7", // brand Purple
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 30,
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    color: "#666",
    lineHeight: 20,
  },
  label: {
    fontWeight: "600",
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
    marginBottom: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#6320c7",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#6320c7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    backgroundColor: "#A78BCE",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    color: "#666",
    fontSize: 14,
  },
  linkAction: {
    color: "#6320c7",
    fontWeight: "bold",
    fontSize: 14,
  },
});

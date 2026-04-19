import { useSignUp } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Page() {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const hiddenCodeInputRef = React.useRef<TextInput>(null);

  const maskedEmail = React.useMemo(() => {
    if (!emailAddress) return "your email";
    if (!emailAddress.includes("@")) return emailAddress;

    const [name, domain] = emailAddress.split("@");
    if (!name || !domain) return emailAddress;

    const visible = name.slice(0, 2);
    return `${visible}${"•".repeat(Math.max(name.length - 2, 2))}@${domain}`;
  }, [emailAddress]);

  const formatError = (err: unknown) => {
    if (
      typeof err === "object" &&
      err !== null &&
      "errors" in err &&
      Array.isArray((err as { errors?: Array<{ message?: string }> }).errors)
    ) {
      const first = (err as { errors?: Array<{ message?: string }> }).errors?.[0];
      if (first?.message) return first.message;
    }

    if (err instanceof Error && err.message) return err.message;

    return "Something went wrong. Please try again.";
  };

  const onSignUpPress = React.useCallback(async () => {
    if (!isLoaded || isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const signUpPayload: {
        emailAddress: string;
        password: string;
        username?: string;
      } = {
        emailAddress,
        password,
      };

      if (username.trim().length > 0) {
        signUpPayload.username = username.trim();
      }

      await signUp.create(signUpPayload);
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      setErrorMessage(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [emailAddress, isLoaded, isSubmitting, password, signUp, username]);

  const onVerifyPress = React.useCallback(async () => {
    if (!isLoaded || isSubmitting) return;

    if (code.length !== 6) {
      setErrorMessage("Enter the 6-digit verification code.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
      } else {
        setErrorMessage("That code didn’t work. Please try again.");
      }
    } catch (err) {
      setErrorMessage(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [code, isLoaded, isSubmitting, setActive, signUp]);

  const onCodeChange = React.useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 6);
    setCode(cleaned);
  }, []);

  const renderCodeBoxes = () => {
    return (
      <Pressable
        onPress={() => hiddenCodeInputRef.current?.focus()}
        style={styles.codeRow}
      >
        {Array.from({ length: 6 }).map((_, index) => {
          const digit = code[index] ?? "";
          const isActive = index === code.length && code.length < 6;

          return (
            <View
              key={index}
              style={[
                styles.codeBox,
                digit ? styles.codeBoxFilled : null,
                isActive ? styles.codeBoxActive : null,
              ]}
            >
              <Text style={styles.codeDigit}>{digit}</Text>
            </View>
          );
        })}
      </Pressable>
    );
  };

  if (pendingVerification) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.backgroundOrbTop} />
            <View style={styles.backgroundOrbBottom} />

            <View style={styles.authShell}>
              <View style={styles.brandPill}>
                <Text style={styles.brandPillText}>Packed</Text>
              </View>

              <Text style={styles.heading}>Check your email</Text>
              <Text style={styles.subheading}>
                Enter the 6-digit code we sent to {maskedEmail}.
              </Text>

              <View style={styles.card}>
                <TextInput
                  ref={hiddenCodeInputRef}
                  value={code}
                  onChangeText={onCodeChange}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  style={styles.hiddenInput}
                  maxLength={6}
                />

                {renderCodeBoxes()}

                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : (
                  <Text style={styles.helperText}>
                    This extra step helps protect your new account.
                  </Text>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    (pressed || isSubmitting || code.length !== 6) &&
                    styles.primaryButtonPressed,
                    (isSubmitting || code.length !== 6) &&
                    styles.primaryButtonDisabled,
                  ]}
                  onPress={onVerifyPress}
                  disabled={isSubmitting || code.length !== 6}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSubmitting ? "Verifying..." : "Verify code"}
                  </Text>
                </Pressable>

                <Pressable onPress={() => setPendingVerification(false)}>
                  <Text style={styles.secondaryAction}>Back to sign up</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.backgroundOrbTop} />
          <View style={styles.backgroundOrbBottom} />

          <View style={styles.authShell}>
            <View style={styles.brandPill}>
              <Text style={styles.brandPillText}>Packed</Text>
            </View>

            <Text style={styles.heading}>Create Account</Text>
            <Text style={styles.subheading}>
              Sign Up To Get Started With Packed.
            </Text>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email address</Text>
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={emailAddress}
                  placeholder="Enter email address"
                  placeholderTextColor="#8E8AA8"
                  onChangeText={setEmailAddress}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username (optional)</Text>
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  placeholder="Choose a username"
                  placeholderTextColor="#8E8AA8"
                  onChangeText={setUsername}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    placeholder="Create a password"
                    placeholderTextColor="#8E8AA8"
                    secureTextEntry={!showPassword}
                    onChangeText={setPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.passwordToggle}
                  >
                    <Text style={styles.passwordToggleText}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : (
                <Text style={styles.helperText}>
                  Use your email to create a secure Packed account.
                </Text>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pressed || isSubmitting) && styles.primaryButtonPressed,
                  (!emailAddress || !password || isSubmitting) &&
                  styles.primaryButtonDisabled,
                ]}
                onPress={onSignUpPress}
                disabled={!emailAddress || !password || isSubmitting}
              >
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? "Creating account..." : "Continue"}
                </Text>
              </Pressable>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/sign-in" asChild>
                  <Pressable>
                    <Text style={styles.footerLink}>Sign in</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#EEE8FA",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  authShell: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    position: "relative",
    zIndex: 2,
  },
  backgroundOrbTop: {
    position: "absolute",
    top: 80,
    left: 10,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(139, 92, 246, 0.18)",
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: 100,
    right: 0,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(236, 72, 153, 0.10)",
  },
  brandPill: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#F7F2FF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    marginBottom: 20,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  brandPillText: {
    color: "#6D28D9",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  heading: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: "#1F1637",
    textAlign: "center",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6E6890",
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#2E1065",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#413A5F",
    marginBottom: 8,
  },
  input: {
    height: 58,
    borderRadius: 18,
    backgroundColor: "#F6F2FD",
    borderWidth: 1,
    borderColor: "#E6DDF8",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#19142B",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 2,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 58,
    borderRadius: 18,
    backgroundColor: "#F6F2FD",
    borderWidth: 1,
    borderColor: "#E6DDF8",
    paddingLeft: 16,
    paddingRight: 12,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: "#19142B",
  },
  passwordToggle: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  passwordToggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6D28D9",
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6E6890",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#D92D20",
    marginBottom: 16,
    textAlign: "center",
  },
  primaryButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  primaryButtonPressed: {
    opacity: 0.95,
    transform: [{ translateY: 2 }, { scale: 0.985 }],
  },
  primaryButtonDisabled: {
    backgroundColor: "#C4B5FD",
    shadowOpacity: 0.1,
    elevation: 2,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  footerText: {
    fontSize: 14,
    color: "#6E6890",
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6D28D9",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  codeBox: {
    width: 46,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E4DAF8",
    backgroundColor: "#F8F4FE",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 2,
  },
  codeBoxFilled: {
    backgroundColor: "#F1EAFE",
    borderColor: "#BFA7F8",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  codeBoxActive: {
    borderColor: "#7C3AED",
  },
  codeDigit: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F1637",
  },
  secondaryAction: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#6D28D9",
  },
});
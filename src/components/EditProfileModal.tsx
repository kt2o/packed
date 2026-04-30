import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type EditProfileModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onSave: (newUsername: string, newImageUri: string | null) => Promise<void>;
  initialUsername?: string | null;
  initialImageUri?: string;
  isSaving: boolean;
};

/**
 * Modal dialog for editing a user's profile details.
 *
 * Supports changing username and selecting a new profile image.
 */
export const EditProfileModal = ({
  isVisible,
  onClose,
  onSave,
  initialUsername,
  initialImageUri,
  isSaving,
}: EditProfileModalProps) => {
  const [username, setUsername] = useState(initialUsername || "");
  const [imageUri, setImageUri] = useState(initialImageUri || null);

  const [showModal, setShowModal] = useState(isVisible);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // sliding feature
  useEffect(() => {
    if (isVisible) {
      setShowModal(true);
      setUsername(initialUsername || "");
      setImageUri(initialImageUri || null);

      //slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // slide down
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShowModal(false);
      });
    }
  }, [isVisible, initialUsername, initialImageUri]);

  /**
   * Open the media library for the user to pick a new profile image.
   */
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("We need camera roll permissions to make this work");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  /**
   * Validate the entered profile details and invoke the save callback.
   */
  const handleSave = async () => {
    if (username.trim().length < 2) {
      Alert.alert("Error", "Username must be at least 2 characters long.");
      return;
    }
    await onSave(username, imageUri);
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={showModal}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* Animated wrapper for the white card */}
          <Animated.View
            style={[
              styles.modalView,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
              <Image
                source={{
                  uri:
                    imageUri ||
                    "https://avatar.iran.liara.run/username?username=[firstname+lastname]",
                }}
                style={styles.avatar}
              />
              <View style={styles.editIconBadge}>
                <Ionicons name="pencil" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  autoCapitalize="none"
                />
                <Ionicons
                  name="pencil"
                  size={18}
                  color="#999"
                  style={styles.inputIcon}
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Instantly applies dark background
    justifyContent: "flex-end",
  },
  keyboardView: {
    width: "100%",
  },
  modalView: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0F0F0",
  },
  editIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6F2DBD",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  inputIcon: {
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
  },
  saveButton: {
    backgroundColor: "#6F2DBD",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
});

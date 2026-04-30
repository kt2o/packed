import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { RewardSystem } from "src/components/RewardSystem";
import { SignOutButton } from "src/components/sign-out-button";
import { EditProfileModal } from "src/components/EditProfileModal";
import { useSupabase } from "../../../lib/supabase-client";

/**
 * Profile screen for displaying user information and rewards.
 *
 * Handles reward loading, profile editing, and sign-out.
 */
export default function ProfileScreen() {
  const { user, isLoaded } = useUser();
  const supabase = useSupabase();
  const userId = user?.id;
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Open the edit profile modal.
   */
  const handleOpenEditModal = () => setIsEditModalVisible(true);
  /**
   * Close the edit profile modal.
   */
  const handleCloseEditModal = () => setIsEditModalVisible(false);

  const [rewards, setRewards] = useState({
    points: 0,
    nextRewardAt: 100,
    label: "Contributor Points",
  });

  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [rewardsError, setRewardsError] = useState<string | null>(null);

  /**
   * Load the current user's reward progress from Supabase.
   */
  const loadRewards = async () => {
    if (!isLoaded || !userId) return;

    try {
      setRewardsLoading(true);
      setRewardsError(null);

      const { data, error } = await supabase
        .from("user_rewards")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(); // safer than .single()

      if (error) throw error;

      if (data) {
        setRewards({
          points: data.points,
          nextRewardAt: data.next_reward_at,
          label: data.label,
        });
      }
    } catch (e) {
      console.error("Error loading rewards:", e);
      setRewardsError("Couldn't load rewards");
    } finally {
      setRewardsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && userId) {
      loadRewards();
    }
  }, [isLoaded, userId]);

  /**
   * Persist profile changes such as username and profile image.
   */
  const handleSaveProfile = async (
    newUsername: string,
    newImageUri: string | null
  ) => {
    if (!user) return;

    try {
      setIsSaving(true);

      if (newUsername !== user.username) {
        await user.update({
          username: newUsername
        });
      }

      if (newImageUri && newImageUri !== user.imageUrl) {
        console.log("Image URI selected:", newImageUri);
      }

      Alert.alert("Success", "Profile updated successfully!");
      handleCloseEditModal();

    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Update Failed", error?.errors ? error.errors[0].message : "An unexpected error occurred."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const displayEmail = user?.primaryEmailAddress?.emailAddress || "";
  const emailPrefix = displayEmail ? displayEmail.split("@")[0] : "Nameless";
  const displayName = user?.username || user?.fullName || emailPrefix;

  const profileImage =
    user?.imageUrl ||
    "https://avatar.iran.liara.run/username?username=[firstname+lastname]";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerSection}>
          <Image source={{ uri: profileImage }} style={styles.avatar} />
          <Text style={styles.username}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleOpenEditModal}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <RewardSystem
          points={rewards.points}
          nextRewardAt={rewards.nextRewardAt}
          label={rewards.label}
          loading={rewardsLoading}
          error={rewardsError}
        />

        <View style={styles.footerSection}>
          <SignOutButton />
        </View>

        <EditProfileModal
          isVisible={isEditModalVisible}
          onClose={handleCloseEditModal}
          onSave={handleSaveProfile}
          initialUsername={displayName}
          initialImageUri={profileImage}
          isSaving={isSaving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7FB" },
  container: { flexGrow: 1, paddingBottom: 30 },
  headerSection: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#FFFFFF",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: "#E1E1E1",
  },
  username: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#888",
  },
  editProfileButton: {
    marginTop: 16,
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#F6F2FB",
    borderWidth: 1,
    borderColor: "#6320c7",
  },
  editProfileButtonText: {
    color: "#6320c7",
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    width: "100%",
  },
  footerSection: {
    marginTop: "auto",
    paddingBottom: 20,
  },
});

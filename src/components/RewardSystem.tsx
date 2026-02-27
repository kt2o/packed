import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type RewardSystemProps = {
  points: number;
  nextRewardAt: number;
  label: string;
  loading: boolean;
  error: string | null;
};

export const RewardSystem = ({
  points,
  nextRewardAt,
  label,
  loading,
  error,
}: RewardSystemProps) => {
  const [showRewardsDetails, setShowRewardsDetails] = useState(false);

  const safeGoal = nextRewardAt > 0 ? nextRewardAt : 1;
  const progress = Math.min(points / safeGoal, 1);
  const remaining = Math.max(nextRewardAt - points, 0);

  const rewardsMessage =
    points >= nextRewardAt
      ? "Claim your reward!"
      : `${remaining} more until your next reward!`;

  const tickPercents = [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9];

  return (
    <View style={styles.rewardsSection}>
      <Text style={styles.rewardsTitle}>Rewards</Text>

      {loading ? (
        <Text style={styles.rewardsStatusText}>Loading rewards...</Text>
      ) : error ? (
        <Text style={styles.rewardsStatusText}>{error}</Text>
      ) : (
        <>
          <View style={styles.rewardsSummaryRow}>
            <View>
              <Text style={styles.rewardsFraction}>
                {points}/{nextRewardAt}
              </Text>
              <Text style={styles.rewardsLabel}>{label}</Text>
            </View>
            <Text style={styles.rewardsMessage}>{rewardsMessage}</Text>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.trackWrap}>
              <View style={styles.trackBase} />
              <View
                style={[styles.trackFill, { width: `${progress * 100}%` }]}
              />
              {tickPercents.map((p) => (
                <View
                  key={p}
                  style={[styles.tickOnTrack, { left: `${p * 100}%` }]}
                >
                  <View style={styles.tickLineOnTrack} />
                </View>
              ))}
              <View style={[styles.thumb, { left: `${progress * 100}%` }]} />
            </View>

            <TouchableOpacity
              style={styles.starButton}
              onPress={() => setShowRewardsDetails((prev) => !prev)}
            >
              <Ionicons name="star" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {showRewardsDetails && (
            <View style={styles.rewardsDetailsCard}>
              <Text style={styles.rewardsDetailsTitle}>
                How to earn points
              </Text>
              <Text style={styles.rewardsDetailsText}>
                • Submit a verified spot status
              </Text>
              <Text style={styles.rewardsDetailsText}>
                • Earn points after confirmation
              </Text>
              <View style={styles.rewardsDetailsDivider} />
              <Text style={styles.rewardsDetailsText}>
                Current: {points} points
              </Text>
              <Text style={styles.rewardsDetailsText}>
                Next reward at: {nextRewardAt} points
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rewardsSection: { paddingHorizontal: 25, paddingTop: 20 },
  rewardsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  rewardsStatusText: { paddingTop: 10, fontSize: 14, color: "#000" },
  rewardsSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  rewardsFraction: { fontSize: 34, fontWeight: "bold", color: "#000" },
  rewardsLabel: { fontSize: 14, color: "#000", marginTop: 4 },
  rewardsMessage: {
    fontSize: 14,
    color: "#000",
    textAlign: "right",
    marginTop: 10,
    flexShrink: 1,
    maxWidth: "55%",
  },
  progressRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  trackWrap: {
    flex: 1,
    height: 28,
    justifyContent: "center",
    position: "relative",
  },
  trackBase: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E6E6E6",
    width: "100%",
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -2 }],
  },
  trackFill: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "#6F2DBD",
    position: "absolute",
    left: 0,
    top: "50%",
    transform: [{ translateY: -2 }],
  },
  tickOnTrack: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -8 }, { translateX: -1 }],
  },
  tickLineOnTrack: {
    width: 2,
    height: 16,
    backgroundColor: "#111111",
    borderRadius: 2,
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#6F2DBD",
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -14 }, { translateX: -14 }],
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  starButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  rewardsDetailsCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F6F2FB",
  },
  rewardsDetailsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  rewardsDetailsText: { fontSize: 13, color: "#000", marginBottom: 4 },
  rewardsDetailsDivider: {
    height: 1,
    backgroundColor: "#E0D4F5",
    marginVertical: 10,
  },
});
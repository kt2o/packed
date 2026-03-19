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

  const badgeCount = Math.floor(points / 100);
  const currentBandStart = badgeCount * 100;
  const nextMilestone = currentBandStart + 100;

  const bandPoints = points - currentBandStart;
  const progress = Math.min(Math.max(bandPoints / 100, 0), 1);
  const remaining = Math.max(nextMilestone - points, 0);

  const rewardsMessage =
    remaining === 0
      ? "New badge earned!"
      : `${remaining} more until your next badge!`;

  const earnedBadgeCount = Math.floor(points / 100);

  const badgeData = [
    {
      name: "Bronze Badge",
      icon: "medal-outline",
      color: "#A97142",
      backgroundColor: "#F4E7DC",
    },
    {
      name: "Silver Badge",
      icon: "ribbon-outline",
      color: "#8E9AAF",
      backgroundColor: "#ECEFF4",
    },
    {
      name: "Gold Badge",
      icon: "trophy-outline",
      color: "#D4A017",
      backgroundColor: "#FFF6DB",
    },
    {
      name: "Platinum Badge",
      icon: "diamond-outline",
      color: "#5C6BC0",
      backgroundColor: "#E8EAF6",
    },
    {
      name: "Legend Badge",
      icon: "star-outline",
      color: "#6F2DBD",
      backgroundColor: "#F3E8FF",
    },
  ];

  const earnedBadges = badgeData.slice(
    0,
    Math.min(earnedBadgeCount, badgeData.length)
  );

  const nextBadge =
    earnedBadgeCount < badgeData.length ? badgeData[earnedBadgeCount] : null;

  const tickPercents = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

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
                {points}/{nextMilestone}
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
                Next badge at: {nextMilestone} points
              </Text>
            </View>
          )}

          <View style={styles.badgesSection}>
            <Text style={styles.badgesTitle}>Badges</Text>

            {earnedBadges.length === 0 ? (
              <Text style={styles.noBadgesText}>
                Earn 100 points to unlock your first badge.
              </Text>
            ) : (
              <View style={styles.badgesRow}>
                {earnedBadges.map((badge) => (
                  <View
                    key={badge.name}
                    style={[styles.badgeCard, { backgroundColor: badge.backgroundColor }]}
                  >
                    <Ionicons
                      name={badge.icon as any}
                      size={24}
                      color={badge.color}
                    />
                    <Text style={styles.badgeName}>{badge.name}</Text>
                  </View>
                ))}
              </View>
            )}
            {nextBadge && (
              <View style={styles.nextBadgeCard}>
                <Text style={styles.nextBadgeTitle}>Next Badge</Text>

                <View style={styles.nextBadgeRow}>
                  <Ionicons
                    name={nextBadge.icon as any}
                    size={22}
                    color={nextBadge.color}
                  />
                  <Text style={styles.nextBadgeName}>{nextBadge.name}</Text>
                </View>

                <Text style={styles.nextBadgeText}>
                  {remaining} more points to unlock this badge.
                </Text>
              </View>
            )}
          </View>
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
  badgesSection: {
    marginTop: 18,
  },
  badgesTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  noBadgesText: {
    fontSize: 14,
    color: "#555",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeCard: {
    width: 110,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#F6F2FB",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  nextBadgeCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  nextBadgeTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  nextBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  nextBadgeName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  nextBadgeText: {
    fontSize: 13,
    color: "#555",
  },
});
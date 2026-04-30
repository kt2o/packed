/**
 * Tests for the reward progress UI and badge rendering behavior.
 *
 * @module __tests__/RewardSystem.test
 */
import { render, fireEvent } from "@testing-library/react-native";
import { RewardSystem } from "../src/components/RewardSystem";

jest.mock("@expo/vector-icons", () => {
    const React = require("react");
    const { Text } = require("react-native");

    return {
        Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
    };
});

describe("RewardSystem", () => {
    const baseProps = {
        points: 0,
        nextRewardAt: 100,
        label: "Community Points",
        loading: false,
        error: null as string | null,
    };

    describe("4.10 Receive Reward", () => {

        // RRTC-1: Display accumulated reward points in UI
        it("displays accumulated rewards in the profile UI", () => {
            const { getByText } = render(
                <RewardSystem {...baseProps} points={45} label="Weekly Progress" />
            );

            expect(getByText("Rewards")).toBeTruthy();
            expect(getByText("45/100")).toBeTruthy();
            expect(getByText("Weekly Progress")).toBeTruthy();
            expect(getByText("55 more until your next badge!")).toBeTruthy();
        });

        // RRTC-2: Show loading state while rewards are being fetched
        it("shows loading state while rewards are being fetched", () => {
            const { getByText, queryByText } = render(
                <RewardSystem {...baseProps} loading={true} />
            );

            expect(getByText("Loading rewards...")).toBeTruthy();
            expect(queryByText("Badges")).toBeNull();
        });

        // RRTC-3: Show error state when reward retrieval fails
        it("shows error state when reward data cannot be displayed", () => {
            const { getByText, queryByText } = render(
                <RewardSystem {...baseProps} error="Failed to load rewards." />
            );

            expect(getByText("Failed to load rewards.")).toBeTruthy();
            expect(queryByText("Badges")).toBeNull();
        });

        // RRTC-4: User can view reward details via toggle button
        it("shows reward details after the user presses the star button", () => {
            const { getByRole, getByText, queryByText } = render(
                <RewardSystem {...baseProps} points={65} />
            );

            expect(queryByText("How to earn points")).toBeNull();

            fireEvent.press(getByRole("button"));

            expect(getByText("How to earn points")).toBeTruthy();
            expect(getByText("• Submit a verified spot status")).toBeTruthy();
            expect(getByText("• Earn points after confirmation")).toBeTruthy();
            expect(getByText("Current: 65 points")).toBeTruthy();
            expect(getByText("Next badge at: 100 points")).toBeTruthy();
        });

        // RRTC-5: User can hide reward details by toggling again
        it("hides reward details when the star button is pressed twice", () => {
            const { getByRole, queryByText } = render(
                <RewardSystem {...baseProps} points={65} />
            );

            const button = getByRole("button");

            fireEvent.press(button);
            expect(queryByText("How to earn points")).toBeTruthy();

            fireEvent.press(button);
            expect(queryByText("How to earn points")).toBeNull();
        });
    });

    describe("4.11 Receive Badge", () => {

        // RBTC-1: No badge is earned below threshold
        it("shows no earned badge when points are below the first threshold", () => {
            const { getByText } = render(
                <RewardSystem {...baseProps} points={80} />
            );

            expect(
                getByText("Earn 100 points to unlock your first badge.")
            ).toBeTruthy();
            expect(getByText("Next Badge")).toBeTruthy();
            expect(getByText("Bronze Badge")).toBeTruthy();
            expect(getByText("20 more points to unlock this badge.")).toBeTruthy();
        });

        // RBTC-2: First badge is awarded at 100 points
        it("displays the first earned badge at 100 points", () => {
            const { getByText } = render(
                <RewardSystem {...baseProps} points={100} />
            );

            expect(getByText("100/200")).toBeTruthy();
            expect(getByText("Bronze Badge")).toBeTruthy();
            expect(getByText("Next Badge")).toBeTruthy();
            expect(getByText("Silver Badge")).toBeTruthy();
            expect(getByText("100 more points to unlock this badge.")).toBeTruthy();
        });

        // RBTC-3: Multiple badges are awarded at higher thresholds
        it("displays multiple earned badges when multiple thresholds are met", () => {
            const { getByText } = render(
                <RewardSystem {...baseProps} points={250} />
            );

            expect(getByText("Bronze Badge")).toBeTruthy();
            expect(getByText("Silver Badge")).toBeTruthy();
            expect(getByText("Gold Badge")).toBeTruthy();
            expect(getByText("50 more points to unlock this badge.")).toBeTruthy();
        });

        // RBTC-4: Badge list is capped at maximum defined badges
        it("caps badge rendering at the available badge list", () => {
            const { getByText, queryByText } = render(
                <RewardSystem {...baseProps} points={700} />
            );

            expect(getByText("Bronze Badge")).toBeTruthy();
            expect(getByText("Silver Badge")).toBeTruthy();
            expect(getByText("Gold Badge")).toBeTruthy();
            expect(getByText("Platinum Badge")).toBeTruthy();
            expect(getByText("Legend Badge")).toBeTruthy();
            expect(queryByText("Next Badge")).toBeNull();
        });
    });
});
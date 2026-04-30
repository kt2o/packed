
/**
 * Shared type definitions used for status labels and header props.
 */
import { ReactNode } from "react";
import { ViewStyle } from "react-native";

export type Status = "empty" | "moderate" | "packed" | "full"| "unknown";

// other types used for header
export type HeaderProps = {
  title?: string;
  style?: ViewStyle;
  leftIcon?: ReactNode;
};


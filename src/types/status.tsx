import { ReactNode } from "react";
import { ViewStyle } from "react-native";

export type Status = "empty" | "normal" | "packed" | "unknown";

// other types used for header
export type HeaderProps = {
  title?: string;
  style?: ViewStyle;
  leftIcon?: ReactNode;
};

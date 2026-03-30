// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  // Chat
  "message.fill": "chat",
  "bubble.left.fill": "chat-bubble",
  "bubble.right.fill": "chat-bubble-outline",
  // Calendar / Appointments
  "calendar": "calendar-today",
  "calendar.badge.plus": "event",
  "clock.fill": "access-time",
  "clock": "schedule",
  // Medical
  "heart.fill": "favorite",
  "cross.fill": "add",
  "stethoscope": "medical-services",
  "pills.fill": "medication",
  // Person
  "person.fill": "person",
  "person.2.fill": "people",
  "person.badge.plus": "person-add",
  "person.circle.fill": "account-circle",
  // Admin / Settings
  "gear": "settings",
  "chart.bar.fill": "bar-chart",
  "list.bullet": "list",
  "square.grid.2x2.fill": "dashboard",
  "building.2.fill": "business",
  // Actions
  "checkmark.circle.fill": "check-circle",
  "checkmark": "check",
  "exclamationmark.circle.fill": "error",
  "info.circle.fill": "info",
  "bell.fill": "notifications",
  "phone.fill": "phone",
  "envelope.fill": "email",
  "location.fill": "location-on",
  "star.fill": "star",
  "trash.fill": "delete",
  "pencil": "edit",
  "magnifyingglass": "search",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "arrow.clockwise": "refresh",
  "plus": "add",
  "minus": "remove",
  "doc.text.fill": "description",
  "creditcard.fill": "credit-card",
  "lock.fill": "lock",
  "hand.raised.fill": "pan-tool",
  "wifi": "wifi",
  "headphones": "headset",
  "questionmark.circle.fill": "help",
  "car.fill": "directions-car",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "waveform.path.ecg": "show-chart",
  "bolt.heart.fill": "favorite",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

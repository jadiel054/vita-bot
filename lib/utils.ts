import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Alert, Platform } from "react-native";

/**
 * Combines class names using clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AlertButtonOption {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

/**
 * Universal showAlert compatible with Web (window.alert / window.confirm) and Native (Alert.alert).
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButtonOption[]
) {
  if (Platform.OS === "web") {
    const fullText = message ? `${title}\n\n${message}` : title;
    if (buttons && buttons.length > 1) {
      const cancelBtn = buttons.find((b) => b.style === "cancel");
      const confirmBtn = buttons.find((b) => b.style !== "cancel") || buttons[0];

      if (typeof window !== "undefined" && window.confirm) {
        const confirmed = window.confirm(fullText);
        if (confirmed) {
          confirmBtn?.onPress?.();
        } else {
          cancelBtn?.onPress?.();
        }
      } else {
        confirmBtn?.onPress?.();
      }
    } else {
      if (typeof window !== "undefined" && window.alert) {
        window.alert(fullText);
      }
      if (buttons && buttons.length > 0 && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}

/**
 * Sanitizes generic input text by stripping dangerous HTML tags and script injection.
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .trim();
}

/**
 * Sanitizes full name string.
 */
export function sanitizeName(name: string): string {
  if (!name) return "";
  const cleaned = sanitizeInput(name);
  return cleaned.replace(/[^\p{L}\s.']/gu, "").replace(/\s+/g, " ");
}

/**
 * Sanitizes CPF string.
 */
export function sanitizeCPF(cpf: string): string {
  if (!cpf) return "";
  return cpf.replace(/\D/g, "").slice(0, 11);
}

/**
 * Sanitizes phone number string.
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "").slice(0, 11);
}

/**
 * Sanitizes email string.
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";
  return sanitizeInput(email).toLowerCase().replace(/\s/g, "");
}

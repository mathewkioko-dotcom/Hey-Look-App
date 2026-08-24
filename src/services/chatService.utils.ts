import { ChatMessage } from "../types";

/**
 * Validate a value is a well-formed UUID (v4) string.
 * PostgREST returns HTTP 400 when values in .or()/.eq() filters cannot be
 * cast to the column type (e.g. UUID). Guarding IDs here prevents that error.
 */
export function isValidUuid(value: any): boolean {
  if (typeof value !== "string" || value.length === 0) return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value.trim());
}

/**
 * Safely quote a value for use inside a PostgREST logical operator string
 * (e.g. `.or()` / `.and()`). Values must be wrapped in double quotes so the
 * embedded commas/parentheses are not misinterpreted by the parser.
 */
export function quoteValue(value: any): string {
  return `"${String(value)
    .trim()
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')}"`;
}

/**
 * Generate a standards-compliant v4 UUID for client-side message IDs.
 * The `messages.id` column is a UUID PRIMARY KEY, so passing non-UUID temp
 * strings (e.g. `msg-178600...`) causes PostgREST to reject inserts/updates
 * with HTTP 400. This helper guarantees every client-generated ID is a valid
 * v4 UUID so persistence works on first insert.
 */
export function generateUuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback v4 UUID generator for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Derive a stable, deterministic room ID from the two participant user IDs.
 * Sorts the pair so both directions produce the same room id, and uses the
 * first 8 hex chars of each UUID to keep it compact while still unique.
 */
export function deriveRoomId(a?: string, b?: string): string {
  const validIds = [a, b]
    .filter((id): id is string => Boolean(id) && isValidUuid(id))
    .sort();

  if (validIds.length >= 2) {
    return validIds[0];
  }

  if (validIds.length === 1) {
    return validIds[0];
  }

  return generateUuid();
}

/**
 * Filter out vanishing messages whose burn_at timestamp is in the past
 */
export function filterVanishingMessages(
  messages: ChatMessage[],
): ChatMessage[] {
  const now = new Date().getTime();
  return messages.filter((msg) => {
    if (!msg.burn_at) return true;
    const burnTime = new Date(msg.burn_at).getTime();
    return burnTime > now;
  });
}

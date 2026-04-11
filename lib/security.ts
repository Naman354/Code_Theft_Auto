/**
 * Sanitize user input to prevent NoSQL injection and XSS.
 * This ensures that input is treated as a literal string and removes potentially dangerous characters.
 */
export function sanitizeInput(input: unknown): string {
  if (input === null || input === undefined) return "";

  // 1. Force to string to prevent object-based NoSQL injections
  let sanitized = String(input);

  // 2. STRICT ALPHANUMERIC: Remove everything except A-Z, a-z, 0-9
  // This satisfies the user's request for "no special characters"
  sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, "");

  // 4. Basic XSS prevention: Strip HTML tags
  sanitized = sanitized.replace(/<[^>]*>?/gm, "");

  // 5. Limit length to prevent buffer/memory attacks (adjust based on your contest needs)
  const MAX_LENGTH = 1000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
}

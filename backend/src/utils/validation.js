/**
 * Validate password meets minimum complexity requirements.
 * Returns null if valid, or an error message string if invalid.
 */
export function validatePassword(password) {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}

/**
 * Validate that a string is a positive integer (for URL params like :id).
 */
export function isValidId(value) {
  return /^\d+$/.test(value);
}

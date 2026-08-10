/**
 * Username helpers for signup, display, and availability checks.
 * All DB lookups use Supabase .eq() with sanitized values only — never template-literal SQL.
 * Client username-check throttle lives in authSecurity.js; Supabase anon quotas still apply.
 */

/**
 * Strip disallowed characters and normalize for storage or comparison (max 20 chars, lowercase).
 */
export function sanitizeUsernameForStorage(raw) {
  if (raw == null || typeof raw !== "string") return "";
  return raw.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase().slice(0, 20);
}

/**
 * Build a login handle from the email local part when the user skips choosing a username.
 */
export function deriveUsernameFromEmail(email) {
  if (!email || typeof email !== "string") return "user";
  const local = email.split("@")[0] || "";
  let base = sanitizeUsernameForStorage(local);
  if (base.length < 3) {
    base = `${base}usr`.slice(0, 20);
  }
  return base || "user";
}

/**
 * Prefer stored username, then email prefix — use wherever a person’s label is shown.
 */
export function profileDisplayName(profile, fallback = "User") {
  if (!profile) return fallback;
  return profile.username || profile.email?.split("@")[0] || fallback;
}

/**
 * Returns true if the string is a valid optional signup username (3–20, allowed charset only).
 */
export function isValidSignupUsernameFormat(value) {
  if (!value || typeof value !== "string") return true;
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length < 3 || trimmed.length > 20) return false;
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

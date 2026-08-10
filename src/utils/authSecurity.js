/**
 * Auth UX helpers — generic errors, password policy, username-check throttle.
 * DB access stays on the Supabase client (parameterized); never build raw SQL.
 */

export const MIN_PASSWORD_LENGTH = 8;

/** Minimum ms between username availability requests (client-side abuse brake). */
export const USERNAME_CHECK_MIN_INTERVAL_MS = 700;

export function isPasswordLongEnough(password) {
  return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
}

/**
 * Map Supabase/auth errors to non-leaky copy for the UI.
 * Full error stays in the console for debugging.
 */
export function friendlyAuthError(err, fallback = "Something went wrong. Please try again.") {
  const raw = (err && (err.message || err.error_description || String(err))) || "";
  const msg = raw.toLowerCase();

  if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
    return "Email or password is incorrect.";
  }
  if (
    msg.includes("email not confirmed") ||
    msg.includes("user already registered") ||
    msg.includes("already been registered")
  ) {
    // Avoid confirming whether an email is registered.
    return "If an account exists for this email, check your inbox or try signing in.";
  }
  if (msg.includes("password") && (msg.includes("weak") || msg.includes("least") || msg.includes("short"))) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (msg.includes("rate") || msg.includes("too many") || msg.includes("over_request")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }

  return fallback;
}

/**
 * Simple in-memory throttle for username checks in a single page session.
 */
export function createRequestThrottle(minIntervalMs = USERNAME_CHECK_MIN_INTERVAL_MS) {
  let lastAt = 0;
  return {
    /** @returns {{ ok: true } | { ok: false, waitMs: number }} */
    tryAcquire() {
      const now = Date.now();
      const elapsed = now - lastAt;
      if (elapsed < minIntervalMs) {
        return { ok: false, waitMs: minIntervalMs - elapsed };
      }
      lastAt = now;
      return { ok: true };
    },
  };
}

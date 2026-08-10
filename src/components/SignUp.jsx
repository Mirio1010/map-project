import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import {
  deriveUsernameFromEmail,
  sanitizeUsernameForStorage,
  isValidSignupUsernameFormat,
} from "../utils/usernameUtils";
import {
  createRequestThrottle,
  friendlyAuthError,
  isPasswordLongEnough,
  MIN_PASSWORD_LENGTH,
} from "../utils/authSecurity";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  /** 'idle' | 'available' | 'taken' | 'throttled' */
  const [usernameAvailability, setUsernameAvailability] = useState("idle");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const navigate = useNavigate();
  const usernameThrottle = useMemo(() => createRequestThrottle(), []);

  /**
   * Sanitize before any DB call; query uses parameterized .eq() only.
   * Client throttle reduces anonymous hammering of profiles SELECT.
   */
  const handleCheckUsernameAvailability = async () => {
    setUsernameAvailability("idle");
    const sanitized = sanitizeUsernameForStorage(usernameInput.trim());
    if (sanitized.length < 3) {
      setUsernameAvailability("idle");
      return;
    }

    const gate = usernameThrottle.tryAcquire();
    if (!gate.ok) {
      setUsernameAvailability("throttled");
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error: qError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", sanitized)
        .maybeSingle();

      if (qError) {
        console.error("Username check failed:", qError.message);
        setUsernameAvailability("idle");
        return;
      }
      setUsernameAvailability(data ? "taken" : "available");
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const trimmedUsername = usernameInput.trim();
      if (trimmedUsername && !isValidSignupUsernameFormat(trimmedUsername)) {
        setError(
          "Username must be 3–20 characters and use only letters, numbers, underscores, or hyphens."
        );
        setLoading(false);
        return;
      }

      if (!isPasswordLongEnough(password)) {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        setLoading(false);
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: signErr } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });
      if (signErr) throw signErr;

      if (data.user) {
        const chosenOrDerived = trimmedUsername
          ? sanitizeUsernameForStorage(trimmedUsername)
          : deriveUsernameFromEmail(normalizedEmail);

        const safeUsername = sanitizeUsernameForStorage(chosenOrDerived).slice(0, 20);
        const finalUsername =
          safeUsername.length >= 3
            ? safeUsername
            : deriveUsernameFromEmail(normalizedEmail);

        // Re-check handle before insert to reduce TOCTOU races (unique index is still required).
        if (trimmedUsername) {
          const { data: existing, error: availErr } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", finalUsername)
            .maybeSingle();
          if (availErr) {
            console.error("Username re-check failed:", availErr.message);
            setError("Could not verify username. Please try again.");
            setLoading(false);
            return;
          }
          if (existing) {
            setError("That username was just taken. Choose another and try again.");
            setUsernameAvailability("taken");
            setLoading(false);
            return;
          }
        }

        const { error: profileErr } = await supabase.from("profiles").insert({
          id: data.user.id,
          username: finalUsername,
          email: normalizedEmail,
        });
        if (profileErr) {
          console.error("Profile insert failed:", profileErr.message);
          const code = profileErr.code || "";
          if (code === "23505") {
            setError("That username is unavailable. Choose another and try again.");
            setUsernameAvailability("taken");
          } else {
            setError(
              "Account created, but profile setup failed. Sign in and finish your username on Profile."
            );
          }
          setLoading(false);
          return;
        }
      }

      navigate("/app");
    } catch (err) {
      console.error("Sign up failed:", err);
      setError(friendlyAuthError(err, "Sign up failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="spoty-auth auth-root">
      <div className="auth-shell">
        <aside className="auth-panel" aria-hidden="true">
          <Link to="/" className="spoty-brand auth-panel__brand">
            <MapPin className="spoty-brand__mark" size={28} />
            Spoty
          </Link>
          <p className="auth-panel__tagline">
            Start mapping the places you want to remember — and share.
          </p>
        </aside>

        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h1 className="auth-card__title">Create account</h1>
          <p className="auth-card__subtitle">
            Join Spoty and drop your first pin in under a minute.
          </p>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <label className="auth-label" htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            className="auth-input"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setUsernameAvailability("idle");
            }}
            type="email"
            autoComplete="email"
            required
          />

          <label className="auth-label" htmlFor="signup-username">
            Username <span className="auth-optional">(optional)</span>
          </label>
          <div className="auth-username-row">
            <input
              id="signup-username"
              className="auth-input"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                setUsernameAvailability("idle");
              }}
              type="text"
              autoComplete="username"
              placeholder="Leave blank to use one from your email"
            />
            <button
              type="button"
              className="spoty-btn spoty-btn--soft auth-check-btn"
              onClick={handleCheckUsernameAvailability}
              disabled={
                checkingUsername ||
                sanitizeUsernameForStorage(usernameInput.trim()).length < 3
              }
            >
              {checkingUsername ? "Checking…" : "Check"}
            </button>
          </div>
          <p className="auth-hint">
            3–20 characters. Letters, numbers, underscores, and hyphens only.
          </p>
          {usernameAvailability === "available" && (
            <p className="auth-status auth-status--ok">Available</p>
          )}
          {usernameAvailability === "taken" && (
            <p className="auth-status auth-status--bad">Taken</p>
          )}
          {usernameAvailability === "throttled" && (
            <p className="auth-status auth-status--bad">
              Please wait a moment before checking again.
            </p>
          )}

          <label className="auth-label" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
          <p className="auth-hint">At least {MIN_PASSWORD_LENGTH} characters.</p>

          <button
            className="spoty-btn spoty-btn--primary auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating…" : "Sign Up"}
          </button>

          <p className="auth-footer-links">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
          <p className="auth-footer-links">
            <Link to="/">Back to Spoty</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import {
  deriveUsernameFromEmail,
  sanitizeUsernameForStorage,
  isValidSignupUsernameFormat,
} from "../utils/usernameUtils";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  /** 'idle' | 'available' | 'taken' — availability is boolean-only in the UI (no profile payload exposed). */
  const [usernameAvailability, setUsernameAvailability] = useState("idle");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const navigate = useNavigate();

  /**
   * Sanitize with /[^a-zA-Z0-9_-]/g before any DB call; query uses parameterized .eq() only.
   * Rate limiting: Supabase anon key quotas apply — no separate client throttle.
   */
  const handleCheckUsernameAvailability = async () => {
    setUsernameAvailability("idle");
    const sanitized = sanitizeUsernameForStorage(usernameInput.trim());
    if (sanitized.length < 3) {
      setUsernameAvailability("idle");
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
        setError("Username must be 3–20 characters and use only letters, numbers, underscores, or hyphens.");
        setLoading(false);
        return;
      }

      const { data, error: signErr } = await supabase.auth.signUp({ email, password });
      if (signErr) throw signErr;

      if (data.user) {
        const chosenOrDerived = trimmedUsername
          ? sanitizeUsernameForStorage(trimmedUsername)
          : deriveUsernameFromEmail(email);

        const safeUsername = sanitizeUsernameForStorage(chosenOrDerived).slice(0, 20);
        const finalUsername =
          safeUsername.length >= 3 ? safeUsername : deriveUsernameFromEmail(email);

        await supabase.from("profiles").insert({
          id: data.user.id,
          username: finalUsername,
          email: email.trim().toLowerCase(),
        });
      }

      navigate("/app");
    } catch (err) {
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        {error && <div className="auth-error">{error}</div>}

        <label>Email</label>
        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setUsernameAvailability("idle");
          }}
          type="email"
          required
        />

        <label>Username (optional)</label>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <input
            value={usernameInput}
            onChange={(e) => {
              setUsernameInput(e.target.value);
              setUsernameAvailability("idle");
            }}
            type="text"
            autoComplete="username"
            placeholder="Leave blank to use one from your email"
            style={{ flex: "1 1 160px", minWidth: "140px" }}
          />
          <button
            type="button"
            onClick={handleCheckUsernameAvailability}
            disabled={checkingUsername || sanitizeUsernameForStorage(usernameInput.trim()).length < 3}
            style={{
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              cursor: "pointer",
              fontSize: "13px",
              whiteSpace: "nowrap",
            }}
          >
            {checkingUsername ? "Checking…" : "Check availability"}
          </button>
        </div>
        <p style={{ fontSize: "12px", color: "#666", marginTop: "4px", marginBottom: "8px" }}>
          3–20 characters. Letters, numbers, underscores, and hyphens only. If you skip this, we pick a
          username from your email.
        </p>
        {usernameAvailability === "available" && (
          <p style={{ fontSize: "13px", color: "#15803d", marginTop: 0 }}>✓ Available</p>
        )}
        {usernameAvailability === "taken" && (
          <p style={{ fontSize: "13px", color: "#b91c1c", marginTop: 0 }}>✗ Taken</p>
        )}

        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "8px",
            padding: "10px",
            borderRadius: "6px",
            border: "none",
            background: "#1cbe52",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p style={{ marginTop: 12 }}>
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
        <p style={{ marginTop: 6 }}>
          <Link to="/">Back</Link>
        </p>
      </form>
    </div>
  );
}

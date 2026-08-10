import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import {
  friendlyAuthError,
  isPasswordLongEnough,
  MIN_PASSWORD_LENGTH,
} from "../utils/authSecurity";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isPasswordLongEnough(password)) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      setLoading(false);
      return;
    }

    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signErr) throw signErr;
      navigate("/app");
    } catch (err) {
      console.error("Sign in failed:", err);
      setError(friendlyAuthError(err, "Sign in failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="spoty-auth auth-root auth-root--apple">
      <header className="auth-topbar">
        <Link to="/" className="spoty-brand auth-topbar__brand">
          <MapPin className="spoty-brand__mark" size={18} aria-hidden="true" />
          Spoty
        </Link>
        <Link className="auth-topbar__link" to="/signup">
          Create account
        </Link>
      </header>

      <main className="auth-main">
        <form className="auth-sheet" onSubmit={handleSubmit} noValidate>
          <div className="auth-sheet__mark" aria-hidden="true">
            <MapPin size={28} />
          </div>
          <h1 className="auth-sheet__title">Sign in to Spoty</h1>
          <p className="auth-sheet__lede">
            One account for your places and the friends you share them with.
          </p>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <label className="auth-label" htmlFor="signin-email">
            Email
          </label>
          <input
            id="signin-email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />

          <label className="auth-label" htmlFor="signin-password">
            Password
          </label>
          <input
            id="signin-password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />

          <button
            className="spoty-btn spoty-btn--primary auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <p className="auth-sheet__foot">
            Don’t have an account? <Link to="/signup">Create one</Link>
          </p>
          <p className="auth-sheet__foot">
            <Link to="/">Back to Spoty</Link>
          </p>
        </form>
      </main>
    </div>
  );
}

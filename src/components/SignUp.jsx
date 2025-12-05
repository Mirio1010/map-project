import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // ⭐ AUTO-CREATE PROFILE ROW FOR THE NEW USER
      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          username: email.split("@")[0], // default username = prefix of email
          email: email, // Store email for friend lookup functionality
        });
      }

      // navigate user to sign-in or directly to app depending on your Supabase settings
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
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />

        <button className="btn primary" type="submit" disabled={loading}>
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

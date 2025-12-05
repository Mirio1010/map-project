import React from "react";
import { Link } from "react-router-dom";
import "./landing.css";

export default function Landing() {
  return (
    
    <div className="landing-root">
      <div className="landing-card">
        <h1>Welcome to Spoty</h1>
        <p>Discover and save places on the map.</p>

        <div className="landing-actions">
          <Link className="btn primary" to="/signin">
            Sign In
          </Link>
          <Link className="btn" to="/signup">
            Sign Up
          </Link>

        </div>
      </div>
    </div>
  );
}

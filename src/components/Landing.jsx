import React from "react";
import { Link } from "react-router-dom";
import "./landing.css";
import { MapPin, Compass, Tag, Share2, ListFilter, Users } from "lucide-react";
import { FaGithub } from "react-icons/fa";


export default function Landing() {
  return (
    <div className="landing-root">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="nav-logo">
            <MapPin className="icon" />
            <span>Spoty</span>
          </div>
          <div className="nav-actions">
            {/* <button className="nav-link">Sign In</button>
            <button className="btn primary">Get Started</button> */}

            <button className="nav-link">
              <Link className="btn primary" to="/signin">
                Sign In
              </Link>
            </button>
            <button className="btn primary">
              <Link className="btn" to="/signup">
                Sign Up
              </Link>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-text">
            <h1>
              Your World,
              <span> Mapped & Shared</span>
            </h1>
            <p>
              Drop pins on locations you want to remember or share. Discover
              events, places, and meaningful moments through an interactive
              social map experience.
            </p>

            <div className="hero-actions">
              <button className="btn primary">
                <Compass size={18} />
                <Link className="btn" to="/signup">
                  Start Exploring
                </Link>
              </button>
              <button className="btn secondary">
                <a
                  href="https://github.com/Mirio1010/spoty"
                  className="learnMore"
                  target="_blank"
                >
                  Learn More
                </a>
              </button>
            </div>

            {/* <div className="hero-stats">
              <div>
                <strong>10K+</strong>
                <span>Active Users</span>
              </div>
              <div>
                <strong>50K+</strong>
                <span>Spots Shared</span>
              </div>
            </div> */}
          </div>

          <div className="hero-image">
            <img
              src="https://github.com/Mirio1010/spoty/raw/main/src/assets/demoV2.gif"
              alt="Map preview"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2>Everything You Need to Map Your World</h2>
        <p className="features-subtitle">
          A social and personalized map experience designed for discovery and
          sharing
        </p>

        <div className="features-grid">
          <Feature
            icon={<MapPin />}
            title="Drop Pins Anywhere"
            description={
              "Save places instantly by dropping pins on the map. Add notes, memories, or plans so you never forget a spot that matters."
            }
          />
          <Feature
            icon={<Tag />}
            title="Organize with Tags"
            description={
              "Label your pins with custom tags like food, events, or travel. Stay organized and find exactly what you’re looking for in seconds."
            }
          />
          <Feature
            icon={<Share2 />}
            title="Share with Friends"
            description={
              "Connect with friends and see the places they recommend. Discover spots through people you trust, not random reviews."
            }
          />
          <Feature
            icon={<ListFilter />}
            title="Smart Filtering"
            description={
              "Filter pins by category, date, or friends to keep your map focused. See only what’s relevant to you right now."
            }
          />
          {/* <Feature icon={<Users />} title="Social Discovery" />
          <Feature icon={<Compass />} title="Explore Nearby" /> */}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="nav-logo"></div>
          <p>© 2025 Spoty. All rights reserved.</p>
          <div className="footer-links">
            <a href="https://github.com/Mirio1010/spoty">
              <FaGithub size={40} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, description }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}


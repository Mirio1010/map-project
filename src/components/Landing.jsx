import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import LandingDemoMap from "./LandingDemoMap";
import "./landing.css";

const DEMO_GIF =
  "https://github.com/Mirio1010/spoty/raw/main/src/assets/demoV2.gif";
const GITHUB_URL = "https://github.com/Mirio1010/spoty";

export default function Landing() {
  const rootRef = useRef(null);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const onScroll = () => {
      setNavScrolled(root.scrollTop > 12);
    };
    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = root.querySelectorAll("[data-reveal]");

    if (reduceMotion) {
      targets.forEach((el) => el.classList.add("is-in"));
      return () => root.removeEventListener("scroll", onScroll);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      {
        root,
        threshold: 0.15,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    targets.forEach((el) => observer.observe(el));

    return () => {
      root.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`spoty-marketing landing-root${navScrolled ? " is-scrolled" : ""}`}
    >
      <header className="landing-nav">
        <div className="landing-nav__inner">
          <a className="spoty-brand landing-nav__brand" href="#top" aria-label="Spoty home">
            <MapPin className="spoty-brand__mark" size={20} aria-hidden="true" />
            Spoty
          </a>
          <nav className="landing-nav__actions" aria-label="Account">
            <Link className="landing-nav__link" to="/signin">
              Sign In
            </Link>
            <Link className="spoty-btn spoty-btn--primary landing-nav__cta" to="/signup">
              Start Exploring
            </Link>
          </nav>
        </div>
        <div className="landing-nav__edge" aria-hidden="true" />
      </header>

      <main id="top">
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-hero__copy">
            <h1
              id="landing-hero-title"
              className="landing-hero__brand landing-enter"
              style={{ "--enter-delay": "0ms" }}
            >
              Spoty
            </h1>
            <p
              className="landing-hero__headline landing-enter"
              style={{ "--enter-delay": "60ms" }}
            >
              Your places. Shared.
            </p>
            <p
              className="landing-hero__lede landing-enter"
              style={{ "--enter-delay": "120ms" }}
            >
              Drop pins on what matters, then see the spots real people trust.
            </p>
            <div
              className="landing-hero__actions landing-enter"
              style={{ "--enter-delay": "180ms" }}
            >
              <Link className="spoty-btn spoty-btn--primary" to="/signup">
                Start Exploring
              </Link>
              <Link className="spoty-btn spoty-btn--ghost" to="/signin">
                Sign In
              </Link>
            </div>
          </div>

          <div
            className="landing-hero__stage landing-enter"
            style={{ "--enter-delay": "240ms" }}
          >
            <LandingDemoMap />
          </div>
        </section>

        <section
          className="landing-beats"
          aria-labelledby="landing-beats-title"
          data-reveal
        >
          <div className="landing-section-head">
            <p className="landing-kicker">How it works</p>
            <h2 id="landing-beats-title">Drop, Share, Discover.</h2>
            <p>Three moves. No feed, just places and people.</p>
          </div>
          <ol className="landing-beats__list">
            <li className="landing-beat" style={{ "--stagger": "0ms" }}>
              <h3>Drop</h3>
              <p>Pin a spot with a name, category, and note.</p>
            </li>
            <li className="landing-beat" style={{ "--stagger": "40ms" }}>
              <h3>Share</h3>
              <p>Friends appear in their own colors on your map.</p>
            </li>
            <li className="landing-beat" style={{ "--stagger": "80ms" }}>
              <h3>Discover</h3>
              <p>Filter to what’s relevant, right now.</p>
            </li>
          </ol>
        </section>

        <section
          className="landing-session"
          aria-labelledby="landing-session-title"
          data-reveal
        >
          <div className="landing-section-head">
            <p className="landing-kicker">In the product</p>
            <h2 id="landing-session-title">A real session.</h2>
            <p>
              Try the live map above, no account needed. Below is a recorded
              walkthrough of Spoty in use.
            </p>
          </div>
          <div className="landing-session__device">
            <div className="landing-session__frame">
              <img
                src={DEMO_GIF}
                alt="Spoty app walkthrough showing map pins and filters"
              />
            </div>
          </div>
          <p className="landing-session__team">
            Built by a CUNY Tech Prep fellowship team.
          </p>
        </section>

        <section className="landing-cta-band" aria-label="Get started" data-reveal>
          <h2 className="landing-cta-band__title">Ready when you are.</h2>
          <Link className="spoty-btn spoty-btn--primary" to="/signup">
            Start Exploring
          </Link>
        </section>
      </main>

      <footer className="landing-footer" data-reveal>
        <div className="landing-footer__inner">
          <div className="landing-footer__brand">
            <MapPin size={16} aria-hidden="true" />
            <span>Spoty</span>
          </div>
          <p className="landing-footer__copy">
            Copyright © {new Date().getFullYear()} Spoty. Built with a CUNY Tech
            Prep team.
          </p>
          <div className="landing-footer__links">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Spoty on GitHub"
              className="landing-footer__github"
            >
              <FaGithub size={22} />
            </a>
            <Link to="/signup">Start Exploring</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

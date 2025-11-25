import React from "react";
export default function Header() {
  return (
    <header className="site-header">
      <nav aria-label="Primary">
        <a className="brand" href="#" data-route="home">
          Spoty <i className="fa-solid fa-map-location-dot"></i>
        </a>
        <ul className="tabs" role="tablist">
          <li role="presentation">
            <button role="tab" aria-selected="true" data-route="home">
              Home
            </button>
          </li>
          <li role="presentation">
            <button role="tab" aria-selected="false" data-route="explore">
              Explore
            </button>
          </li>
          <li role="presentation">
            <button role="tab" aria-selected="false" data-route="favorites">
              Profile
            </button>
          </li>
          <li role="presentation">
            <button role="tab" aria-selected="false" data-route="about">
              About
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}

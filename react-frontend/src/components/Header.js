import React from "react";
import Tabs from "./Tabs";

export default function Header({ onRouteChange }) {
  const tabList = [
    { label: "Home", route: "home" },
    { label: "Explore", route: "explore" },
    { label: "Profile", route: "profile" },
    { label: "About", route: "about" },
  ];

  return (
    <header className="site-header">
        <a className="brand" href="#" data-route="home">
          Spoty <i className="fa-solid fa-map-location-dot"></i>
        </a>
        <Tabs tabs={tabList} onSelect={onRouteChange} />
    </header>
  );
}

import React, { useState, useEffect } from "react"; // added for managing pins
import Header from "./components/Header";
import LeftPane from "./components/LeftPane";
import MapPane from "./components/MapPane";
import Footer from "./components/Footer";
import "./styles/style.css";


export default function App() {
  // Pins state (map markers)
  const [pins, setPins] = useState([]);
  const addPin = (pos) => setPins((prev) => [...prev, pos]);

  // Simple route state for Tabs (home, explore, profile, about)
  const [currentRoute, setCurrentRoute] = useState("home");

  // On mount: read hash from URL to restore route (e.g. #explore)
  useEffect(() => {
    const hashRoute = window.location.hash.replace(/^#/, "");
    if (hashRoute) setCurrentRoute(hashRoute);
  }, []);


  // Keep URL hash in sync when route changes
  useEffect(() => {
    window.history.replaceState(null, "", `#${currentRoute}`);
  }, [currentRoute]);


  function renderView() {
    switch (currentRoute) {
      case "home":
        return (
          <div className="home-layout">
            <LeftPane addPin={addPin} />
            <div className="right-pane">
              <MapPane pins={pins} />
            </div>          
          </div>
        );
      case "explore":
        return <div className="placeholder">Explore view</div>;
      case "profile":
        return <div className="placeholder">Profile view</div>;
      case "about":
        return <div className="placeholder">About view</div>;
      default:
        return (
          <div className="home-layout">
            <LeftPane addPin={addPin} />
            <div className="right-pane">
              <MapPane pins={pins} />
            </div>          
          </div>
        );
    }
  }

  return (
    <div className="app-container">
      <Header onRouteChange={setCurrentRoute} />
      <main className="layout-full">{renderView()}</main>
      <Footer />
    </div>
  );
}
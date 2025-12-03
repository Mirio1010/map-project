import { useState } from "react";
import "../styles/style.css";

function Header({ onToggleSidebar }) {
  const [activeTab, setActiveTab] = useState("home");

  const tabs = ["home", "explore", "profile", "about"];

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    console.log(`Navigated to ${tab}`);
  };

  return (
    <header className="site-header">
      <nav aria-label="Primary">
        <button
          onClick={onToggleSidebar}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
            padding: "0.5rem",
          }}
          title="Toggle sidebar"
        >
          ☰
        </button>
        <a
          className="brand"
          href="#"
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          Spoty <span style={{ fontSize: "18px" }}>🗺️</span>
        </a>
        <ul className="tabs" role="tablist">
          {tabs.map((tab) => (
            <li key={tab} role="presentation">
              <button
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => handleTabClick(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export default Header;

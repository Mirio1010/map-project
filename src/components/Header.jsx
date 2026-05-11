import "../styles/style.css";
import LogoutButton from "./LogoutButton";
import { GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";



function Header({
  onToggleSidebar,
  activeTab,
  onTabChange,
  onOpenTutorialReplay,
  profileRefreshKey = 0,
}) {
  const tabs = ["home", "explore", "profile", "about"];
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, email")
        .eq("id", user.id)
        .single();

      if (profile) {
        const name =
          profile.username || profile.email?.split("@")[0] || "";
        setDisplayName(name);
      }
    };

    loadProfile();
  }, [profileRefreshKey]);

  const handleTabClick = (tab) => {
    onTabChange(tab);
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
          Spoty <span style={{ fontSize: "28px" }}>🗺️</span>
        </a>
        <ul className="tabs" role="tablist">
          {tabs.map((tab) => (
            <li key={tab} role="presentation">
              <button
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => handleTabClick(tab)}
                {...(tab === "explore"
                  ? { "data-tutorial": "explore-tab" }
                  : {})}
                {...(tab === "profile" ? { "data-tutorial": "profile-tab" } : {})}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            </li>
          ))}
        </ul>

        {/* Display name (username preferred; email prefix fallback) */}
        <div
          style={{ color: "white", marginLeft: "auto", marginRight: "1rem" }}
        >
          {displayName && `Hello, ${displayName}`}
        </div>
        <button
          type="button"
          className="tutorial-replay-header-btn"
          onClick={() => onOpenTutorialReplay?.()}
          title="Replay tutorial"
        >
          <GraduationCap aria-hidden strokeWidth={2} />
          <span>Tutorial</span>
        </button>

        {/* Logout button on the far right */}
        <LogoutButton />
      </nav>
    </header>
  );
}




export default Header;

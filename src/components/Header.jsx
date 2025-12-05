import "../styles/style.css";
import LogoutButton from "./LogoutButton";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";



function Header({ onToggleSidebar, activeTab, onTabChange }) {
  const tabs = ["home", "explore", "profile", "about"];
  const [username, setUsername] = useState("");

    useEffect(() => {
      const loadProfile = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUsername(profile.username);
        }
      };

      loadProfile();
    }, []);

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
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            </li>
          ))}
        </ul>

        {/* Username display */}
        <div
          style={{ color: "white", marginLeft: "auto", marginRight: "1rem" }}
        >
          {username && `Hello, ${username}`}
        </div>
        {/* Logout button on the far right */}
        <LogoutButton />
      </nav>
    </header>
  );
}




export default Header;

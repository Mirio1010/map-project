import { useState, useEffect, useMemo } from "react";
import Header from "./components/Header";
import Sidebar from "./components/sidebar";
import Map from "./components/map";
import AddSpotModal from "./components/AddSpotModal";
import Footer from "./components/Footer";
import Explore from "./components/Explore";
import Profile from "./components/Profile";
import About from "./components/About";
import { supabase } from "./utils/supabaseClient";


import "./styles/style.css";
import "./styles/cards.css";

function App() {
  const [pins, setPins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [mapAction, setMapAction] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [initialPin, setInitialPin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  // --- NEW STATES for Sorting/Filtering ---
  const [showTop10, setShowTop10] = useState(false);
  // ----------------------------------------

  // --- STATES for Friends Pins ---
  const [friendsPins, setFriendsPins] = useState([]);
  const [showFriendsPins, setShowFriendsPins] = useState(false);
  const [friendProfiles, setFriendProfiles] = useState([]);
  const [showMyPins, setShowMyPins] = useState(true); // Toggle to show/hide user's own pins
  const [friendUsernames, setFriendUsernames] = useState({}); // Map of user_id to username
  const [friendColors, setFriendColors] = useState({}); // Map of user_id to color
  // ----------------------------------------

  // --- Home filter states (similar to Explore) ---
  const [isHomeFilterOpen, setIsHomeFilterOpen] = useState(false);
  const [selectedCategoriesHome, setSelectedCategoriesHome] = useState([]);
  const [minRatingHome, setMinRatingHome] = useState(0);
  const [maxRatingHome, setMaxRatingHome] = useState(5);
  const [sortByHome, setSortByHome] = useState("rating"); // "rating", "name", "newest"
  const [selectedFriendHome, setSelectedFriendHome] = useState("");

  // 1. load Pins on startup
  // useEffect(() => {
  //   try {
  //     const saved = JSON.parse(localStorage.getItem("spotPins")) || [];
  //     setPins(saved);
  //   } catch (e) {
  //     console.error("Could not load pins", e);
  //   }
  // }, []);

  useEffect(() => {
    const loadPins = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error getting user:", userError.message);
          setPins([]);
          return;
        }

        if (!user) {
          // not logged in – no pins
          setPins([]);
          return;
        }

        const { data, error } = await supabase
          .from("locations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading pins:", error.message);
          setPins([]);
          return;
        }

        // Filter out expired pins
        const now = new Date();
        const validPins = (data || []).filter((pin) => {
          if (!pin.expires_at) return true; // Permanent pins
          const expiresAt = new Date(pin.expires_at);
          return expiresAt > now; // Only include if not expired
        });

        // Delete expired pins from database
        const expiredPins = (data || []).filter((pin) => {
          if (!pin.expires_at) return false;
          const expiresAt = new Date(pin.expires_at);
          return expiresAt <= now;
        });

        // Delete expired pins in background
        if (expiredPins.length > 0) {
          expiredPins.forEach(async (pin) => {
            await supabase
              .from("locations")
              .delete()
              .eq("id", pin.id)
              .eq("user_id", user.id);
          });
        }

        setPins(validPins);
      } catch (err) {
        console.error("Unexpected error loading pins:", err);
        setPins([]);
      }
    };

    loadPins();
  }, []);

  // Load friends pins and usernames
  useEffect(() => {
    const loadFriendsPins = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setFriendsPins([]);
          setFriendUsernames({});
          return;
        }

        // Load user's friends list
        const { data: friendsData, error: friendsError } = await supabase
          .from("friends")
          .select("friend_id")
          .eq("user_id", user.id);

        if (friendsError) {
          console.error("Error loading friends:", friendsError.message);
          setFriendsPins([]);
          setFriendUsernames({});
          return;
        }

        const friendIdsList = (friendsData || []).map((f) => f.friend_id);
        
        if (friendIdsList.length === 0) {
          setFriendsPins([]);
          setFriendUsernames({});
          return;
        }

        // Load pins from friends
        const { data: pinsData, error: pinsError } = await supabase
          .from("locations")
          .select("*")
          .in("user_id", friendIdsList)
          .order("created_at", { ascending: false });

        if (pinsError) {
          console.error("Error loading friends pins:", pinsError.message);
          setFriendsPins([]);
          setFriendUsernames({});
          return;
        }

        // Filter out expired pins
        const now = new Date();
        const validFriendsPins = (pinsData || []).filter((pin) => {
          if (!pin.expires_at) return true; // Permanent pins
          const expiresAt = new Date(pin.expires_at);
          return expiresAt > now; // Only include if not expired
        });

        setFriendsPins(validFriendsPins);

        // Load usernames for all friends
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, email")
          .in("id", friendIdsList);

        if (profilesError) {
          console.error("Error loading friend profiles:", profilesError.message);
        } else {
          const usernameMap = {};
          (profilesData || []).forEach((profile) => {
            usernameMap[profile.id] = profile.username || profile.email || "Unknown";
          });
          setFriendProfiles(profilesData || []);

          // Generate consistent colors for friends - ensure unique colors
          const palette = [
            "#ff6b6b",  // Red
            "#ffd166",  // Yellow
            "#06d6a0",  // Green
            "#118ab2",  // Blue
            "#9b6bff",  // Purple
            "#ef476f",  // Pink
            "#33b5e5",  // Light Blue
            "#f78c6b",  // Orange
            "#c792ea",  // Lavender
            "#8dd3c7",  // Mint
            "#ff9f43",  // Orange Red
            "#5f27cd",  // Deep Purple
            "#00d2d3",  // Cyan
            "#ff6348",  // Coral
            "#a55eea",  // Violet
          ];
          
          // Preserve existing colors for friends that already have them
          const existingColorMap = friendColors || {};
          const colorMap = { ...existingColorMap };
          const usedColors = new Set(Object.values(existingColorMap));
          
          // Assign colors to new friends (those without existing colors)
          (profilesData || []).forEach((profile) => {
            // If friend already has a color, keep it
            if (colorMap[profile.id]) {
              return;
            }
            
            // Find first unused color from palette
            let assignedColor = null;
            for (const color of palette) {
              if (!usedColors.has(color)) {
                assignedColor = color;
                usedColors.add(color);
                break;
              }
            }
            // If all colors are used, cycle through palette
            if (!assignedColor) {
              assignedColor = palette[usedColors.size % palette.length];
            }
            colorMap[profile.id] = assignedColor;
          });
          
          setFriendUsernames(usernameMap);
          setFriendColors(colorMap);
        }
      } catch (err) {
        console.error("Unexpected error loading friends pins:", err);
        setFriendsPins([]);
        setFriendUsernames({});
        setFriendProfiles([]);
        setFriendColors({});
      }
    };

    loadFriendsPins();
  }, []);


  // 2. save Pins (create or update)
  // const handleSavePin = (newPin) => {
  //   if (editIndex !== null && editIndex >= 0 && editIndex < pins.length) {
  //     const updatedPins = pins.map((p, i) => (i === editIndex ? newPin : p));
  //     setPins(updatedPins);
  //     localStorage.setItem("spotPins", JSON.stringify(updatedPins));
  //   } else {
  //     const updatedPins = [...pins, newPin];
  //     setPins(updatedPins);
  //     localStorage.setItem("spotPins", JSON.stringify(updatedPins));
  //   }
  //   // reset edit state and close modal
  //   setEditIndex(null);
  //   setInitialPin(null);
  //   setIsModalOpen(false);
  // };

  // // 3. delete Pin
  // const handleDeletePin = (index) => {
  //   if (!confirm("Are you sure you want to delete this spot?")) return;
  //   const updatedPins = pins.filter((_, i) => i !== index);
  //   setPins(updatedPins);
  //   localStorage.setItem("spotPins", JSON.stringify(updatedPins));
  // };


  const handleDeletePin = async (index) => {
    if (!confirm("Are you sure you want to delete this spot?")) return;

    const pin = pins[index];
    if (!pin || !pin.id) {
      console.error("Cannot delete pin — missing id");
      return;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Cannot delete pin — not authenticated");
        return;
      }

      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", pin.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting pin:", error.message);
        return;
      }

      // remove from state
      const updated = pins.filter((_, i) => i !== index);
      setPins(updated);
    } catch (err) {
      console.error("Unexpected error deleting pin:", err);
    }
  };


const handleSavePin = async (newPin) => {
  try {
    // 1. Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Cannot save pin — no authenticated user.");
      return;
    }

    // 2. EDITING an existing pin → UPDATE
    if (newPin.id) {
      const { error } = await supabase
        .from("locations")
        .update({
          name: newPin.name,
          address: newPin.address,
          description: newPin.description,
          category: newPin.category,
          images: newPin.images,
          lat: newPin.lat,
          lng: newPin.lng,
          rating: newPin.rating,
          expires_at: newPin.expires_at || null,
        })
        .eq("id", newPin.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating pin:", error.message);
        return;
      }

      // Update React state so UI reflects the edit
      const updatedPins = pins.map((p, i) =>
        i === editIndex ? { ...p, ...newPin } : p
      );

      setPins(updatedPins);
    }

    // 3. CREATING a NEW pin → INSERT
    else {
      const { data: insertedPin, error } = await supabase
        .from("locations")
        .insert({
          user_id: user.id,
          name: newPin.name,
          address: newPin.address,
          description: newPin.description,
          category: newPin.category,
          images: newPin.images,
          lat: newPin.lat,
          lng: newPin.lng,
          rating: newPin.rating,
          expires_at: newPin.expires_at || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error inserting new pin:", error.message);
        return;
      }

      // Add newly created pin (with id) to UI
      setPins([...pins, insertedPin]);
    }

    // 4. Reset modal state
    setEditIndex(null);
    setInitialPin(null);
    setIsModalOpen(false);
  } catch (err) {
    console.error("Unexpected error saving pin:", err);
  }
};



  // 4. interaction Handlers
  const handleMapClick = (latlng) => {
    setClickedLocation(latlng);
    setIsModalOpen(true);
  };

  const handleEdit = (index) => {
    const pin = pins[index];
    if (!pin) return;
    setEditIndex(index);
    setInitialPin(pin);
    setIsModalOpen(true);
  };

  const handleZoom = (lat, lng, pinIndex) => {
    // if pinIndex is provided, open the popup too
    if (pinIndex !== undefined && pinIndex !== null) {
      setMapAction({ type: "ZOOM_AND_POPUP", lat, lng, pinIndex });
    } else {
      setMapAction({ type: "ZOOM", lat, lng });
    }
  };

  const handleLocate = () => {
    setMapAction({ type: "LOCATE" });
  };

  const filteredMyPins = useMemo(() => {
    let filtered = [...pins];

    // Category filter
    if (selectedCategoriesHome.length > 0) {
      filtered = filtered.filter((pin) =>
        selectedCategoriesHome.includes(pin.category)
      );
    }

    // Rating filter
    filtered = filtered.filter((pin) => {
      const rating = pin.rating || 0;
      return rating >= minRatingHome && rating <= maxRatingHome;
    });

    // Sorting - always sort by rating for Top 10
    filtered.sort((a, b) => {
      if (sortByHome === "rating" || showTop10) {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortByHome === "name") {
        return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
      } else if (sortByHome === "newest") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      return 0;
    });

    if (showTop10) {
      return filtered.slice(0, 10);
    }

    return filtered;
  }, [pins, selectedCategoriesHome, minRatingHome, maxRatingHome, sortByHome, showTop10]);

  const filteredFriendsPins = useMemo(() => {
    let filtered = [...friendsPins];

    // Friend filter
    if (selectedFriendHome) {
      filtered = filtered.filter((pin) => pin.user_id === selectedFriendHome);
    }

    // Category filter
    if (selectedCategoriesHome.length > 0) {
      filtered = filtered.filter((pin) =>
        selectedCategoriesHome.includes(pin.category)
      );
    }

    // Rating filter
    filtered = filtered.filter((pin) => {
      const rating = pin.rating || 0;
      return rating >= minRatingHome && rating <= maxRatingHome;
    });

    // Sorting - always sort by rating for Top 10
    filtered.sort((a, b) => {
      if (sortByHome === "rating" || showTop10) {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortByHome === "name") {
        return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
      } else if (sortByHome === "newest") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      return 0;
    });

    // Apply Top 10 filter
    if (showTop10) {
      return filtered.slice(0, 10);
    }

    return filtered;
  }, [friendsPins, selectedFriendHome, selectedCategoriesHome, minRatingHome, maxRatingHome, sortByHome, showTop10]);

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="layout-full">
            <div className={`sidebar-wrapper ${!sidebarOpen ? "hidden" : ""}`}>
              <Sidebar
                //  pass displayedPins for viewing, but originalPins for ID lookup
                pins={showMyPins ? filteredMyPins : []} 
                originalPins={pins}
                friendsPins={showFriendsPins ? filteredFriendsPins : []}
                friendUsernames={friendUsernames}
                friendColors={friendColors}
                friendProfiles={friendProfiles}
                
                onDelete={handleDeletePin}
                onEdit={handleEdit}
                onZoom={handleZoom}
                onAddSpot={() => {
                  setClickedLocation(null);
                  setInitialPin(null);
                  setEditIndex(null);
                  setIsModalOpen(true);
                }}
                onLocate={handleLocate}
                
                showTop10={showTop10}
                setShowTop10={setShowTop10}
                
                // Friends pins toggle
                showFriendsPins={showFriendsPins}
                setShowFriendsPins={setShowFriendsPins}
                
                // My pins toggle
                showMyPins={showMyPins}
                setShowMyPins={setShowMyPins}

                // Home filters
                isFilterOpen={isHomeFilterOpen}
                setIsFilterOpen={setIsHomeFilterOpen}
                selectedCategories={selectedCategoriesHome}
                setSelectedCategories={setSelectedCategoriesHome}
                minRating={minRatingHome}
                setMinRating={setMinRatingHome}
                maxRating={maxRatingHome}
                setMaxRating={setMaxRatingHome}
                sortBy={sortByHome}
                setSortBy={setSortByHome}
                selectedFriend={selectedFriendHome}
                setSelectedFriend={setSelectedFriendHome}
                onResetFilters={() => {
                  setSelectedCategoriesHome([]);
                  setMinRatingHome(0);
                  setMaxRatingHome(5);
                  setSortByHome("rating");
                  setSelectedFriendHome("");
                }}
              />
            </div>

            <Map
              pins={showMyPins ? filteredMyPins : []} // Map also shows filtered pins
              friendsPins={showFriendsPins ? filteredFriendsPins : []} // Friends pins when toggled on
              friendUsernames={friendUsernames} // Map of user_id to username
              friendColors={friendColors}
              onClickOnMap={handleMapClick}
              mapAction={mapAction}
              sidebarOpen={sidebarOpen}
            />
          </div>
        );
      case "explore":
        return (
          <div className="explore-page-wrapper">
            <Explore pins={pins} />
          </div>
        );
      case "profile":
        return <Profile />;
      case "about":
        return (
          <div className="about-page-wrapper">
            <About />
          </div>
        );
      default:
        return null; 
    }
  };

  return (
    <div className="app-container">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {renderContent()}

      {activeTab === "home" && (
        <AddSpotModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditIndex(null);
            setInitialPin(null);
          }}
          onSave={handleSavePin}
          initialCoords={clickedLocation}
          initialPin={initialPin}
        />
      )}

      <Footer />
    </div>
  );
}

export default App;
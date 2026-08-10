import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Header from "./components/Header";
import Sidebar from "./components/sidebar";
import Map from "./components/map";
import AddSpotModal from "./components/AddSpotModal";
import Footer from "./components/Footer";
import Explore from "./components/Explore";
import Profile from "./components/Profile";
import About from "./components/About";
import TutorialOverlay from "./components/TutorialOverlay";
import { supabase } from "./utils/supabaseClient";
import { isScheduledPinActive } from "./utils/scheduleUtils";
import { profileDisplayName } from "./utils/usernameUtils";

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
  /** Supabase uid for onboarding localStorage namespaces */
  const [userIdForUi, setUserIdForUi] = useState(null);
  /** Walkthrough spotlight controlled here so Header can reopen it anytime */
  const [tutorialOpen, setTutorialOpen] = useState(false);
  /** Bumping this re-runs the friends pins + profile labels loader (e.g. after tutorial “Add Spoty Team”). */
  const [friendsDataVersion, setFriendsDataVersion] = useState(0);
  /** Bumped when Profile saves username so Header greeting reloads without refresh. */
  const [headerProfileTick, setHeaderProfileTick] = useState(0);

  // --- NEW STATES for Sorting/Filtering ---
  const [showTop10, setShowTop10] = useState(false);
  // ----------------------------------------

  // --- STATES for Friends Pins ---
  const [friendsPins, setFriendsPins] = useState([]);
  /** Default on so friend markers load without an extra toggle click (map still respects user turning this off). */
  const [showFriendsPins, setShowFriendsPins] = useState(true);
  const [friendProfiles, setFriendProfiles] = useState([]);
  const [showMyPins, setShowMyPins] = useState(true); // Toggle to show/hide user's own pins
  const [friendUsernames, setFriendUsernames] = useState({}); // Map of user_id to username
  const [friendColors, setFriendColors] = useState({}); // Map of user_id to color
  /** True while friend IDs → pins → profiles are loading (deployed latency makes this visible). */
  const [friendsLoading, setFriendsLoading] = useState(false);
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

  /** Tutorial completion flag per Supabase user id (supports legacy `"1"` writes). */
  const tutorialStorageCompleted = useCallback((uid) => {
    const key = `tutorial_done_${uid}`;
    const raw = window.localStorage.getItem(key);
    return raw === "true" || raw === "1";
  }, []);

  // Session must be resolved before tutorial storage keys use the real user id (avoid null/wrong key).
  useEffect(() => {
    const applyAuthUser = (user) => {
      if (!user?.id) {
        setUserIdForUi(null);
        return;
      }
      const uid = user.id;
      setUserIdForUi(uid);
      const key = `tutorial_done_${uid}`;
      const done = tutorialStorageCompleted(uid);
      console.log("[tutorial] storage check", { key, done });
      if (!done) {
        setTutorialOpen(true);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      applyAuthUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyAuthUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [tutorialStorageCompleted]);

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

        // Drop only legacy expired pins — keep ALL of the user's pins (including inactive-on-schedule)
        // so the sidebar and Profile stay editable. Map markers use a separate schedule filter.
        const now = new Date();
        const validPins = (data || []).filter((pin) => {
          if (!pin.expires_at) return true;
          const expiresAt = new Date(pin.expires_at);
          return expiresAt > now;
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

  const refreshFriendsPinsAndLabels = useCallback(() => {
    setFriendsDataVersion((v) => v + 1);
  }, []);

  /** Avoid re-setting friends pin state when Supabase returns the same rows (prevents map marker churn). */
  const friendsPinsDataSigRef = useRef("");

  /**
   * Load friends in one strictly ordered chain: friend IDs → their locations → profiles.
   * Uses `userIdForUi` (from auth session listener) instead of a separate `getUser()` call so
   * production does not race “session not ready yet” vs “empty friends query”.
   */
  useEffect(() => {
    if (!userIdForUi) {
      friendsPinsDataSigRef.current = "";
      setFriendsPins([]);
      setFriendUsernames({});
      setFriendProfiles([]);
      setFriendColors({});
      setFriendsLoading(false);
      return undefined;
    }

    const uid = userIdForUi;
    let cancelled = false;

    const loadFriendsData = async () => {
      setFriendsLoading(true);
      try {
        // Step 1 — friend IDs (must complete before locations query)
        const { data: friendsData, error: friendsError } = await supabase
          .from("friends")
          .select("friend_id")
          .eq("user_id", uid);

        if (cancelled) return;

        if (friendsError) {
          console.error("Failed to load friends data (friends table):", friendsError.message);
          friendsPinsDataSigRef.current = "";
          setFriendsPins([]);
          setFriendUsernames({});
          setFriendProfiles([]);
          setFriendColors({});
          return;
        }

        const friendIdsList = (friendsData || []).map((f) => f.friend_id);

        if (friendIdsList.length === 0) {
          friendsPinsDataSigRef.current = "";
          setFriendsPins([]);
          setFriendUsernames({});
          setFriendProfiles([]);
          setFriendColors({});
          return;
        }

        // Step 2 — locations only after IDs are known (sequential await)
        const { data: pinsData, error: pinsError } = await supabase
          .from("locations")
          .select("*")
          .in("user_id", friendIdsList)
          .order("created_at", { ascending: false });

        if (cancelled) return;

        if (pinsError) {
          console.error("Failed to load friends data (locations):", pinsError.message);
          friendsPinsDataSigRef.current = "";
          setFriendsPins([]);
          setFriendUsernames({});
          setFriendProfiles([]);
          setFriendColors({});
          return;
        }

        const now = new Date();
        const validFriendsPins = (pinsData || []).filter((pin) => {
          if (!pin.expires_at) return true;
          const expiresAt = new Date(pin.expires_at);
          return expiresAt > now;
        });

        const pinsDataSig = validFriendsPins.map((p) => p.id).join("|");
        if (pinsDataSig !== friendsPinsDataSigRef.current) {
          friendsPinsDataSigRef.current = pinsDataSig;
          setFriendsPins(validFriendsPins);
        }

        if (cancelled) return;

        // Step 3 — profiles for labels/colors
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, email")
          .in("id", friendIdsList);

        if (cancelled) return;

        if (profilesError) {
          console.error("Failed to load friends data (profiles):", profilesError.message);
          return;
        }

        const usernameMap = {};
        (profilesData || []).forEach((profile) => {
          usernameMap[profile.id] = profileDisplayName(profile, "Unknown");
        });

        setFriendProfiles((prev) => {
          const next = profilesData || [];
          if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
          return next;
        });

        const palette = [
          "#ff6b6b",
          "#ffd166",
          "#06d6a0",
          "#118ab2",
          "#9b6bff",
          "#ef476f",
          "#33b5e5",
          "#f78c6b",
          "#c792ea",
          "#8dd3c7",
          "#ff9f43",
          "#5f27cd",
          "#00d2d3",
          "#ff6348",
          "#a55eea",
        ];

        setFriendUsernames((prev) => {
          const prevJson = JSON.stringify(prev);
          const nextJson = JSON.stringify(usernameMap);
          return prevJson === nextJson ? prev : usernameMap;
        });

        setFriendColors((existingColorMap) => {
          const colorMap = { ...existingColorMap };
          const usedColors = new Set(Object.values(existingColorMap));

          (profilesData || []).forEach((profile) => {
            if (colorMap[profile.id]) {
              return;
            }

            let assignedColor = null;
            for (const color of palette) {
              if (!usedColors.has(color)) {
                assignedColor = color;
                usedColors.add(color);
                break;
              }
            }
            if (!assignedColor) {
              assignedColor = palette[usedColors.size % palette.length];
            }
            colorMap[profile.id] = assignedColor;
          });

          const prevJson = JSON.stringify(existingColorMap);
          const nextJson = JSON.stringify(colorMap);
          return prevJson === nextJson ? existingColorMap : colorMap;
        });
      } catch (err) {
        console.error("Failed to load friends data:", err);
        friendsPinsDataSigRef.current = "";
        setFriendsPins([]);
        setFriendUsernames({});
        setFriendProfiles([]);
        setFriendColors({});
      } finally {
        if (!cancelled) {
          setFriendsLoading(false);
        }
      }
    };

    loadFriendsData();

    return () => {
      cancelled = true;
      setFriendsLoading(false);
    };
  }, [userIdForUi, friendsDataVersion]);


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
          expires_at: newPin.expires_at ?? null,
          schedule: newPin.schedule ?? null,
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
          expires_at: newPin.expires_at ?? null,
          schedule: newPin.schedule ?? null,
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

  /**
   * Full list of the signed-in user's pins (after expiry cleanup only). Sidebar, Profile, and
   * edit flows use this — scheduled “off” windows do not hide pins from management UI.
   */
  const allUserPins = pins;

  /**
   * Home-tab filters (category, rating, sort, top 10) applied to the user’s pins — still includes
   * inactive scheduled pins so they remain visible and editable in the sidebar.
   */
  const filteredMyPins = useMemo(() => {
    let filtered = [...allUserPins];

    if (selectedCategoriesHome.length > 0) {
      filtered = filtered.filter((pin) =>
        selectedCategoriesHome.includes(pin.category),
      );
    }

    filtered = filtered.filter((pin) => {
      const rating = pin.rating || 0;
      return rating >= minRatingHome && rating <= maxRatingHome;
    });

    filtered.sort((a, b) => {
      if (sortByHome === "rating" || showTop10) {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortByHome === "name") {
        return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
      }
      if (sortByHome === "newest") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      return 0;
    });

    if (showTop10) {
      return filtered.slice(0, 10);
    }

    return filtered;
  }, [allUserPins, selectedCategoriesHome, minRatingHome, maxRatingHome, sortByHome, showTop10]);

  /**
   * Subset of filteredMyPins that passes the recurring schedule “active now” check — ONLY these
   * render as markers on the map (inactive windows are hidden on the map, not in the sidebar).
   */
  const visibleMapPins = useMemo(
    () =>
      filteredMyPins.filter(
        (pin) => !pin.schedule || isScheduledPinActive(pin.schedule),
      ),
    [filteredMyPins],
  );

  /**
   * Friend pins after home filters — sidebar lists all; map uses visibleMapFriendsPins.
   */
  const filteredFriendsPins = useMemo(() => {
    let filtered = [...friendsPins];

    if (selectedFriendHome) {
      filtered = filtered.filter((pin) => pin.user_id === selectedFriendHome);
    }

    if (selectedCategoriesHome.length > 0) {
      filtered = filtered.filter((pin) =>
        selectedCategoriesHome.includes(pin.category),
      );
    }

    filtered = filtered.filter((pin) => {
      const rating = pin.rating || 0;
      return rating >= minRatingHome && rating <= maxRatingHome;
    });

    filtered.sort((a, b) => {
      if (sortByHome === "rating" || showTop10) {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortByHome === "name") {
        return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
      }
      if (sortByHome === "newest") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      return 0;
    });

    if (showTop10) {
      return filtered.slice(0, 10);
    }

    return filtered;
  }, [friendsPins, selectedFriendHome, selectedCategoriesHome, minRatingHome, maxRatingHome, sortByHome, showTop10]);

  /**
   * Friend pins that are allowed on the map (active schedule window or non-scheduled).
   */
  const visibleMapFriendsPins = useMemo(
    () =>
      filteredFriendsPins.filter(
        (pin) => !pin.schedule || isScheduledPinActive(pin.schedule),
      ),
    [filteredFriendsPins],
  );

  /**
   * Re-open the scripted tour from step 1. If it is already open, close then reopen so
   * TutorialOverlay can reset via its isOpen edge (no remount from tab switches).
   */
  /** Replay opens the tour directly without clearing `tutorial_done_*` so auto-start stays off next login. */
  const handleTutorialReplay = () => {
    setTutorialOpen((wasOpen) => {
      if (wasOpen) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setTutorialOpen(true));
        });
        return false;
      }
      return true;
    });
  };

  /** Home tab scaffolding the first four onboarding beats expect (sidebar + filter drawer wide open) */
  const prepareHomeTutorialView = () => {
    setActiveTab("home");
    setSidebarOpen(true);
    setIsHomeFilterOpen(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="layout-full">
            <div className={`sidebar-wrapper ${!sidebarOpen ? "hidden" : ""}`}>
              <Sidebar
                //  pass displayedPins for viewing, but originalPins for ID lookup
                pins={showMyPins ? filteredMyPins : []} 
                originalPins={allUserPins}
                friendsPins={showFriendsPins ? filteredFriendsPins : []}
                friendUsernames={friendUsernames}
                friendColors={friendColors}
                friendProfiles={friendProfiles}
                friendsLoading={friendsLoading}
                
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
              pins={showMyPins ? visibleMapPins : []}
              friendsPins={showFriendsPins ? visibleMapFriendsPins : []}
              friendUsernames={friendUsernames} // Map of user_id to username
              friendColors={friendColors}
              friendsLoading={friendsLoading}
              onClickOnMap={handleMapClick}
              mapAction={mapAction}
              sidebarOpen={sidebarOpen}
            />
          </div>
        );
      case "explore":
        return (
          <div className="explore-page-wrapper">
            <Explore
              onSpotyTeamFriendAdded={refreshFriendsPinsAndLabels}
              friendsDataVersion={friendsDataVersion}
            />
          </div>
        );
      case "profile":
        return (
          <Profile
            onUsernameSaved={() => setHeaderProfileTick((t) => t + 1)}
            onSpotyTeamFriendAdded={refreshFriendsPinsAndLabels}
            friendsDataVersion={friendsDataVersion}
          />
        );
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
        onOpenTutorialReplay={handleTutorialReplay}
        profileRefreshKey={headerProfileTick}
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

      {/* Global overlays — stay mounted for signed-in users; visibility is driven only by isOpen */}
      {userIdForUi ? (
        <TutorialOverlay
          isOpen={tutorialOpen}
          userId={userIdForUi}
          activeTab={activeTab}
          onClose={() => setTutorialOpen(false)}
          setActiveTab={setActiveTab}
          prepareHomeTutorialView={prepareHomeTutorialView}
          onSpotyTeamFriendAdded={refreshFriendsPinsAndLabels}
        />
      ) : null}

      <Footer />
    </div>
  );
}

export default App;
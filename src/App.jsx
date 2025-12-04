import { useState, useEffect, useMemo } from "react";
import Header from "./components/Header";
import Sidebar from "./components/sidebar";
import Map from "./components/map";
import AddSpotModal from "./components/AddSpotModal";
import Footer from "./components/Footer";
import Explore from "./components/Explore";
import Profile from "./components/Profile";
import About from "./components/About";

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
  const [sortOption, setSortOption] = useState("newest"); // "newest", "rating_high", "rating_low"
  const [showTop10, setShowTop10] = useState(false);
  // ----------------------------------------

  // 1. load Pins on startup
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("spotPins")) || [];
      setPins(saved);
    } catch (e) {
      console.error("Could not load pins", e);
    }
  }, []);

  // 2. save Pins (create or update)
  const handleSavePin = (newPin) => {
    if (editIndex !== null && editIndex >= 0 && editIndex < pins.length) {
      const updatedPins = pins.map((p, i) => (i === editIndex ? newPin : p));
      setPins(updatedPins);
      localStorage.setItem("spotPins", JSON.stringify(updatedPins));
    } else {
      const updatedPins = [...pins, newPin];
      setPins(updatedPins);
      localStorage.setItem("spotPins", JSON.stringify(updatedPins));
    }
    // reset edit state and close modal
    setEditIndex(null);
    setInitialPin(null);
    setIsModalOpen(false);
  };

  // 3. delete Pin
  const handleDeletePin = (index) => {
    if (!confirm("Are you sure you want to delete this spot?")) return;
    const updatedPins = pins.filter((_, i) => i !== index);
    setPins(updatedPins);
    localStorage.setItem("spotPins", JSON.stringify(updatedPins));
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

  // calculate Displayed Pins using useMemo ---
  const displayedPins = useMemo(() => {
    // create a copy so we don't mutate state directly
    let sorted = [...pins];

    // 1. Sort
    if (sortOption === "rating_high") {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortOption === "rating_low") {
      sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else {
      // newest first (reverse order)
      sorted.reverse(); 
    }

    // 2. filter Top 10
    if (showTop10) {
      // get the actual best rated for Top 10, regardless of sort option
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      return sorted.slice(0, 10);
    }

    return sorted;
  }, [pins, sortOption, showTop10]);
  // -------------------------------------

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="layout-full">
            <div className={`sidebar-wrapper ${!sidebarOpen ? "hidden" : ""}`}>
              <Sidebar
                //  pass displayedPins for viewing, but originalPins for ID lookup
                pins={displayedPins} 
                originalPins={pins} 
                
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
                
                // Pass new states
                sortOption={sortOption}
                setSortOption={setSortOption}
                showTop10={showTop10}
                setShowTop10={setShowTop10}
              />
            </div>

            <Map
              pins={displayedPins} // Map also shows filtered pins
              onClickOnMap={handleMapClick}
              mapAction={mapAction}
              sidebarOpen={sidebarOpen}
            />
          </div>
        );
      case "explore":
        return <Explore />;
      case "profile":
        return <Profile />;
      case "about":
        return <About />;
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
// src/App.jsx
import { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/sidebar";
import Map from "./components/map";
import AddSpotModal from "./components/AddSpotModal";
import Footer from "./components/Footer";

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
    // If pinIndex is provided, open the popup too
    if (pinIndex !== undefined && pinIndex !== null) {
      setMapAction({ type: "ZOOM_AND_POPUP", lat, lng, pinIndex });
    } else {
      setMapAction({ type: "ZOOM", lat, lng });
    }
  };

  const handleLocate = () => {
    setMapAction({ type: "LOCATE" });
  };

  return (
    <div className="app-container">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="layout-full">
        <div className={`sidebar-wrapper ${!sidebarOpen ? "hidden" : ""}`}>
          <Sidebar
            pins={pins}
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
          />
        </div>

        <Map
          pins={pins}
          onClickOnMap={handleMapClick}
          mapAction={mapAction}
          sidebarOpen={sidebarOpen}
        />
      </div>

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

      <Footer />
    </div>
  );
}

export default App;

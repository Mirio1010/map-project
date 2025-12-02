// src/App.jsx
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/sidebar';
import Map from './components/map';
import AddSpotModal from './components/AddSpotModal';

import './style.css';
import './cards.css';

function App() {
  const [pins, setPins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [mapAction, setMapAction] = useState(null);

  // 1. load Pins on startup
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("spotPins")) || [];
      setPins(saved);
    } catch (e) {
      console.error("Could not load pins", e);
    }
  }, []);

  // 2. save Pins
  const handleSavePin = (newPin) => {
    const updatedPins = [...pins, newPin];
    setPins(updatedPins);
    localStorage.setItem("spotPins", JSON.stringify(updatedPins));
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

  const handleZoom = (lat, lng) => {
    setMapAction({ type: 'ZOOM', lat, lng });
  };

  const handleLocate = () => {
    setMapAction({ type: 'LOCATE' });
  };

  return (
    <div className="app-container">
      <Header />
      
      <div className="layout-full">
        <Sidebar 
          pins={pins} 
          onDelete={handleDeletePin} 
          onZoom={handleZoom} 
          onAddSpot={() => { setClickedLocation(null); setIsModalOpen(true); }}
          onLocate={handleLocate}
        />
        
        <Map 
          pins={pins} 
          onClickOnMap={handleMapClick}
          mapAction={mapAction}
        />
      </div>

      <AddSpotModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSavePin}
        initialCoords={clickedLocation}
      />
    </div>
  );
}

export default App;
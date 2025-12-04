import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createPinIcon, createDefaultPinIcon } from "../utils/pinCategories";

const defaultPin = createDefaultPinIcon();

function ClickHandler({ onClickOnMap }) {
  useMapEvents({ click(e) { onClickOnMap(e.latlng); }, });
  return null;
}

function MapController({ mapAction, pins, sidebarOpen }) {
  const map = useMap();
  useEffect(() => {
    if (!mapAction) return;

    if (mapAction.type === "ZOOM") {
      map.flyTo([mapAction.lat, mapAction.lng], 16, { duration: 0.6 });
    }

    if (mapAction.type === "ZOOM_AND_POPUP") {
      map.flyTo([mapAction.lat, mapAction.lng], 16, { duration: 0.6 });
      setTimeout(() => {
        const markers = map._layers;
        // Search by location match instead of index to support sorting
        for (const key in markers) {
          if (markers[key] instanceof L.Marker) {
             const mLat = markers[key].getLatLng().lat;
             const mLng = markers[key].getLatLng().lng;
             // Check if this marker is close to the target
             if(Math.abs(mLat - mapAction.lat) < 0.00001 && Math.abs(mLng - mapAction.lng) < 0.00001) {
                 markers[key].openPopup();
                 break;
             }
          }
        }
      }, 700);
    }

    if (mapAction.type === "LOCATE") {
      map.locate({ setView: true, maxZoom: 16 });
      map.on("locationfound", (e) => {
        L.marker(e.latlng, { icon: defaultPin }).addTo(map).bindPopup("You are here").openPopup();
      });
    }
  }, [mapAction, map]);

  useEffect(() => {
    const timers = [setTimeout(() => map.invalidateSize(), 100), setTimeout(() => map.invalidateSize(), 300)];
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [sidebarOpen, map]);

  return null;
}

function Map({ pins, onClickOnMap, mapAction, sidebarOpen }) {
  
  // Helper for stars in popup
  const renderStars = (count) => {
    return (
      <div style={{ color: "#FFD700", fontSize: "16px", marginBottom: "6px" }}>
        {"★".repeat(count || 0)}{"☆".repeat(5 - (count || 0))}
      </div>
    );
  };

  return (
    <div className="right-pane" style={{ height: "100%", width: "100%" }}>
      <MapContainer 
      center={[40.7128, -74.006]} 
      zoom={12} 
      style={{ 
        height: "100%", 
        width: "100%" 
        }}>
        <TileLayer attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a>' url="https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=lxScjRx8ItyJXrWd3tbU" />

        <ClickHandler onClickOnMap={onClickOnMap} />
        <MapController mapAction={mapAction} pins={pins} sidebarOpen={sidebarOpen} />

        {pins.map((pin, index) => {
          const pinIcon = pin.category ? createPinIcon(pin.category) : defaultPin;
          return (
            <Marker key={index} position={[pin.lat, pin.lng]} icon={pinIcon}>
              <Popup>
                <div style={{ 
                  maxWidth: "220px", 
                  padding: "0" }}>
                  <div style={{ padding: "12px" }}>
                    <h3 style={{ 
                      margin: "0 0 4px 0", 
                      fontSize: "16px", 
                      fontWeight: "600", 
                      color: "#111827" }}>
                      {pin.name}
                    </h3>
                    
                    {/* SHOW RATING IN POPUP */}
                    {renderStars(pin.rating)}

                    {pin.images && pin.images.length > 0 && (
                      <div style={{ 
                        marginBottom: "10px", 
                        overflow: "hidden", 
                        borderRadius: "8px", 
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                        <img src={pin.images[0]} alt="spot" style={{ 
                          width: "100%", 
                          height: "auto", 
                          maxHeight: "250px", 
                          objectFit: "contain", 
                          display: "block" }} />
                      </div>
                    )}
                    {pin.description && (
                      <p style={{ 
                        margin: "0", 
                        fontSize: "13px", 
                        lineHeight: "1.5", 
                        color: "#6b7280" }}>
                        {pin.description}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default Map;

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createPinIcon, createDefaultPinIcon, createColoredPinIcon, categoryPinMap, defaultPinUrl } from "../utils/pinCategories";

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

function Map({ pins, friendsPins = [], friendUsernames = {}, friendColors = {}, onClickOnMap, mapAction, sidebarOpen }) {
  
  // Helper for stars in popup
  const renderStars = (count) => {
    return (
      <div style={{ color: "#FFD700", fontSize: "16px", marginBottom: "6px" }}>
        {"★".repeat(count || 0)}{"☆".repeat(5 - (count || 0))}
      </div>
    );
  };

  // Helper to format expiration time
  const formatExpirationTime = (expiresAt) => {
    if (!expiresAt) return null;
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return `${days} day${days > 1 ? 's' : ''} left`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m left`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m left`;
    } else {
      return "Expiring soon";
    }
  };

  return (
    <div className="right-pane" style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={[40.7128, -74.006]}
        zoom={12}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        {
          // OLD Maptiler api key. Leave here incase we want to switch to it. (There's a monthly quota)
        /* <TileLayer attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a>' url="https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=lxScjRx8ItyJXrWd3tbU" />
         */}

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        <ClickHandler onClickOnMap={onClickOnMap} />
        <MapController
          mapAction={mapAction}
          pins={pins}
          sidebarOpen={sidebarOpen}
        />

        {/* User's own pins */}
        {pins.map((pin, index) => {
          const pinIcon = pin.category
            ? createPinIcon(pin.category)
            : defaultPin;
          return (
            <Marker
              key={`user-${index}`}
              position={[pin.lat, pin.lng]}
              icon={pinIcon}
            >
              <Popup>
                <div
                  style={{
                    maxWidth: "220px",
                    padding: "0",
                  }}
                >
                  <div style={{ padding: "12px" }}>
                    <h3
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      {pin.name}
                    </h3>

                    {/* SHOW RATING IN POPUP */}
                    {renderStars(pin.rating)}

                    {pin.images && pin.images.length > 0 && (
                      <div
                        style={{
                          marginBottom: "10px",
                          overflow: "hidden",
                          borderRadius: "8px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        }}
                      >
                        <img
                          src={pin.images[0]}
                          alt="spot"
                          style={{
                            width: "100%",
                            height: "auto",
                            maxHeight: "250px",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                      </div>
                    )}
                    {pin.description && (
                      <p
                        style={{
                          margin: "0",
                          fontSize: "13px",
                          lineHeight: "1.5",
                          color: "#6b7280",
                        }}
                      >
                        {pin.description}
                      </p>
                    )}
                    {pin.address && (
                      <div
                        style={{
                          marginTop: "8px",
                          paddingTop: "8px",
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: "11px",
                            color: "#9ca3af",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          📍 Address
                        </p>
                        <p
                          style={{
                            margin: "0",
                            fontSize: "12px",
                            color: "#1fcece",
                            fontWeight: 500,
                          }}
                        >
                          {pin.address.split(",").slice(0, 2).join(", ")
                            .length > 40
                            ? `${pin.address
                                .split(",")
                                .slice(0, 2)
                                .join(", ")
                                .slice(0, 37)}…`
                            : pin.address.split(",").slice(0, 2).join(", ")}
                        </p>
                      </div>
                    )}
                    {pin.expires_at && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "4px 8px",
                          background: "rgba(255, 193, 7, 0.15)",
                          borderRadius: "4px",
                          fontSize: "11px",
                          color: "#ffc107",
                          fontWeight: "600",
                          border: "1px solid rgba(255, 193, 7, 0.3)",
                        }}
                      >
                        ⏰ {formatExpirationTime(pin.expires_at)}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Friends' pins */}
        {friendsPins.map((pin, index) => {
          const friendName = friendUsernames[pin.user_id] || "Friend";
          const friendColor = friendColors[pin.user_id] || "#1fcece";

          // Use colored pin icon that matches the friend's color
          const friendPinIcon = pin.category
            ? createColoredPinIcon(pin.category, friendColor)
            : createColoredPinIcon(null, friendColor);

          return (
            <Marker
              key={`friend-${index}`}
              position={[pin.lat, pin.lng]}
              icon={friendPinIcon}
              eventHandlers={{
                add: (e) => {
                  // Add custom class for friend marker
                  const markerElement = e.target.getElement();
                  if (markerElement) {
                    markerElement.classList.add("friend-marker");
                    markerElement.style.setProperty(
                      "--friend-color",
                      friendColor
                    );
                    markerElement.style.zIndex = "1001";
                  }
                },
              }}
            >
              <Popup>
                <div
                  style={{
                    maxWidth: "220px",
                    padding: "0",
                  }}
                >
                  <div style={{ padding: "12px" }}>
                    <div
                      style={{
                        marginBottom: "8px",
                        padding: "4px 8px",
                        background: `${friendColor}20`,
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: friendColor,
                        border: `1px solid ${friendColor}40`,
                      }}
                    >
                      👥 Shared by {friendName}
                    </div>
                    <h3
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      {pin.name}
                    </h3>

                    {/* SHOW RATING IN POPUP */}
                    {renderStars(pin.rating)}

                    {pin.images && pin.images.length > 0 && (
                      <div
                        style={{
                          marginBottom: "10px",
                          overflow: "hidden",
                          borderRadius: "8px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        }}
                      >
                        <img
                          src={pin.images[0]}
                          alt="spot"
                          style={{
                            width: "100%",
                            height: "auto",
                            maxHeight: "250px",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                      </div>
                    )}
                    {pin.description && (
                      <p
                        style={{
                          margin: "0",
                          fontSize: "13px",
                          lineHeight: "1.5",
                          color: "#6b7280",
                        }}
                      >
                        {pin.description}
                      </p>
                    )}
                    {pin.address && (
                      <div
                        style={{
                          marginTop: "8px",
                          paddingTop: "8px",
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: "11px",
                            color: "#9ca3af",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          📍 Address
                        </p>
                        <p
                          style={{
                            margin: "0",
                            fontSize: "12px",
                            color: "#1fcece",
                            fontWeight: 500,
                          }}
                        >
                          {pin.address.split(",").slice(0, 2).join(", ")
                            .length > 40
                            ? `${pin.address
                                .split(",")
                                .slice(0, 2)
                                .join(", ")
                                .slice(0, 37)}…`
                            : pin.address.split(",").slice(0, 2).join(", ")}
                        </p>
                      </div>
                    )}
                    {pin.expires_at && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "4px 8px",
                          background: "rgba(255, 193, 7, 0.15)",
                          borderRadius: "4px",
                          fontSize: "11px",
                          color: "#ffc107",
                          fontWeight: "600",
                          border: "1px solid rgba(255, 193, 7, 0.3)",
                        }}
                      >
                        ⏰ {formatExpirationTime(pin.expires_at)}
                      </div>
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

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const redPin = L.icon({
  iconUrl: '/Pin.png',       
  iconSize: [40, 50],       
  iconAnchor: [20, 50],
  popupAnchor: [-3, -76],
  shadowSize: [50, 64]
});
//stars helper
const renderStars = (rating) => {
  if (!rating) return null;
  return (
    <span style={{ color: '#FFD700'}}>{'★'.repeat(rating)}</span>
  );
};

// helper handle clicks on map
function ClickHandler({ onClickOnMap }) {
  useMapEvents({
    click(e) {
      onClickOnMap(e.latlng);
    },
  });
  return null;
}

// helper handle zoom/Locate Actions
function MapController({ mapAction }) {
  const map = useMap();
  useEffect(() => {
    if (!mapAction) return;
    
    if (mapAction.type === 'ZOOM') {
      map.flyTo([mapAction.lat, mapAction.lng], 16, { duration: 0.6 });
    }
    
    if (mapAction.type === 'LOCATE') {
      map.locate({ setView: true, maxZoom: 16 });
      map.on("locationfound", (e) => {
        L.marker(e.latlng).addTo(map).bindPopup("You are here").openPopup();
      });
    }
  }, [mapAction, map]);
  return null;
}

function Map({ pins, onClickOnMap, mapAction }) {
  return (
    <div className="right-pane" style={{ height: '100%', width: '100%' }}>
      <MapContainer center={[40.7128, -74.0060]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
          url="https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=lxScjRx8ItyJXrWd3tbU"
        />

        <ClickHandler onClickOnMap={onClickOnMap} />
        <MapController mapAction={mapAction} />

        {pins.map((pin, index) => (
          <Marker key={index} position={[pin.lat, pin.lng]} icon={redPin}>
            <Popup>
              <div style={{ maxWidth: '200px' }}>
                <strong style={{ fontSize: '15px' }}>{pin.name}</strong>
              {/* show stars here */}
              {pin.rating>0 && <div>{renderStars(pin.rating)}</div>}
                {pin.images && pin.images.length > 0 && (
                  <img 
                    src={pin.images[0]} 
                    alt="spot" 
                    style={{ width: '100%', height: 'auto', borderRadius: '6px', marginTop: '5px', objectFit: 'cover' }} 
                  />
                )}
                {pin.description && <div style={{ marginTop: '5px', fontSize: '13px' }}>{pin.description}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;
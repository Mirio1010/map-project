import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapPane({ pins = [] }) {
    const defaultCenter = [40.7128, -74.006]; // default coordinates

    
    return (
        <section className="right-pane">
            <MapContainer
                center={defaultCenter}      // default map center
                zoom={13}
                style={{ width: "100%", height: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {pins.map((pos, idx) => (
                    <Marker position={defaultCenter}>
                        <Popup>Default location</Popup>
                    </Marker>
                ))}
            </MapContainer>
        </section>
    );
}
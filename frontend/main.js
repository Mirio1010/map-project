
// tabs 
const tabs = document.querySelectorAll('.tabs [role="tab"]');
tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach((b) => b.setAttribute("aria-selected", "false"));
    btn.setAttribute("aria-selected", "true");
  });
});

// adding map to page

var map = L.map("map").setView([0, 0], 1);
L.tileLayer(
  "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=lxScjRx8ItyJXrWd3tbU",
  {
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  }
).addTo(map);



const btnLocate = document.getElementById("btn-locate");
const locStatus = document.getElementById("loc-status");

// AI written code below-------------------------------------------------------------------

btnLocate.addEventListener("click", () => {
  locStatus.textContent = "Requesting location…";
  // Leaflet’s built-in geolocation helper
  map.locate({
    setView: true, // recenters the map
    maxZoom: 16, // reasonable city-level zoom
    enableHighAccuracy: true, // use GPS if available
    timeout: 10000, // give up after 10s
    watch: false, // one-shot; set true if you want continuous tracking
  });
});

map.on("locationfound", (e) => {
  locStatus.textContent = `Location found (±${Math.round(e.accuracy)} m).`;
  // Optional visuals:
  const radius = e.accuracy;
  L.marker(e.latlng).addTo(map).bindPopup("You are here").openPopup();
  L.circle(e.latlng, { radius }).addTo(map);
});

map.on("locationerror", (e) => {
  locStatus.textContent = `Location error: ${e.message}`;
});


map.locate({
  setView: true, 
  maxZoom: 14, 
  enableHighAccuracy: true,
});


map.on("locationfound", (e) => {
  const radius = e.accuracy;
  L.marker(e.latlng).addTo(map).bindPopup("You are here").openPopup();
  L.circle(e.latlng, { radius }).addTo(map);
});


map.on("locationerror", (e) => {
  console.warn("Location access denied or unavailable:", e.message);
  map.setView([40.7128, -74.006], 12);
});

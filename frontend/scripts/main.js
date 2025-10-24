// tabs 
const tabs = document.querySelectorAll('.tabs [role="tab"]');
tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach((b) => b.setAttribute("aria-selected", "false"));
    btn.setAttribute("aria-selected", "true");
  });
});



//map initialization

var map = L.map("map").setView([0,0],1);
L.tileLayer(
  "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=lxScjRx8ItyJXrWd3tbU",
  {
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  }
).addTo(map);

// Overriding leaflets default pin to a custom one. (All images should be stored in separate folder, current folder structure is temporary)
L.Marker.prototype.options.icon = L.icon({
  iconUrl: 'Pin.png',       // image that will be used
  iconSize: [40, 50],       
  iconAnchor: [20, 50],
  popupAnchor: [-3, -76],
  shadowSize: [50, 64]
})

const btnLocate = document.getElementById("btn-locate");
const locStatus = document.getElementById("loc-status");

//-------------------------------------------------------------------------------------------------
// Make map and icon accessible elsewhere
window.map = map;// This is necessary for keeping a registry of all the pins saved on local storage. This allows the cards on the left content area.

// Keep a registry of markers keyed by lat/lng (fixed to 6 decimals for consistency)
window.pinMarkers = new Map();
window.pinKey = (lat, lng) => `${lat.toFixed(6)},${lng.toFixed(6)}`;



// AI written code below-------------------------------------------------------------------

let myMarker = null; 
let myCircle = null;

function locateMe() {
  if (locStatus) locStatus.textContent = 'Requesting location…';
  map.locate({
    setView: true,
    maxZoom: 16,
    enableHighAccuracy: true,
    timeout: 10000,
    watch: false,
  });
}

// Single handler: location found
map.on('locationfound', (e) => {
  if (locStatus) locStatus.textContent = `Location found (±${Math.round(e.accuracy)} m).`;
 // const radius = e.accuracy; // define it if you draw the circle

  // remove previous visuals (avoid stacking)
  if (myMarker) map.removeLayer(myMarker);
  if (myCircle) map.removeLayer(myCircle);

  myMarker = L.marker(e.latlng).addTo(map).bindPopup('You are here').openPopup();
  myCircle = L.circle(e.latlng, { radius }).addTo(map);
});

// Single handler: location error
map.on('locationerror', (e) => {
  if (locStatus) locStatus.textContent = `Location error: ${e.message}`;
  console.warn('Location access denied or unavailable:', e.message);
  map.setView([40.7128, -74.0060], 12); // fallback (NYC)
});

// Button triggers re-locate
btnLocate?.addEventListener('click', locateMe);

// AUTO locate once after map is initialized
locateMe();

//---------------------------------------------------------------------------------------------------------------------------------

//This is the logic of adding custom pins (Need implementation of marking a pin in order to join them together, not doing anything right now)  
var LeafIcon = L.Icon.extend({
    options: { 
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50],
    }
});
var redPin = new LeafIcon({ iconUrl: "Pin.png" });
//-------------------------------------------------------------------------------------------------------------------------------------

// task 4 - click to add a bathroom pin and save it 
// once user click on map a popup form to save a new bathroom pin opens
map.on('click', clickOnMap);

function clickOnMap(e){
  CreatePin(e.latlng);
}
// create marker
function CreatePin(latlng) {
  const pinPopup = `
    <form>  <strong> New spot to add </strong><br><br>
      <label for="pinName">Name of spot:</label>
      <input type="text" id="pinName" name="pinName"><br><br>
      <button type="button" onclick="savePin(${latlng.lat}, ${latlng.lng})">Save spot</button>
    </form>`;

  L.marker(latlng, { icon: redPin })
    .addTo(map)
    .bindPopup(pinPopup)
    .openPopup();
}

// save pin to localstorage and add marker to map
function savePin(lat, lng) {
  const pinName = document.getElementById("pinName").value;
  if (!pinName) {
    alert("Please enter a name for the pin.");
    return;
  }
  const newPin = { name: pinName, lat: lat, lng: lng };
  const pins = JSON.parse(localStorage.getItem("bathroomPins")) || [];
  pins.push(newPin);
  localStorage.setItem("bathroomPins", JSON.stringify(pins));

  map.closePopup();
  alert("Pin saved successfully! ✨");

  const marker = L.marker([lat, lng], { icon: redPin })
    .addTo(map)
    .bindPopup(`<strong>${pinName}</strong>`);

  // register marker for later removal
  window.pinMarkers.set(window.pinKey(lat, lng), marker);

 
  window.renderPinCards && window.renderPinCards();
}

// load pins from localStorage on page load
function loadPins(){
  const pins = JSON.parse(localStorage.getItem("bathroomPins")) || [];
  pins.forEach((pin) => {
    L.marker([pin.lat, pin.lng], {icon: redPin}).addTo(map).bindPopup(`<strong>${pin.name}</strong>`);
  });

  pins.forEach((pin) => {
  const marker = L.marker([pin.lat, pin.lng], { icon: redPin })
    .addTo(map)
    .bindPopup(`<strong>${pin.name}</strong>`);

  window.pinMarkers.set(window.pinKey(pin.lat, pin.lng), marker);
});
}
loadPins();






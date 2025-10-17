// tabs 
const tabs = document.querySelectorAll('.tabs [role="tab"]');
tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach((b) => b.setAttribute("aria-selected", "false"));
    btn.setAttribute("aria-selected", "true");
  });
});

// adding map to page

//map initialization

var map = L.map("map").setView([40.7128, -74.006], 12);
L.tileLayer(
  "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=lxScjRx8ItyJXrWd3tbU",
  {
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  }
).addTo(map);

// This is the logic of adding custom pins (Need implementation of marking a pin in order to join them together, not doing anything right now)  
var LeafIcon = L.Icon.extend({
    options: { 
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50],
    }
});
var redPin = new LeafIcon({iconUrl: 'Pin.png'});

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



// AI written code below-------------------------------------------------------------------

btnLocate.addEventListener("click", () => {
  locStatus.textContent = "Requesting location…";
  map.locate({ setView: true, maxZoom: 16 });
  // Leaflet’s built-in geolocation helper
  map.locate({
    setView: true, // recenters the map
    maxZoom: 16, // reasonable city-level zoom
    enableHighAccuracy: true, // use GPS if available
    timeout: 10000, // give up after 10s
    watch: false, // one-shot; set true if you want continuous tracking
  });
});


// Function if location is found 
map.on("locationfound", (e) => {
  locStatus.textContent = `Location found (±${Math.round(e.accuracy)} m).`;
  // Optional visuals:
  // const radius = e.accuracy;
  L.marker(e.latlng).addTo(map).bindPopup("You are here").openPopup();
  L.circle(e.latlng, { radius }).addTo(map);
});

// Function if location is not found
map.on("locationerror", (e) => {
  locStatus.textContent = `Location error: ${e.message}`;
  console.warn("Location access denied or unavailable:", e.message);
});


// ----------------------------------------------------------------------------------------------------
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

L.marker([51.5, -0.09], {icon: Pin}).addTo(map).bindPopup("I am a pin.");



//task 4 ----------------------------------------------------------------------------------------
map.on('click', clickOnMap);

// when user click on map this must run
function clickOnMap(e){
  CreateMarker(e.latlng);
}

//create new marker
function CreateMarker(latlng) {
  // The html part here is because the lat and lng are variables
  // so I can't implement it inside the html file
  const pinPopup = `
    <form>  <strong> New Bathroom to add </strong><br><br>
      <label for="pinName">Bathroom Name:</label>
      <input type="text" id="pinName" name="pinName"><br><br>
      <button type="button" onclick="savePin(${latlng.lat}, ${latlng.lng})">Save Bathroom</button>
    </form>`;

  L.marker(latlng, { icon: redPin })
    .addTo(map)
    .bindPopup(pinPopup)
    .openPopup();
}

// save pin function
function savePin(lat, lng){
  const pinName = document.getElementById("pinName").value;
  if(!pinName){
    alert("Please enter a name for the pin.");
    return;
  }
  const newPin={ name: pinName, lat: lat, lng: lng };
  const pins = JSON.parse(localStorage.getItem("bathroomPins")) || [];
  pins.push(newPin);
  localStorage.setItem("bathroomPins", JSON.stringify(pins));
  map.closePopup();
  alert('Pin saved successfully! ✨');
  L.marker([lat, lng], {icon: redPin}).addTo(map).bindPopup(`<strong>${pinName}</strong>`);
}
function loadPins(){
  const pins = JSON.parse(localStorage.getItem("bathroomPins")) || [];
  pins.forEach((pin) => {
    L.marker([pin.lat, pin.lng], {icon: redPin}).addTo(map).bindPopup(`<strong>${pin.name}</strong>`);
  });
}
loadPins();
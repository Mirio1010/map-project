// tabs 
const tabs = document.querySelectorAll('.tabs [role="tab"]');
tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach((b) => b.setAttribute("aria-selected", "false"));
    btn.setAttribute("aria-selected", "true");
  });
});


//map initialization
/* -------------------------------------------------------------------------------------------------------------------
The code in this section is for the tileLayer of the map. The tileLayer is responsible for setting how the map looks using the MapTiler API. If you want a different style, replace the 'STYLE' variable to any of the options below.
*/
const MAPTILER_KEY = "lxScjRx8ItyJXrWd3tbU";

var map = L.map("map").setView([0,0],1);
//A new map is blank. This line adds the picture of the streets (the "tiles") from the company MapTiler.
// choose one style name: 'streets', 'bright-v2', 'pastel', 'darkmatter', 'satellite', etc.
const STYLE = "pastel"; // try 'streets' or 'pastel' or 'darkmatter'

// MapTiler tile URL (works for the built-in style names)
const tileUrl = `https://api.maptiler.com/maps/${STYLE}/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;
const tileAttrib = '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; OpenStreetMap contributors';

L.tileLayer(tileUrl, {
  attribution: tileAttrib,
  maxZoom: 20,
  tileSize: 512,
  zoomOffset: -1,
  detectRetina: true
}).addTo(map);
//---------------------------------------------------------------------------------------------------------------------------------------



// Overriding leaflets default pin to a custom one. (All images should be stored in separate folder, current folder structure is temporary)
L.Marker.prototype.options.icon = L.icon({
  iconUrl: 'Pin.png',       // image that will be used
  iconSize: [40, 50],       
  iconAnchor: [20, 50],
  popupAnchor: [-3, -76],
  shadowSize: [50, 64]
})
//this code controls the "Locate me" button.
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

//this function asks web browser "Where is the user right now?"
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
//if the browser finds users location this code runs it puts a marker and a blue circle on users spot.
map.on('locationfound', (e) => {
  if (locStatus) locStatus.textContent = `Location found (±${Math.round(e.accuracy)} m).`;
 // const radius = e.accuracy; // define it if you draw the circle

  // remove previous visuals (avoid stacking)
  if (myMarker) map.removeLayer(myMarker);
  if (myCircle) map.removeLayer(myCircle);

  myMarker = L.marker(e.latlng).addTo(map).bindPopup('You are here').openPopup();
 
});

// Single handler: location error
//if the browser cannot find your location example clicking block. this code runs.sets the map view to New York City.
map.on('locationerror', (e) => {
  if (locStatus) locStatus.textContent = `Location error: ${e.message}`;
  console.warn('Location access denied or unavailable:', e.message);
  map.setView([40.7128, -74.0060], 12); // fallback (NYC)
});

// Button triggers re-locate
//this connects the button to the function. means when someone clicks the 'btn-locate' button, run the locateMe function.
btnLocate?.addEventListener('click', locateMe);

// AUTO locate once after map is initialized
//this line runs the function one time automatically when the page first loads.
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

//if anyone clicks anywhere on the map run this function
function clickOnMap(e){
  CreatePin(e.latlng);
}
// create marker

function CreatePin(latlng) {
  const formId=`form-${latlng.lat}-${latlng.lng}`;
  const inputId=`pinName-${latlng.lat}-${latlng.lng}`;
  const descId=`pinDesc-${latlng.lat}-${latlng.lng}`;
  const imgId=`pinImg-${latlng.lat}-${latlng.lng}`;

  const pinPopup=`
    <form id="${formId}" style="min-width: 200px;" max-height: 300px; overflow-y: auto;padding-right: 5px;">
    <strong> New Location to add</strong><br><br>
    <label for="${inputId}">Location Name:</label><br>
    <input type="text" id="${inputId}" name="pinName" style="width: 100%;margin-bottom:10px;"><br><br>
    <label for="${descId}">Description:</label>
    <textarea id="${descId}" name="pinDesc" rows="2" style="width: 100%;margin-bottom:10px;"></textarea><br><br>
    <label for="${imgId}">Image:</label>
    <input type="file" id="${imgId}" name="pinImg" accept="image/*" multiple style="width: 100%;margin-bottom:10px;"><br>
    <div id="pin-error" style="color: red; front-size: 12px;margin-bottom:10px;"></div>
    <button type="button" onclick="savePin(${latlng.lat}, ${latlng.lng}, '${inputId}', '${descId}', '${imgId}')">Save location spot</button>
    </form>`;
  L.popup({maxWidth: 250})
    .setLatLng(latlng)
    .setContent(pinPopup)
    .openOn(map);
}
//helper function to read multiple images files as data urls
//@parm {FileList} file list from input type file
//@return {Promise<string[]>} array of data url strings

function readImageFilesAsDataUrls(fileList) {
  const filePromises=[];
  const files=Array.from(fileList).slice(0,5); // limit to 5 files
  for(const file of files){
    if(!file.type.startsWith('image/')) continue; // skip non-image files
    if(file.size > 5 * 1024 * 1024) continue; // skip files larger than 5MB
    const promise=new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>{
        resolve(reader.result);
      };
      reader.onerror=reject;
      reader.readAsDataURL(file);
    });
    filePromises.push(promise);
  }
  return Promise.all(filePromises);//return one promise
}


// save pin to localstorage and add marker to map
async function savePin(lat, lng,inputId,descId,imgId) {
  //get form elements by id
  const nameInput = document.getElementById(inputId);
  const descInput = document.getElementById(descId);
  const imgInput = document.getElementById(imgId);
  //get values from form elements

  const name=nameInput.value.trim();//remove extra spaces
  const description=descInput.value.trim();//remove extra spaces
  const files=imgInput.files;//get files from input
  //validate the name
  if (!name) {
    const errorDiv=nameInput.closest("form").querySelector("#pin-error");
    if(errorDiv){
      errorDiv.textContent=" Please enter spot name. ";
    }
    else{
      alert("Please enter a name for the spot.");
    }
    
    return;
  }
  //read image files
  const images= await readImageFilesAsDataUrls(files);
  //build pin object
  const newPin={
    name,
    lat,
    lng,
    description,
    images,
  };
//save to local storage

  const pins = JSON.parse(localStorage.getItem("spotPins")) || [];
  pins.push(newPin);
  localStorage.setItem("spotPins", JSON.stringify(pins));

  map.closePopup();
  //create the marker


  const popupHtml =`<strong>${name}</strong><br>
  ${description ? `<br>${description}` : ""}
  ${(images && images[0])? `<br><img src="${images[0]}" alt="preview" style="width:100px; max-height:automargin-top:5px;" />` : ""}`;
  const marker = L.marker([lat, lng], { icon: redPin })
    .addTo(map)
    .bindPopup(popupHtml);

  // register marker for later removal
  window.pinMarkers.set(window.pinKey(lat, lng), marker);
  if(window.renderPinCards){
    window.renderPinCards();
  }
  else{
    location.reload();
  }
}

// load pins from localStorage on page load
function loadPins() {
  const pins = JSON.parse(localStorage.getItem("spotPins")) || [];
  pins.forEach((pin) => {
    const popupParts = [`<strong>${pin.name}</strong>`];
    if (pin.displayName)
      popupParts.push(
        `<div style="font-size:12px;color:#6b7280;">${pin.displayName}</div>`
      );
    if (pin.description)
      popupParts.push(`<div style="margin-top:6px;">${pin.description}</div>`);
    if (pin.images && pin.images.length)
      popupParts.push(
        `<div style="margin-top:6px;"><img src="${pin.images[0]}" alt="img" style="max-width:200px; max-height:140px; object-fit:cover; border-radius:6px;" /></div>`
      );

    const marker = L.marker([pin.lat, pin.lng], { icon: redPin })
      .addTo(map)
      .bindPopup(popupParts.join(""));

    window.pinMarkers.set(window.pinKey(pin.lat, pin.lng), marker);
  });
}
loadPins();






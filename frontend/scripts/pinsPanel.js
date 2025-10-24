/*
pinsPanel.js
  ---------------------------------------------------------------
  This JavaScript file controls everything related to the cards
  displayed in the left-side panel. It:
    • Reads all saved pins from localStorage ("bathroomPins")
    • Dynamically creates and displays a card for each pin
    • Reverse-geocodes latitude/longitude to show a readable address
    • Handles user actions like “Zoom” (centers the map) and “Delete”
    • Keeps the map and storage in sync (removing pins and markers)
 
 * Essentially, this file is one self-contained module that manages
   the sidebar view of pins and how it interacts with the Leaflet map. 
 
   It has some AI generated code to make my life easier, keep in mind there might be bugs.
   @author - Miguelangel Ortega 
*/
(function () {
  const STORAGE_KEY = "bathroomPins";
  const cardsEl = document.getElementById("pin-cards");

  // Utilities
  const loadPins = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  };
  const savePins = (pins) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  const escapeHtml = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function reverseGeocode(lat, lon) {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.search = new URLSearchParams({
      format: "jsonv2",
      lat,
      lon,
      addressdetails: "1",
    }).toString();
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Spot project (educational)",
      },
    });
    if (!res.ok) throw new Error("reverse geocode failed");
    const data = await res.json();
    return data.display_name || "Address unavailable";
  }

  // Renders the cards and resolves missing addresses
  async function renderPinCards() {
    let pins = loadPins();

    // Paint UI
    cardsEl.innerHTML = pins
      .map((pin, idx) => {
        const name = pin.name || "Untitled pin";
        const addr = pin.address || "Resolving address…";
        return `
        <article class="pin-card" data-index="${idx}">
          <div class="pin-row">
            <h3 title="${escapeHtml(name)}">${escapeHtml(name)}</h3>
          </div>
          <p class="addr">${escapeHtml(addr)}</p>
          <div class="pin-actions">
            <button data-action="zoom">Zoom</button>
            <button data-action="delete">Delete</button>
          </div>
        </article>
      `;
      })
      .join("");

    // For pins missing address, resolve & cache one-by-one (gentle on API)
    for (let i = 0; i < pins.length; i++) {
      const pin = pins[i];
      if (
        !pin.address &&
        Number.isFinite(pin.lat) &&
        Number.isFinite(pin.lng)
      ) {
        try {
          pin.address = await reverseGeocode(pin.lat, pin.lng);
          pins[i] = pin;
          savePins(pins);
          const addrEl = cardsEl.querySelector(
            `.pin-card[data-index="${i}"] .addr`
          );
          if (addrEl) addrEl.textContent = pin.address || "Address unavailable";
        } catch {
          // leave placeholder if it fails
        }
        await sleep(300);
      }
    }
  }

  // Card interactions: zoom + delete
  cardsEl.addEventListener("click", (e) => {
    const card = e.target.closest(".pin-card");
    if (!card) return;
    const idx = Number(card.dataset.index);
    const pins = loadPins();
    const pin = pins[idx];
    if (!pin) return;

    const action = e.target.closest("button")?.dataset?.action || "zoom";
    if (action === "zoom") {
      if (window.map && Number.isFinite(pin.lat) && Number.isFinite(pin.lng)) {
        window.map.flyTo([pin.lat, pin.lng], 16, { duration: 0.6 });
        // open popup if you added one in load/save:
        // find a marker at that lat/lng and open its popup (simple approach):
        setTimeout(() => {
          // try to add a marker if not there already; otherwise just bind/open
          L.marker([pin.lat, pin.lng], { icon: window.redPin })
            .addTo(window.map)
            .bindPopup(`<strong>${escapeHtml(pin.name || "")}</strong>`)
            .openPopup();
        }, 200);
      }
    } else if (action === "delete") {
      if (!confirm(`Delete pin "${pin.name || "Untitled"}"?`)) return;

      // 1) Remove marker from map if present
      const key = window.pinKey
        ? window.pinKey(pin.lat, pin.lng)
        : `${(+pin.lat).toFixed(6)},${(+pin.lng).toFixed(6)}`;
      const marker = window.pinMarkers?.get(key);
      if (marker) {
        window.map.removeLayer(marker);
        window.pinMarkers.delete(key);
      }

      // 2) Remove from storage and re-render
      pins.splice(idx, 1);
      savePins(pins);
      location.reload();
    }
  });

  // Expose a manual refresher so you can call it after saving new pins.
  window.renderPinCards = renderPinCards;

  // Initial paint
  document.addEventListener("DOMContentLoaded", renderPinCards);
})();

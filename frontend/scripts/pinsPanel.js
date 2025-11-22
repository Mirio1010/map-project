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
  const STORAGE_KEY = "spotPins";
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
    <div class="pin-row" style="display:flex; gap:8px; align-items:center;">
      ${
        pin.images && pin.images.length
          ? `<img src="${pin.images[0]}" alt="thumb" style="width:72px;height:56px;object-fit:cover;border-radius:6px;border:1px solid #eee;" />`
          : `<div style="width:72px;height:56px;border-radius:6px;background:#f3f4f6;border:1px dashed #e5e7eb;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px;">No image</div>`
      }
      <div style="flex:1;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <h3 title="${escapeHtml(
            name
          )}" style="margin:0;font-size:15px;">${escapeHtml(name)}</h3>
        </div>
        <p class="addr" style="margin:6px 0 0 0; color:#6b7280; font-size:13px;">${escapeHtml(
          addr
        )}</p>
        ${
          pin.description
            ? `<p style="margin:6px 0 0 0; font-size:13px; color:#111827;">${escapeHtml(
                pin.description
              )}</p>`
            : ""
        }
      </div>
    </div>
    <div class="pin-actions" style="margin-top:8px;">
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
        // center / fly to the spot
        window.map.flyTo([pin.lat, pin.lng], 16, { duration: 0.6 });

        // small delay so map animation starts before popup opens
        setTimeout(() => {
          try {
            // compute the same key you use elsewhere
            const key = window.pinKey
              ? window.pinKey(pin.lat, pin.lng)
              : `${(+pin.lat).toFixed(6)},${(+pin.lng).toFixed(6)}`;

            // ensure map of markers exists
            window.pinMarkers = window.pinMarkers || new Map();
            let marker = window.pinMarkers.get(key);

            // choose image (first image or placeholder)
            const imgUrl =
              pin.images && pin.images.length
                ? pin.images[0]
                : "/images/placeholder.png";

            // sanitize URL and text via escapeHtml already defined in this module
            const safeUrl = escapeHtml(imgUrl);
            const safeName = escapeHtml(pin.name || "");
            const safeDesc = escapeHtml(pin.description || "");

            const content = `
            <div style="max-width:260px">
              <h3 style="margin:0 0 .4rem;font-size:15px;">${safeName}</h3>
              <img
                src="${safeUrl}"
                alt="${safeName}"
                style="width:200px;height:150px;object-fit:cover;border-radius:6px;margin-bottom:.4rem;border:1px solid #eee;"
                onerror="this.src='/images/placeholder.png'; this.onerror=null;"
              />
              ${
                safeDesc
                  ? `<p style="margin:0;font-size:13px;color:#111827;">${safeDesc}</p>`
                  : ""
              }
            </div>
          `;

            if (marker) {
              // if marker already has a popup, update it; otherwise bind one
              if (marker.getPopup && marker.getPopup()) {
                marker.getPopup().setContent(content);
              } else {
                marker.bindPopup(content);
              }
              marker.openPopup();
            } else {
              // create marker and store it so future clicks reuse it
              marker = L.marker([pin.lat, pin.lng], { icon: window.redPin })
                .addTo(window.map)
                .bindPopup(content)
                .openPopup();

              window.pinMarkers.set(key, marker);
            }
          } catch (err) {
            // silent fail — still better than breaking UI
            console.warn("Failed to open popup with image", err);
          }
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

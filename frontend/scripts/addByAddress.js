
/* What is this JS file for?

   -This file is contains all javascript code for adding a spot on the map by typing an address. It essentially make the "+add spot" button work! This file contains just a single function called "initAddByAddress". It is very long. 

How does it do it?

It does it by creating a floating UI element (called a modal) that appears on the page when you click on the "add spot" button. It does this utilizing the DOM and it's method "createElement". When this floating space appears, you're able to add a spot by typing the address of the place.

*/ 





(function initAddByAddress() {
  // --- Create a small floating modal (pure JS, no external CSS) ---
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed; inset: 0; display: none; align-items: center; justify-content: center; 
    background: rgba(0,0,0,0.25); z-index: 9999; font-family: system-ui, sans-serif;
  `;
  modal.innerHTML = `
    <div id="addr-card" style="
      width: min(520px, 92vw); background:#fff; border:1px solid #e5e7eb; border-radius:12px; 
      box-shadow: 0 10px 30px rgba(0,0,0,0.15); padding:14px 14px 12px 14px;
    ">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px;">
        <strong>Add Spot by Address</strong>
        <button type="button" id="addr-close" style="border:1px solid #e5e7eb; background:#f9fafb; padding:6px 10px; border-radius:8px; cursor:pointer;">✕</button>
      </div>
      <form id="addr-form" style="display:grid; gap:8px;">
        <label style="display:grid; gap:6px;">
          <span style="font-size:12px; color:#6b7280;">Place name (optional)</span>
          <input id="addr-name" type="text" placeholder="e.g., Joe’s Coffee" 
                 style="padding:10px; border:1px solid #d1d5db; border-radius:8px;" />
        </label>
        <label style="display:grid; gap:6px;">
          <span style="font-size:12px; color:#6b7280;">Address</span>
          <input id="addr-input" type="text" required
                 placeholder="e.g., 1600 Pennsylvania Ave NW, Washington, DC"
                 style="padding:10px; border:1px solid #d1d5db; border-radius:8px;" />
        </label>
        <div id="addr-hint" style="min-height:18px; font-size:12px; color:#6b7280;"></div>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button type="button" id="addr-cancel" style="border:1px solid #e5e7eb; background:#f3f4f6; padding:8px 12px; border-radius:8px; cursor:pointer;">Cancel</button>
          <button type="submit" id="addr-submit" style="border:1px solid #d1d5db; background:#111827; color:#fff; padding:8px 12px; border-radius:8px; cursor:pointer;">Add Spot</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const form = modal.querySelector("#addr-form");
  const input = modal.querySelector("#addr-input");
  const nameInput = modal.querySelector("#addr-name");
  const hint = modal.querySelector("#addr-hint");
  const btnClose = modal.querySelector("#addr-close");
  const btnCancel = modal.querySelector("#addr-cancel");
  const btnSubmit = modal.querySelector("#addr-submit");
  const card = modal.querySelector("#addr-card");

  function openModal() {
    hint.textContent = "";
    input.value = "";
    nameInput.value = "";
    modal.style.display = "flex";
    setTimeout(() => input.focus(), 0);
  }
  function closeModal() {
    modal.style.display = "none";
  }

  // Wire up your existing left-panel button
  const trigger = document.getElementById("add-spot-btn");
  if (trigger) {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  } else {
    console.warn("[AddByAddress] #add-spot-btn not found.");
  }

  // Close interactions
  btnClose.onclick = btnCancel.onclick = closeModal;
  // backdrop click (ignore clicks on the card)
  modal.addEventListener("click", (e) => {
    if (!card.contains(e.target)) closeModal();
  });
  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display !== "none") closeModal();
  });

  // Geocode helper
  async function geocode(address) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", address);
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) throw new Error("Geocoding request failed");
    const data = await res.json();
    return data[0] || null;
  }

  // Submit: geocode → add marker → save → flyTo
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const addrStr = input.value.trim();
    if (!addrStr) return;

    btnSubmit.disabled = true;
    hint.style.color = "#6b7280";
    hint.textContent = "Searching…";

    try {
      const match = await geocode(addrStr);
      if (!match) {
        hint.style.color = "#b91c1c";
        hint.textContent = "No results. Try a more specific address.";
        return;
      }

      const lat = parseFloat(match.lat);
      const lng = parseFloat(match.lon);
      const displayName = match.display_name || addrStr;
      const pinName = nameInput.value.trim() || displayName;

      // Save to your existing storage
      const pins = JSON.parse(localStorage.getItem("bathroomPins")) || [];
      pins.push({ name: pinName, lat, lng });
      localStorage.setItem("bathroomPins", JSON.stringify(pins));

      // Add marker using your icon
      L.marker([lat, lng], { icon: redPin })
        .addTo(map)
        .bindPopup(
          `<strong>${pinName}</strong><br/><small>${displayName}</small>`
        )
        .openPopup();

      map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
      closeModal();
    } catch (err) {
      console.error(err);
      hint.style.color = "#b91c1c";
      hint.textContent = "Error adding spot. Please try again.";
    } finally {
      btnSubmit.disabled = false;
    }
    location.reload();
  });

 
})();





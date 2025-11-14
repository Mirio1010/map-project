
/* What is this JS file for?

   -This file is contains all javascript code for adding a spot on the map by typing an address. It essentially make the "+add spot" button work! This file contains just a single function called "initAddByAddress". It is very long. 

How does it do it?

It does it by creating a floating UI element (called a modal) that appears on the page when you click on the "add spot" button. It does this utilizing the DOM and it's method "createElement". When this floating space appears, you're able to add a spot by typing the address of the place.

*/ 




function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
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

      <!-- NEW description -->
      <label style="display:grid; gap:6px;">
        <span style="font-size:12px; color:#6b7280;">Description (optional)</span>
        <textarea id="addr-desc" rows="3" placeholder="Add a short description..." style="padding:8px; border:1px solid #d1d5db; border-radius:8px;"></textarea>
      </label>

      <!-- NEW images input -->
      <label style="display:grid; gap:6px;">
        <span style="font-size:12px; color:#6b7280;">Images (optional, up to 5)</span>
        <input id="addr-images" type="file" accept="image/*" multiple />
      </label>

      <!-- preview area -->
      <div id="addr-image-preview" style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;"></div>

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

//---------------------CHATGPT----------------------------------
const descInput = modal.querySelector("#addr-desc");
const imagesInput = modal.querySelector("#addr-images");
const imagePreview = modal.querySelector("#addr-image-preview");

const MAX_IMAGES = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
let selectedImageDataUrls = [];


imagesInput.addEventListener("change", (ev) => {
  hint.textContent = "";
  const files = Array.from(ev.target.files || []);
  for (const f of files) {
    if (selectedImageDataUrls.length >= MAX_IMAGES) {
      hint.style.color = "#b91c1c";
      hint.textContent = `Max ${MAX_IMAGES} images allowed.`;
      break;
    }
    if (!f.type.startsWith("image/")) {
      hint.style.color = "#b91c1c";
      hint.textContent = "Only image files allowed.";
      continue;
    }
    if (f.size > MAX_SIZE_BYTES) {
      hint.style.color = "#b91c1c";
      hint.textContent = `Each image must be under ${
        MAX_SIZE_BYTES / (1024 * 1024)
      } MB.`;
      continue;
    }

    // read file as data URL
    const reader = new FileReader();
    reader.onload = () => {
      selectedImageDataUrls.push(reader.result);
      renderImagePreviews();
    };
    reader.readAsDataURL(f);
  }
  imagesInput.value = ""; // reset input so same file can be reselected
});

function renderImagePreviews() {
  imagePreview.innerHTML = "";
  selectedImageDataUrls.forEach((dataUrl, idx) => {
    const wrapper = document.createElement("div");
    wrapper.style =
      "position:relative; width:120px; height:80px; border:1px solid #ddd; border-radius:6px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#fafafa;";
    wrapper.innerHTML = `
      <img src="${dataUrl}" alt="img-${
      idx + 1
    }" style="max-width:100%; max-height:100%; object-fit:cover;" />
      <button class="addr-remove-img" data-idx="${idx}" style="position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.6); color:white; border:none; padding:2px 6px; font-size:12px; border-radius:4px; cursor:pointer;">×</button>
    `;
    imagePreview.appendChild(wrapper);
  });
}

imagePreview.addEventListener("click", (e) => {
  if (e.target.matches(".addr-remove-img")) {
    const idx = Number(e.target.dataset.idx);
    selectedImageDataUrls.splice(idx, 1);
    renderImagePreviews();
  }
});



  //-----------------------------------------------
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

    hint.textContent = "";
    hint.style.color = "#6b7280";
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
      const description = descInput.value.trim();

      // Save to localStorage: include description and images (data URLs)
      const pins = JSON.parse(localStorage.getItem("spotPins")) || [];
      pins.push({
        name: pinName,
        lat,
        lng,
        displayName,
        description,
        images: selectedImageDataUrls.slice(), // array of data URLs
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("spotPins", JSON.stringify(pins));

      // Add marker with extended popup (show first image + description in popup)
      const popupHtmlParts = [`<strong>${escapeHtml(pinName)}</strong>`];
      if (description)
        popupHtmlParts.push(
          `<div style="margin-top:6px;">${escapeHtml(description)}</div>`
        );
      if (selectedImageDataUrls[0])
        popupHtmlParts.push(
          `<div style="margin-top:6px;"><img src="${selectedImageDataUrls[0]}" alt="thumb" style="max-width:180px; max-height:120px; object-fit:cover; border-radius:6px;" /></div>`
        );
      L.marker([lat, lng], { icon: redPin })
        .addTo(map)
        .bindPopup(popupHtmlParts.join(""))
        .openPopup();

      map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
        
      hint.style.color = "green";
      hint.textContent = "Spot added successfully!";

      setTimeout(() => {
        closeModal();
        hint.textContent = "";
        hint.style.color = "#6b7280";
      }, 600);
      closeModal();

      // reset selected images so next open is clean
      selectedImageDataUrls = [];
      renderImagePreviews();
    } catch (err) {
      console.error(err);
      hint.style.color = "#b91c1c";
      hint.textContent = "Error adding spot. Please try again.";

    
    } finally {
      btnSubmit.disabled = false;
      // refresh the left panel via the exposed function if available
      if (window.renderPinCards) window.renderPinCards();
      else location.reload();
    }
  });

 
})();





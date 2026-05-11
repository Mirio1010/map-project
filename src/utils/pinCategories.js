import L from "leaflet";

// Tint for recurring scheduled pins so they pop on the map (easy single place to tweak)
export const SCHEDULED_PIN_COLOR = "#f59e0b";

// Category to pin image mapping
export const categoryPinMap = {
  "food-drinks": "/pics/food-drinks.png",
  events: "/pics/events.png",
  activities: "/pics/activities.png",
  nightlife: "/pics/nightlife.png",
  shopping: "/pics/shopping.png",
  favorites: "/pics/favorites.png",
};

// Default pin fallback
export const defaultPinUrl = "/pics/Pin.png";

/**
 * Builds the standard Leaflet image icon for normal (non-scheduled) pins.
 */
function buildLeafletPinIcon(pinUrl) {
  return L.icon({
    iconUrl: pinUrl,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [-3, -76],
    shadowSize: [50, 64],
  });
}

/**
 * Create a marker icon from the category sprite. Optionally style as a recurring scheduled pin (amber ring, dashed edge, tiny clock cue).
 *
 * @param {string} category
 * @param {{ isScheduled?: boolean }} [options]
 */
export const createPinIcon = (category, options = {}) => {
  const pinUrl = categoryPinMap[category] || defaultPinUrl;
  const isScheduled = Boolean(options?.isScheduled);

  if (!isScheduled) {
    return buildLeafletPinIcon(pinUrl);
  }

  return L.divIcon({
    className: "spoty-pin-div spoty-pin-scheduled",
    html: `
      <div class="spoty-pin-shell" style="--scheduled-color:${SCHEDULED_PIN_COLOR};">
        <div class="spoty-pin-img-wrap">
          <img src="${pinUrl}" alt="pin" class="spoty-pin-img spoty-pin-img-scheduled"/>
        </div>
        <span class="spoty-pin-clock">🕒</span>
      </div>
    `,
    iconSize: [44, 54],
    iconAnchor: [22, 54],
    popupAnchor: [-3, -76],
  });
};

// Create default pin icon
export const createDefaultPinIcon = () => {
  return L.icon({
    iconUrl: defaultPinUrl,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [-3, -76],
    shadowSize: [50, 64],
  });
};

/**
 * Builds a friend's colored pin overlay; optionally uses the amber scheduled treatment on top.
 */
export const createColoredPinIcon = (category, color, isScheduledFriend = false) => {
  const pinUrl = category ? categoryPinMap[category] || defaultPinUrl : defaultPinUrl;
  const pinColor = color || "#1fcece";

  if (isScheduledFriend) {
    return L.divIcon({
      className: "colored-pin-icon colored-pin-scheduled-wrapper",
      html: `
      <div
        class="colored-pin-wrapper colored-pin-scheduled-inner"
        data-pin-color="${pinColor}"
        style="
          position: relative;
          width: 44px;
          height: 54px;
          overflow: visible;
          padding: 8px;
          margin: -8px;
          --scheduled-ring: ${SCHEDULED_PIN_COLOR};
        ">
        <img
          src="${pinUrl}"
          class="colored-pin-image colored-pin-friend-scheduled"
          style="
            width: 40px;
            height: 50px;
            transform: translateZ(0);
            --pin-color: ${pinColor};
          "
          alt="pin"
        />
        <span class="spoty-pin-clock-friend">🕒</span>
      </div>
      `,
      iconSize: [52, 62],
      iconAnchor: [26, 62],
      popupAnchor: [-3, -76],
    });
  }

  return L.divIcon({
    className: "colored-pin-icon",
    html: `
      <div 
        class="colored-pin-wrapper" 
        data-pin-color="${pinColor}"
        style="
          position: relative;
          width: 40px;
          height: 50px;
          overflow: visible;
          padding: 8px;
          margin: -8px;
        ">
        <img 
          src="${pinUrl}" 
          class="colored-pin-image"
          style="
            width: 40px;
            height: 50px;
            transform: translateZ(0);
            --pin-color: ${pinColor};
          "
          alt="pin"
        />
      </div>
    `,
    iconSize: [48, 58],
    iconAnchor: [24, 58],
    popupAnchor: [-3, -76],
  });
};

// Get all available categories
export const categories = [
  { value: "food-drinks", label: "Food and drinks" },
  { value: "events", label: "Events" },
  { value: "activities", label: "Activities" },
  { value: "nightlife", label: "Nightlife" },
  { value: "shopping", label: "Shopping" },
  { value: "favorites", label: "Favorites" },
];


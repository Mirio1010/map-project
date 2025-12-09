import L from "leaflet";

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

// Create a pin icon for a given category
export const createPinIcon = (category) => {
  const pinUrl = categoryPinMap[category] || defaultPinUrl;
  
  return L.icon({
    iconUrl: pinUrl,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [-3, -76],
    shadowSize: [50, 64],
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

// Create a colored pin icon using DivIcon with a colored glow
export const createColoredPinIcon = (category, color) => {
  const pinUrl = category ? (categoryPinMap[category] || defaultPinUrl) : defaultPinUrl;
  const pinColor = color || "#1fcece";
  
  return L.divIcon({
    className: 'colored-pin-icon',
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
    iconSize: [48, 58], // Slightly increased to accommodate subtle glow
    iconAnchor: [24, 58], // Adjusted anchor point
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


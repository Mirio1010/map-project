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

// Get all available categories
export const categories = [
  { value: "food-drinks", label: "Food and drinks" },
  { value: "events", label: "Events" },
  { value: "activities", label: "Activities" },
  { value: "nightlife", label: "Nightlife" },
  { value: "shopping", label: "Shopping" },
  { value: "favorites", label: "Favorites" },
];


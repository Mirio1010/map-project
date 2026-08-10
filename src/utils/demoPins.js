/**
 * Static demo dataset for the public landing map.
 * No Supabase calls — safe for anonymous recruiters.
 * Workflow mirrors Spoty: your pins → drop → friends → filter → open card → timed pin.
 */

export const DEMO_MAP_CENTER = [40.7282, -73.9942];
/** Overview zoom — keep the whole demo readable; avoid fly-in zooms. */
export const DEMO_MAP_ZOOM = 11;
export const DEMO_MAP_MAX_ZOOM = 12;

export const DEMO_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "food-drinks", label: "Food" },
  { id: "events", label: "Events" },
  { id: "nightlife", label: "Nightlife" },
  { id: "activities", label: "Activities" },
];

export const DEMO_FRIENDS = [
  { id: "maya", name: "Maya", color: "#3db8a8" },
  { id: "alex", name: "Alex", color: "#6b9fff" },
  { id: "sam", name: "Sam", color: "#e07ab5" },
];

export const DEMO_MY_PINS = [
  {
    id: "demo-my-1",
    name: "Morning espresso",
    category: "food-drinks",
    lat: 40.7265,
    lng: -73.9897,
    description: "Quiet corner cafe, great for deep work.",
    owner: "you",
    rating: 5,
  },
  {
    id: "demo-my-2",
    name: "Rooftop jazz",
    category: "nightlife",
    lat: 40.7338,
    lng: -73.9991,
    description: "Live set Fridays. Bring a jacket.",
    owner: "you",
    rating: 4,
  },
  {
    id: "demo-my-3",
    name: "Weekend market",
    category: "shopping",
    lat: 40.7198,
    lng: -73.9975,
    description: "Farmers market + vintage stalls.",
    owner: "you",
    rating: 4,
  },
  {
    id: "demo-my-4",
    name: "River run",
    category: "activities",
    lat: 40.7356,
    lng: -74.0102,
    description: "Sunrise loop along the water.",
    owner: "you",
    rating: 5,
  },
  {
    id: "demo-my-5",
    name: "Gallery night",
    category: "events",
    lat: 40.7221,
    lng: -73.9864,
    description: "Opening reception this Thursday.",
    owner: "you",
    rating: 4,
  },
];

/**
 * Guided “drop” pin — placed west of the cluster so it stays visible
 * when friend pins appear (not buried in the middle).
 */
export const DEMO_DROP_PIN = {
  id: "demo-drop",
  name: "Sunset picnic",
  category: "events",
  // East of the main cluster so it stays visible and “to the right” on the map.
  lat: 40.7468,
  lng: -73.9725,
  description: "Waterfront blanket spot, only open for a short window.",
  owner: "you",
  rating: 5,
  timed: true,
  /** Demo countdown length (seconds) for the timed-pin step. */
  timedSeconds: 14,
};

export const DEMO_FRIEND_PINS = [
  {
    id: "demo-friend-1",
    name: "Maya's dumpling spot",
    category: "food-drinks",
    lat: 40.7148,
    lng: -73.9903,
    description: "Best soup dumplings in the neighborhood.",
    owner: "maya",
    color: "#3db8a8",
    rating: 5,
  },
  {
    id: "demo-friend-2",
    name: "Alex's hidden park",
    category: "favorites",
    lat: 40.7309,
    lng: -73.9973,
    description: "Quiet lawn, perfect afternoon read.",
    owner: "alex",
    color: "#6b9fff",
    rating: 4,
  },
  {
    id: "demo-friend-3",
    name: "Sam's late show",
    category: "events",
    lat: 40.7412,
    lng: -73.9898,
    description: "Comedy set starts at 10.",
    owner: "sam",
    color: "#e07ab5",
    rating: 5,
  },
];

/**
 * Guided tour steps. `highlight` drives UI callouts:
 * map | friends | filter | popup | timed
 */
export const DEMO_GUIDE_STEPS = [
  {
    id: "yours",
    title: "Your spots",
    body: "These are places you saved on Spoty. Every pin is yours to keep.",
    showFriends: false,
    showDrop: false,
    category: "all",
    openPinId: null,
    runCountdown: false,
    highlight: "map",
  },
  {
    id: "drop",
    title: "Drop a pin",
    body: "Tap the map to save a new place, we’ll drop one on the waterfront so it’s easy to see.",
    showFriends: false,
    showDrop: true,
    category: "all",
    openPinId: null,
    runCountdown: false,
    highlight: "map",
  },
  {
    id: "friends",
    title: "Friends appear",
    body: "Turn on Friends to see spots they shared, each person gets their own color.",
    showFriends: true,
    showDrop: true,
    category: "all",
    openPinId: null,
    runCountdown: false,
    highlight: "friends",
  },
  {
    id: "filter",
    title: "Filter the noise",
    body: "Filter by category, here we’re down to Food only.",
    showFriends: true,
    showDrop: true,
    category: "food-drinks",
    openPinId: null,
    runCountdown: false,
    highlight: "filter",
  },
  {
    id: "open",
    title: "Open a pin",
    body: "Click a pin to open its card. Name, category, notes, and who shared it.",
    showFriends: false,
    showDrop: true,
    category: "all",
    openPinId: "demo-drop",
    runCountdown: false,
    highlight: "popup",
  },
  {
    id: "timed",
    title: "Timed pins",
    body: "Scheduled pins stay active for a window. When the timer hits zero, they disappear from the map by themselves.",
    showFriends: false,
    showDrop: true,
    category: "all",
    openPinId: "demo-drop",
    runCountdown: true,
    highlight: "timed",
  },
];

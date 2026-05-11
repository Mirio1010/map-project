/**
 * Display-only reverse geocoding via Nominatim (OpenStreetMap).
 *
 * Nominatim usage policy: identify with a valid User-Agent; avoid bursty traffic.
 * We serialize requests so at most one lookup runs at a time and there is a 1s
 * gap after each response before the next request starts (conservative vs 1 req/s).
 */

const cache = new Map();

/** @type {Promise<void>} */
let requestChain = Promise.resolve();

/**
 * True when the string looks like "lat, lng" (not a street address).
 */
export function isCoordinateString(str) {
  if (str == null || typeof str !== "string") return false;
  const t = str.trim();
  return /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(t);
}

/**
 * When true, UI should resolve a label from lat/lng (empty or coordinate-only stored value).
 */
export function needsReverseGeocodeLookup(address) {
  if (address == null || String(address).trim() === "") return true;
  return isCoordinateString(address);
}

function cacheKey(lat, lng) {
  return `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
}

function buildLineFromNominatimJson(data) {
  if (!data) return "";
  const a = data.address || {};
  const street = [a.house_number, a.road].filter(Boolean).join(" ").trim();
  const city =
    a.city || a.town || a.village || a.suburb || a.hamlet || a.municipality || a.county;
  const parts = [];
  if (street) parts.push(street);
  if (city) parts.push(city);
  if (parts.length) return parts.join(", ");
  if (typeof data.display_name === "string" && data.display_name.trim()) {
    const bits = data.display_name.split(",").map((s) => s.trim()).filter(Boolean);
    return bits.slice(0, 2).join(", ");
  }
  return "";
}

async function fetchReverse(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": "SpotyMap/1.0 (https://spotymap.netlify.app)",
    },
  });
  if (!res.ok) return "Address unavailable";
  const data = await res.json();
  const line = buildLineFromNominatimJson(data);
  return line.trim() ? line.trim() : "Address unavailable";
}

/**
 * Takes lat and lng, returns the nearest human-readable address string.
 * Falls back to "Address unavailable" if the API call fails.
 * Results are cached per session by rounded lat/lng.
 */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return "Address unavailable";
  }

  const key = cacheKey(lat, lng);
  if (cache.has(key)) {
    return cache.get(key);
  }

  const run = async () => {
    try {
      const line = await fetchReverse(Number(lat), Number(lng));
      cache.set(key, line);
      return line;
    } catch {
      const fallback = "Address unavailable";
      cache.set(key, fallback);
      return fallback;
    } finally {
      await new Promise((r) => setTimeout(r, 1000));
    }
  };

  const wrapped = requestChain.then(run);
  requestChain = wrapped.then(() => {}).catch(() => {});
  const result = await wrapped;
  return result;
}

/**
 * Shorten a normal stored address for cards (not for raw coordinates — use PinResolvedAddress).
 */
export function formatStoredAddressShort(address) {
  if (!address || typeof address !== "string") return "";
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const short = `${parts[0]}, ${parts[1]}`;
    return short.length > 50 ? `${short.slice(0, 47)}…` : short;
  }
  return address.length > 50 ? `${address.slice(0, 47)}…` : address;
}

import { useState, useEffect, useRef } from "react";
import { categories } from "../utils/pinCategories";
import { formatLocalISODate, parseTimeToMinutes } from "../utils/scheduleUtils";
import { needsReverseGeocodeLookup, reverseGeocode } from "../utils/geocodeUtils";

// Weekday pills follow Mon-first order while still storing JS weekday numbers for Supabase schedules
const WEEKDAY_PILLS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

/**
 * Seeds the default recurring window (today through ~30 days) for brand-new scheduled pins.
 */
function defaultRollingDateRangeStrings() {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30);
  return {
    startDate: formatLocalISODate(start),
    endDate: formatLocalISODate(end),
  };
}

function AddSpotModal({ isOpen, onClose, onSave, initialCoords, initialPin }) {
  // matching addByAddress.js form
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [desc, setDesc] = useState("");
  const [images, setImages] = useState([]);
  const [coords, setCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [category, setCategory] = useState("food-drinks");
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());
  const debounceTimerRef = useRef(null);
  //rating (Default to 5)
  const [rating, setRating] = useState(5);
  /** User picks between always-on pins and the newer recurring schedule model */
  const [pinVisibilityMode, setPinVisibilityMode] = useState("permanent");
  const [schedStartTime, setSchedStartTime] = useState("14:00");
  const [schedEndTime, setSchedEndTime] = useState("18:00");
  const [schedStartDate, setSchedStartDate] = useState(
    formatLocalISODate(new Date()),
  );
  const [schedEndDate, setSchedEndDate] = useState(
    defaultRollingDateRangeStrings().endDate,
  );
  /** Weekday ints (Sun=0 … Sat=6) selected for recurrence */
  const [schedDays, setSchedDays] = useState([1, 2, 3, 4, 5]);
  /** Display-only resolved label when the stored value is empty or lat,lng — never written to DB */
  const [resolvedAddressHint, setResolvedAddressHint] = useState(null);

  /**
   * When the drawer opens we either hydrate from Supabase edits or wipe to a fresh blank slate.
   */
  useEffect(() => {
    if (!isOpen) return;

    const range = defaultRollingDateRangeStrings();

    if (initialPin) {
      setName(initialPin.name || "");
      setAddress(initialPin.address || initialPin.displayName || "");
      setDesc(initialPin.description || "");
      setImages(initialPin.images || []);
      setCoords({ lat: initialPin.lat, lng: initialPin.lng });
      setCategory(initialPin.category || "food-drinks");
      setRating(initialPin.rating || 5);

      if (initialPin.schedule) {
        const s = initialPin.schedule;
        setPinVisibilityMode("scheduled");
        setSchedStartTime(s.startTime || "14:00");
        setSchedEndTime(s.endTime || "18:00");
        setSchedStartDate(s.startDate || range.startDate);
        setSchedEndDate(s.endDate || range.endDate);
        setSchedDays(
          Array.isArray(s.daysOfWeek) && s.daysOfWeek.length
            ? [...s.daysOfWeek].sort((a, b) => a - b)
            : [1, 2, 3, 4, 5],
        );
      } else {
        setPinVisibilityMode("permanent");
        setSchedStartTime("14:00");
        setSchedEndTime("18:00");
        setSchedStartDate(range.startDate);
        setSchedEndDate(range.endDate);
        setSchedDays([1, 2, 3, 4, 5]);
      }
      return;
    }

    if (initialCoords) {
      setCoords(initialCoords);
      setAddress(
        `${initialCoords.lat.toFixed(5)}, ${initialCoords.lng.toFixed(5)}`,
      );
    } else {
      setCoords(null);
      setAddress("");
    }
    setName("");
    setDesc("");
    setImages([]);
    setCategory("food-drinks");
    setRating(5);
    setPinVisibilityMode("permanent");
    setSchedStartTime("14:00");
    setSchedEndTime("18:00");
    setSchedStartDate(range.startDate);
    setSchedEndDate(range.endDate);
    setSchedDays([1, 2, 3, 4, 5]);
  }, [initialCoords, initialPin, isOpen]);

  useEffect(() => {
    if (!isOpen || coords == null || coords.lat == null || coords.lng == null) {
      setResolvedAddressHint(null);
      return undefined;
    }
    if (!needsReverseGeocodeLookup(address)) {
      setResolvedAddressHint(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const line = await reverseGeocode(coords.lat, coords.lng);
      if (!cancelled) setResolvedAddressHint(line);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, coords, address]);

  /**
   * Flip weekdays on/off whenever someone taps one of the quick pills.
   */
  const toggleWeekday = (value) => {
    setSchedDays((prev) => {
      if (prev.includes(value)) {
        return prev.filter((d) => d !== value).sort((a, b) => a - b);
      }
      return [...prev, value].sort((a, b) => a - b);
    });
  };

  // Fetch address suggestions from Nominatim with debounce, abort and simple cache
  const fetchAddressSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // return cached result when available
    if (cacheRef.current.has(query)) {
      setSuggestions(cacheRef.current.get(query));
      setShowSuggestions(true);
      return;
    }

    // cancel previous request
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {
        /* already settled */
      }
      abortControllerRef.current = null;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=6`,
        { signal: controller.signal, headers: { "Accept-Language": "en" } }
      );
      const data = await response.json();
      cacheRef.current.set(query, data);
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      if (error.name === "AbortError") return; // request was cancelled
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);

    // debounce to avoid calling API on every keystroke
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchAddressSuggestions(value.trim());
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setAddress(suggestion.display_name);
    setCoords({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // logic from readImageFilesAsDataUrls in files
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5); // limit 5
    const promises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });
    const results = await Promise.all(promises);
    setImages(results);
  };

  // const handleSubmit = (e) => {
  //   e.preventDefault();

  //   // create new pin object to save
  //   const newPin = {
  //     name: name || "Untitled Spot",
  //     address: address,
  //     description: desc,
  //     lat: coords ? coords.lat : 0,
  //     lng: coords ? coords.lng : 0,
  //     images: images,
  //     category: category,
  //     createdAt: new Date().toISOString(),
  //     rating:parseInt(rating),
  //   };

  //   onSave(newPin);
  //   // reset form fields
  //   setName("");
  //   setAddress("");
  //   setDesc("");
  //   setImages([]);
  //   setCategory("food-drinks");
  //   setStatus("");
  //   setRating(5);
  // };

  const handleSubmit = (e) => {
    e.preventDefault();

    let schedulePayload = null;
    let expiresAt = null;

    if (pinVisibilityMode === "scheduled") {
      if (schedDays.length === 0) {
        alert("Pick at least one weekday for your scheduled pin.");
        return;
      }
      const startMin = parseTimeToMinutes(schedStartTime);
      const endMin = parseTimeToMinutes(schedEndTime);
      if (Number.isNaN(startMin) || Number.isNaN(endMin) || startMin >= endMin) {
        alert("End time needs to come after start time.");
        return;
      }
      if (!schedStartDate || !schedEndDate || schedStartDate > schedEndDate) {
        alert("Pick a valid date span (start on or before end).");
        return;
      }

      schedulePayload = {
        startTime: schedStartTime,
        endTime: schedEndTime,
        startDate: schedStartDate,
        endDate: schedEndDate,
        daysOfWeek: [...schedDays].sort((a, b) => a - b),
      };
      expiresAt = null;
    } else {
      schedulePayload = null;
      if (initialPin && !initialPin.schedule && initialPin.expires_at) {
        expiresAt = initialPin.expires_at;
      } else {
        expiresAt = null;
      }
    }

    const newPin = {
      ...(initialPin || {}),
      name: name || "Untitled Spot",
      address: address,
      description: desc,
      lat: coords ? coords.lat : 0,
      lng: coords ? coords.lng : 0,
      images: images,
      category: category,
      createdAt: initialPin?.createdAt || new Date().toISOString(),
      rating: parseInt(rating, 10),
      expires_at: expiresAt,
      schedule: schedulePayload,
    };

    onSave(newPin);
    const range = defaultRollingDateRangeStrings();
    setName("");
    setAddress("");
    setDesc("");
    setImages([]);
    setCategory("food-drinks");
    setRating(5);
    setPinVisibilityMode("permanent");
    setSchedStartTime("14:00");
    setSchedEndTime("18:00");
    setSchedStartDate(range.startDate);
    setSchedEndDate(range.endDate);
    setSchedDays([1, 2, 3, 4, 5]);
  };

  /** Modal shell renders only while open so Leaflet/map clicks keep working quietly otherwise */
  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "450px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <strong>{initialPin ? "Edit Spot" : "Add Spot"}</strong>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
          {/* rating selector//////////////////////////////////////////////////////////////////////////// */}

          <label style={{ fontSize: "12px", color: "#666" }}>Rating</label>
          <div style={{ display: "flex", gap: "5px" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                style={{
                  fontSize: "20px",
                  color: star <= rating ? "#FFD700" : "#e5e7eb",
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
              >
                ★
              </span>
            ))}
          </div>

          {/* rating selector//////////////////////////////////////////////////////////////////////////// */}
          <label style={{ fontSize: "12px", color: "#666" }}>
            Place name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
            placeholder="e.g. Joe's Coffee"
          />

          <label style={{ fontSize: "12px", color: "#666" }}>
            Address / Location
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={address}
              onChange={handleAddressChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              style={{
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                width: "100%",
              }}
              required
            />
            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "white",
                  border: "1px solid #ccc",
                  borderTop: "none",
                  borderRadius: "0 0 4px 4px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1000,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#333",
                      ":hover": { background: "#f5f5f5" },
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.background = "#f5f5f5")
                    }
                    onMouseLeave={(e) => (e.target.style.background = "white")}
                  >
                    {suggestion.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {resolvedAddressHint && needsReverseGeocodeLookup(address) ? (
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "12px",
                color: "#555",
              }}
            >
              Shown as: {resolvedAddressHint}
            </p>
          ) : null}

          <label style={{ fontSize: "12px", color: "#666" }}>Description</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows="2"
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />

          <label style={{ fontSize: "12px", color: "#666" }}>
            Category (Pin Color)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Pin visibility: classic always-on vs new recurring schedule JSON */}
          <div
            style={{
              padding: "12px",
              background: "#f9fafb",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              display: "grid",
              gap: "10px",
            }}
          >
            <label style={{ fontSize: "12px", color: "#666" }}>Pin visibility</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setPinVisibilityMode("permanent")}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  cursor: "pointer",
                  fontWeight: 600,
                  background: pinVisibilityMode === "permanent" ? "#1cbe52" : "#fff",
                  color: pinVisibilityMode === "permanent" ? "#fff" : "#444",
                }}
              >
                Permanent
              </button>
              <button
                type="button"
                onClick={() => setPinVisibilityMode("scheduled")}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  cursor: "pointer",
                  fontWeight: 600,
                  background: pinVisibilityMode === "scheduled" ? "#1cbe52" : "#fff",
                  color: pinVisibilityMode === "scheduled" ? "#fff" : "#444",
                }}
              >
                Scheduled
              </button>
            </div>

            {initialPin?.expires_at && !initialPin?.schedule && (
              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
                This pin still uses the older “delete after one timestamp” setting. Switching to
                Scheduled clears that timer in favor of the weekly pattern.
              </p>
            )}

            <div
              style={{
                display: pinVisibilityMode === "scheduled" ? "grid" : "none",
                gap: "10px",
              }}
              aria-hidden={pinVisibilityMode !== "scheduled"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <label style={{ fontSize: "12px", color: "#666", margin: 0 }}>Time window</label>
                <input
                  type="time"
                  value={schedStartTime}
                  onChange={(e) => setSchedStartTime(e.target.value)}
                  style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
                <span style={{ color: "#999" }}>→</span>
                <input
                  type="time"
                  value={schedEndTime}
                  onChange={(e) => setSchedEndTime(e.target.value)}
                  style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <label style={{ fontSize: "12px", color: "#666", margin: 0 }}>Date range</label>
                <input
                  type="date"
                  value={schedStartDate}
                  onChange={(e) => setSchedStartDate(e.target.value)}
                  style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
                <span style={{ color: "#999" }}>to</span>
                <input
                  type="date"
                  value={schedEndDate}
                  onChange={(e) => setSchedEndDate(e.target.value)}
                  style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>
                  Days of week
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {WEEKDAY_PILLS.map((pill) => {
                    const active = schedDays.includes(pill.value);
                    return (
                      <button
                        key={pill.value}
                        type="button"
                        onClick={() => toggleWeekday(pill.value)}
                        style={{
                          border: "1px solid #cbd5e1",
                          borderRadius: "999px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          cursor: "pointer",
                          background: active ? "#0f172a" : "#fff",
                          color: active ? "#f8fafc" : "#475569",
                          fontWeight: 600,
                        }}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
                Scheduled pins disappear from the map outside the window but stay saved for the next
                matching day.
              </p>
            </div>
          </div>

          <label style={{ fontSize: "12px", color: "#666" }}>Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
          />

          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                style={{
                  width: "50px",
                  height: "50px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
                alt="preview"
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                background: "#f3f4f6",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 12px",
                border: "none",
                background: "#1cbe52",
                color: "white",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {initialPin ? "Save" : "Add Spot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSpotModal;

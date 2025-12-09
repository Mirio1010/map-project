import { useState, useEffect, useRef } from "react";
import { categories } from "../utils/pinCategories";

function AddSpotModal({ isOpen, onClose, onSave, initialCoords, initialPin }) {
  if (!isOpen) return null;

  // matching addByAddress.js form
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [desc, setDesc] = useState("");
  const [images, setImages] = useState([]);
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [category, setCategory] = useState("food-drinks");
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());
  const debounceTimerRef = useRef(null);
  //rating (Default to 5)
  const [rating, setRating] = useState(5);
  // Temporary pin expiration
  const [isTemporary, setIsTemporary] = useState(false);
  const [expirationType, setExpirationType] = useState("hours"); // "hours", "days", "datetime"
  const [expirationHours, setExpirationHours] = useState(24);
  const [expirationDays, setExpirationDays] = useState(1);
  const [expirationDateTime, setExpirationDateTime] = useState("");

  useEffect(() => {
    // If we're editing an existing pin, prefill fields from initialPin
    if (initialPin) {
      setName(initialPin.name || "");
      setAddress(initialPin.address || initialPin.displayName || "");
      setDesc(initialPin.description || "");
      setImages(initialPin.images || []);
      setCoords({ lat: initialPin.lat, lng: initialPin.lng });
      setCategory(initialPin.category || "food-drinks");
      //load existing rating
      setRating(initialPin.rating || 5);
      // Load expiration settings
      setIsTemporary(!!initialPin.expires_at);
      if (initialPin.expires_at) {
        const expiresAt = new Date(initialPin.expires_at);
        const now = new Date();
        const hoursUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60));
        const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry >= 1) {
          setExpirationType("days");
          setExpirationDays(Math.max(1, daysUntilExpiry));
        } else {
          setExpirationType("hours");
          setExpirationHours(Math.max(1, hoursUntilExpiry));
        }
        // Set datetime for datetime picker
        const localDateTime = new Date(expiresAt.getTime() - expiresAt.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setExpirationDateTime(localDateTime);
      }
      return;
    }

    if (initialCoords) {
      setCoords(initialCoords);
      // run reverseGeocode here if you wanted the address name
      setAddress(
        `${initialCoords.lat.toFixed(5)}, ${initialCoords.lng.toFixed(5)}`
      );
    } else {
      setCoords(null);
      setAddress("");
      setRating(5);
      setIsTemporary(false);
      setExpirationType("hours");
      setExpirationHours(24);
      setExpirationDays(1);
      setExpirationDateTime("");
    }
  }, [initialCoords, initialPin, isOpen]);

  // when initialPin changes (e.g. open editor), prefill
  useEffect(() => {
    if (!isOpen) return;
    if (initialPin) {
      setName(initialPin.name || "");
      setAddress(initialPin.address || initialPin.displayName || "");
      setDesc(initialPin.description || "");
      setImages(initialPin.images || []);
      setCoords({ lat: initialPin.lat, lng: initialPin.lng });
      setCategory(initialPin.category || "food-drinks");
    } else {
      // Reset category when opening new pin modal
      setCategory("food-drinks");
      setIsTemporary(false);
      setExpirationType("hours");
      setExpirationHours(24);
      setExpirationDays(1);
      setExpirationDateTime("");
    }
  }, [initialPin, isOpen]);

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
      } catch (e) {}
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

    // Calculate expiration time if temporary
    let expiresAt = null;
    if (isTemporary) {
      const expirationDate = new Date();
      
      if (expirationType === "datetime" && expirationDateTime) {
        // Use specific date/time
        expiresAt = new Date(expirationDateTime).toISOString();
      } else if (expirationType === "days" && expirationDays > 0) {
        // Add days
        expirationDate.setDate(expirationDate.getDate() + expirationDays);
        expiresAt = expirationDate.toISOString();
      } else if (expirationType === "hours" && expirationHours > 0) {
        // Add hours
        expirationDate.setHours(expirationDate.getHours() + expirationHours);
        expiresAt = expirationDate.toISOString();
      }
    }

    // create new pin object to save
    const newPin = {
      ...(initialPin || {}), // ← IMPORTANT: keeps id, user_id, createdAt when editing
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
    };


    onSave(newPin);
    // reset form fields
    setName("");
    setAddress("");
    setDesc("");
    setImages([]);
    setCategory("food-drinks");
    setStatus("");
    setRating(5);
    setIsTemporary(false);
    setExpirationType("hours");
    setExpirationHours(24);
    setExpirationDays(1);
    setExpirationDateTime("");
  };





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

          {/* Temporary Pin Option */}
          <div style={{ 
            padding: "12px", 
            background: "#f9fafb", 
            borderRadius: "6px",
            border: "1px solid #e5e7eb"
          }}>
            <label style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              fontSize: "12px", 
              color: "#666",
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                checked={isTemporary}
                onChange={(e) => setIsTemporary(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <span>⏰ Make this a temporary pin</span>
            </label>
            {isTemporary && (
              <div style={{ marginTop: "8px" }}>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
                  Expiration type:
                </label>
                <select
                  value={expirationType}
                  onChange={(e) => {
                    setExpirationType(e.target.value);
                    // Set default datetime if switching to datetime mode
                    if (e.target.value === "datetime" && !expirationDateTime) {
                      const defaultDateTime = new Date();
                      defaultDateTime.setHours(defaultDateTime.getHours() + 24);
                      const localDateTime = new Date(defaultDateTime.getTime() - defaultDateTime.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16);
                      setExpirationDateTime(localDateTime);
                    }
                  }}
                  style={{
                    padding: "6px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px",
                    width: "100%",
                    marginBottom: "8px",
                  }}
                >
                  <option value="hours">Hours from now</option>
                  <option value="days">Days from now</option>
                  <option value="datetime">Specific date & time</option>
                </select>

                {expirationType === "hours" && (
                  <>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
                      Hours:
                    </label>
                    <select
                      value={expirationHours}
                      onChange={(e) => setExpirationHours(parseInt(e.target.value, 10))}
                      style={{
                        padding: "6px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "14px",
                        width: "100%",
                      }}
                    >
                      <option value={1}>1 hour</option>
                      <option value={2}>2 hours</option>
                      <option value={3}>3 hours</option>
                      <option value={6}>6 hours</option>
                      <option value={12}>12 hours</option>
                      <option value={24}>24 hours (1 day)</option>
                      <option value={48}>48 hours (2 days)</option>
                      <option value={72}>72 hours (3 days)</option>
                    </select>
                  </>
                )}

                {expirationType === "days" && (
                  <>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
                      Days:
                    </label>
                    <select
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(parseInt(e.target.value, 10))}
                      style={{
                        padding: "6px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "14px",
                        width: "100%",
                      }}
                    >
                      <option value={1}>1 day</option>
                      <option value={2}>2 days</option>
                      <option value={3}>3 days</option>
                      <option value={7}>1 week</option>
                      <option value={14}>2 weeks</option>
                      <option value={30}>1 month</option>
                    </select>
                  </>
                )}

                {expirationType === "datetime" && (
                  <>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
                      Date & Time:
                    </label>
                    <input
                      type="datetime-local"
                      value={expirationDateTime || ""}
                      onChange={(e) => setExpirationDateTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      style={{
                        padding: "6px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "14px",
                        width: "100%",
                      }}
                    />
                  </>
                )}

                <p style={{ 
                  margin: "8px 0 0 0", 
                  fontSize: "11px", 
                  color: "#9ca3af" 
                }}>
                  This pin will automatically disappear after the selected time. Friends will be able to see it until it expires.
                </p>
              </div>
            )}
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
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 12px",
                border: "none",
                background: "#111827",
                color: "white",
                borderRadius: "6px",
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

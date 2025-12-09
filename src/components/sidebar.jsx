import React from "react";
import { categories } from "../utils/pinCategories";
import "../styles/explore.css";

function Sidebar({ 
  pins, 
  originalPins,
  friendsPins = [],
  friendUsernames = {},
  friendColors = {},
  friendProfiles = [],
  onDelete, 
  onEdit, 
  onZoom, 
  onAddSpot, 
  onLocate, 
  showTop10, 
  setShowTop10,
  showFriendsPins,
  setShowFriendsPins,
  showMyPins,
  setShowMyPins,
  isFilterOpen,
  setIsFilterOpen,
  selectedCategories,
  setSelectedCategories,
  minRating,
  setMinRating,
  maxRating,
  setMaxRating,
  sortBy,
  setSortBy,
  selectedFriend,
  setSelectedFriend,
  onResetFilters
}) {
  
  // helper to find the actual index in the main list
  const getOriginalIndex = (pin) => {
    return originalPins.indexOf(pin);
  };

  // helper to render stars
  const renderStars = (count) => {
    if(!count) count = 0;
    return(
      <span style={{
        color:"#FFD700", 
        fontSize:"14px"}}>
        {'★'.repeat(count)}{'☆'.repeat(5-count)}
      </span>
    )
  }

  const formatAddress = (address, fallback) => {
    if (!address && fallback) return fallback;
    if (!address) return "Address unavailable";
    const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
    
    // Prioritize street address and city (first 2 parts)
    if (parts.length >= 2) {
      const short = `${parts[0]}, ${parts[1]}`;
      return short.length > 50 ? `${short.slice(0, 47)}…` : short;
    }
    
    // Single part address - truncate if too long
    return address.length > 50 ? `${address.slice(0, 47)}…` : address;
  };

  const formatExpirationTime = (expiresAt) => {
    if (!expiresAt) return null;
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return `${days} day${days > 1 ? 's' : ''} left`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m left`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m left`;
    } else {
      return "Expiring soon";
    }
  };

  return (
    <section className="left-pane">
      <button id="add-spot-btn" className="add-spot-btn" onClick={onAddSpot}>
        + Add Spot
      </button>
      
      {/* Controls Section */}
      <div style={{
        marginBottom: "1rem", 
        display: "flex", 
        gap: "0.5rem", 
        flexWrap: "wrap"}}>
        <button id="btn-locate" onClick={onLocate}>
          📍 Locate me
        </button>
        <button
          onClick={() => setShowTop10(!showTop10)}
          style={{
            flex: 1,
            background: showTop10 ? "var(--brand)" : "var(--panel)",
            color: showTop10 ? "white" : "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            padding: "0.75rem 1rem",
            transition: "all 0.2s ease"
          }}
        >
          {showTop10 ? "Showing Top 10" : "Show Top 10"}
        </button>
      </div>

      {/* Pin Visibility Toggles */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => setShowMyPins(!showMyPins)}
          style={{
            flex: 1,
            background: showMyPins ? "var(--brand)" : "var(--panel)",
            color: showMyPins ? "white" : "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            padding: "0.75rem 1rem",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem"
          }}
        >
          <span>📍</span>
          {showMyPins ? "Hide My Pins" : "Show My Pins"}
        </button>
        <button
          onClick={() => setShowFriendsPins(!showFriendsPins)}
          style={{
            flex: 1,
            background: showFriendsPins ? "var(--brand)" : "var(--panel)",
            color: showFriendsPins ? "white" : "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            padding: "0.75rem 1rem",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem"
          }}
        >
          <span>👥</span>
          {showFriendsPins ? "Hide Friends" : "Show Friends"}
        </button>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="filter-panel" style={{ marginBottom: "1rem" }}>
          <div className="filter-panel-header">
            <h2>Filter Pins</h2>
            <button
              className="close-filter-button"
              onClick={() => setIsFilterOpen(false)}
              aria-label="Close filters"
            >
              ✕
            </button>
          </div>

          {/* Sort by option */}
          <div className="filter-section">
            <label className="filter-label">Sort By</label>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="rating">Rating (Highest First)</option>
              <option value="name">Name (A-Z)</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {/* Friend filter */}
          {friendProfiles.length > 0 ? (
            <div className="filter-section">
              <label className="filter-label">Filter by Friend</label>
              <select
                className="filter-select"
                value={selectedFriend}
                onChange={(e) => setSelectedFriend(e.target.value)}
              >
                <option value="">All Friends ({friendProfiles.length})</option>
                {friendProfiles.map((friend, idx) => (
                  <option key={friend.id} value={friend.id}>
                    {friend.username || friend.email || `Friend ${idx + 1}`}
                  </option>
                ))}
              </select>
              {selectedFriend && (
                <button
                  type="button"
                  onClick={() => setSelectedFriend("")}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem 1rem",
                    background: "transparent",
                    color: "var(--muted)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    transition: "all 0.2s ease",
                  }}
                >
                  Clear Friend Filter
                </button>
              )}
            </div>
          ) : (
            <div className="filter-section">
              <label className="filter-label">Filter by Friend</label>
              <p style={{ color: "var(--muted)", opacity: 0.7, fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
                Add friends to filter by specific friend's pins.
              </p>
            </div>
          )}

          {/* Category filter */}
          <div className="filter-section">
            <label className="filter-label">Categories</label>
            <div className="category-checkboxes">
              {categories.map((category) => (
                <label key={category.value} className="category-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.value)}
                    onChange={() => {
                      setSelectedCategories((prev) =>
                        prev.includes(category.value)
                          ? prev.filter((c) => c !== category.value)
                          : [...prev, category.value]
                      );
                    }}
                  />
                  <span>{category.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating range filter */}
          <div className="filter-section">
            <label className="filter-label">
              Rating: {minRating} - {maxRating} stars
            </label>
            <div className="rating-range">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="rating-slider"
              />
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={maxRating}
                onChange={(e) => setMaxRating(parseFloat(e.target.value))}
                className="rating-slider"
              />
            </div>
          </div>

          {/* Reset filters button */}
          <div className="filter-actions">
            <button className="reset-filters-button" onClick={onResetFilters}>
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "flex-end" }}>
        <button
          className="filter-button"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <span className="filter-icon">🔍</span>
          Filters
          {(selectedCategories.length > 0 ||
            minRating > 0 ||
            maxRating < 5 ||
            selectedFriend) && (
              <span className="filter-badge">
                {selectedCategories.length +
                  (minRating > 0 ? 1 : 0) +
                  (maxRating < 5 ? 1 : 0) +
                  (selectedFriend ? 1 : 0)}
              </span>
            )}
        </button>
      </div>

      {/* All Spots Section Header */}
      <div style={{ 
        marginTop: "1.5rem", 
        marginBottom: "0.75rem",
        paddingBottom: "0.75rem",
        borderBottom: "1px solid var(--border)"
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: "1.125rem", 
          fontWeight: "600", 
          color: "var(--muted)" 
        }}>
          All Spots ({pins.length + friendsPins.length})
        </h2>
      </div>
      {/* ----------------------------- */}

      <div className="pin-cards" id="pin-cards">
        {/* User's own pins */}
        {pins.map((pin, index) => {
          // Calculate the original index so we edit/delete the correct item
          const originalIndex = getOriginalIndex(pin);
          
          return (
            <article
              key={`my-${originalIndex}`} // Use originalIndex for stable keys
              className="pin-card"
              onClick={() => onZoom(pin.lat, pin.lng, originalIndex)}
              style={{ cursor: "pointer" }}
            >
              <div
                className="pin-row"
                style={{ display: "flex", 
                  gap: "8px", 
                  alignItems: "flex-start" }}
              >
                {pin.images && pin.images.length > 0 ? (
                  <img
                    src={pin.images[0]}
                    alt="thumb"
                    style={{
                      width: "72px",
                      height: "56px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "72px",
                      height: "56px",
                      borderRadius: "6px",
                      background: "var(--bg)",
                      border: "1px dashed var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--muted)",
                      opacity: 0.5,
                      fontSize: "10px",
                    }}
                  >
                    No Img
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "15px" }}>
                      {pin.name || "Untitled pin"}
                    </h3>
                  </div>
                  
                  {/* DISPLAY RATING */}
                  <div style={{ marginTop: "2px" }}>
                    {renderStars(pin.rating || 0)}
                  </div>

                  <div className="addr-row">
                    <span className="addr-chip address-chip">📍 Address</span>
                    <p
                      className="addr address-text"
                      style={{
                        margin: "6px 0 0 0",
                        color: "var(--brand)",
                        opacity: 0.95,
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                      title={pin.address || pin.displayName}
                    >
                      {formatAddress(pin.address, pin.displayName)}
                    </p>
                  </div>

                  {pin.description && (
                    <div className="addr-row" style={{ alignItems: "flex-start" }}>
                      <span className="addr-chip description-chip">📝 Description</span>
                      <p
                        className="description-text"
                        style={{
                          margin: "6px 0 0 0",
                          fontSize: "13px",
                          color: "var(--muted)",
                          opacity: 0.95,
                          lineHeight: "1.5",
                          fontWeight: "400",
                        }}
                      >
                        {pin.description}
                      </p>
                    </div>
                  )}

                  {/* Expiration badge for temporary pins */}
                  {pin.expires_at && (
                    <div style={{ 
                      marginTop: "6px",
                      display: "inline-block",
                      padding: "2px 6px",
                      background: "rgba(255, 193, 7, 0.2)",
                      borderRadius: "4px",
                      fontSize: "10px",
                      color: "#ffc107",
                      fontWeight: "600",
                      border: "1px solid rgba(255, 193, 7, 0.4)"
                    }}>
                      ⏰ {formatExpirationTime(pin.expires_at)}
                    </div>
                  )}
                </div>
              </div>

              <div className="pin-actions" style={{ marginTop: "8px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    //use originalIndex, not index
                    onEdit(originalIndex); 
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // use originalIndex, not index
                    onDelete(originalIndex);
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}

        {/* Friends' pins */}
        {friendsPins.map((pin, index) => {
          const friendName = friendUsernames[pin.user_id] || "Friend";
          const friendColor = friendColors[pin.user_id] || "var(--brand)";
          return (
            <article
              key={`friend-${pin.id || index}`}
              className="pin-card friend-pin-card"
              onClick={() => onZoom(pin.lat, pin.lng)}
              style={{ 
                cursor: "pointer",
                borderLeft: `4px solid ${friendColor}`,
                background: "var(--panel)"
              }}
            >
              <div
                className="pin-row"
                style={{ display: "flex", 
                  gap: "8px", 
                  alignItems: "flex-start" }}
              >
                {pin.images && pin.images.length > 0 ? (
                  <img
                    src={pin.images[0]}
                    alt="thumb"
                    style={{
                      width: "72px",
                      height: "56px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "72px",
                      height: "56px",
                      borderRadius: "6px",
                      background: "var(--bg)",
                      border: "1px dashed var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--muted)",
                      opacity: 0.5,
                      fontSize: "10px",
                    }}
                  >
                    No Img
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "15px" }}>
                      {pin.name || "Untitled pin"}
                    </h3>
                  </div>
                  
                  {/* Friend badge */}
                  <div style={{ 
                    marginTop: "2px",
                    marginBottom: "4px",
                    display: "inline-block",
                    padding: "2px 6px",
                    background: `${friendColor}20`,
                    borderRadius: "4px",
                    fontSize: "11px",
                    color: friendColor,
                    fontWeight: "600",
                    border: `1px solid ${friendColor}40`
                  }}>
                    👥 {friendName}
                  </div>
                  
                  {/* DISPLAY RATING */}
                  <div style={{ marginTop: "2px" }}>
                    {renderStars(pin.rating || 0)}
                  </div>

                  <div className="addr-row">
                    <span className="addr-chip address-chip">📍 Address</span>
                    <p
                      className="addr address-text"
                      style={{
                        margin: "6px 0 0 0",
                        color: "var(--brand)",
                        opacity: 0.95,
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                      title={pin.address || pin.displayName}
                    >
                      {formatAddress(pin.address, pin.displayName)}
                    </p>
                  </div>

                  {pin.description && (
                    <div className="addr-row" style={{ alignItems: "flex-start" }}>
                      <span className="addr-chip description-chip">📝 Description</span>
                      <p
                        className="description-text"
                        style={{
                          margin: "6px 0 0 0",
                          fontSize: "13px",
                          color: "var(--muted)",
                          opacity: 0.95,
                          lineHeight: "1.5",
                          fontWeight: "400",
                        }}
                      >
                        {pin.description}
                      </p>
                    </div>
                  )}

                  {/* Expiration badge for temporary pins */}
                  {pin.expires_at && (
                    <div style={{ 
                      marginTop: "6px",
                      display: "inline-block",
                      padding: "2px 6px",
                      background: "rgba(255, 193, 7, 0.2)",
                      borderRadius: "4px",
                      fontSize: "10px",
                      color: "#ffc107",
                      fontWeight: "600",
                      border: "1px solid rgba(255, 193, 7, 0.4)"
                    }}>
                      ⏰ {formatExpirationTime(pin.expires_at)}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      
      {pins.length === 0 && friendsPins.length === 0 && (
         <p style={{ 
          textAlign: "center", 
          color: "var(--muted)", 
          opacity: 0.7,
          marginTop: "1.5rem" }}>No spots found matching your filter.</p>
      )}

      <p
        style={{
          backgroundColor: "aliceblue",
          borderRadius: "10px",
          textAlign: "center",
          padding: "10px",
          marginTop: "20px",
          color: "black",
          fontSize: "14px",
        }}
      >
        Click on "+ Add Spot" to add locations on the Map.
      </p>
    </section>
  );
}

export default Sidebar;

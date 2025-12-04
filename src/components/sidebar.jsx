import React from "react";

function Sidebar({ 
  pins, 
  originalPins, 
  onDelete, 
  onEdit, 
  onZoom, 
  onAddSpot, 
  onLocate, 
  sortOption,
  setSortOption, 
  showTop10, 
  setShowTop10 
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

  return (
    <section className="left-pane">
      <button id="add-spot-btn" className="add-spot-btn" onClick={onAddSpot}>
        + Add Spot
      </button>
      
      {/* ----------------------------- */}
      <div style={{
        marginBottom: "12px", 
        display: "flex", 
        gap: "8px", 
        flexWrap: "wrap"}}>
        <button id="btn-locate" onClick={onLocate}>
          📍 Locate me
        </button>
        <button
          onClick={() => setShowTop10(!showTop10)}
          style={{
            flex: 1,
            background: showTop10 ? "#1fcece" : "#f3f4f6",
            color: showTop10 ? "white" : "black",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          {showTop10 ? "Showing Top 10" : "Show Top 10"}
        </button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <select 
          value={sortOption} 
          onChange={(e) => setSortOption(e.target.value)}
          style={{ 
            width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #e5e7eb" }}
        >
          <option value="newest">Sort by: Newest</option>
          <option value="rating_high">Sort by: Highest Rated</option>
          <option value="rating_low">Sort by: Lowest Rated</option>
        </select>
      </div>
      {/* ----------------------------- */}

      <div className="pin-cards" id="pin-cards">
        {pins.map((pin, index) => {
          // Calculate the original index so we edit/delete the correct item
          const originalIndex = getOriginalIndex(pin);
          
          return (
            <article
              key={originalIndex} // Use originalIndex for stable keys
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
                      border: "1px solid #eee",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "72px",
                      height: "56px",
                      borderRadius: "6px",
                      background: "#f3f4f6",
                      border: "1px dashed #e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9ca3af",
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

                  <p
                    className="addr"
                    style={{
                      margin: "6px 0 0 0",
                      color: "#6b7280",
                      fontSize: "13px",
                    }}
                  >
                    {pin.address || pin.displayName || "Address unavailable"}
                  </p>

                  {pin.description && (
                    <p
                      style={{
                        margin: "6px 0 0 0",
                        fontSize: "13px",
                        color: "#111827",
                      }}
                    >
                      {pin.description}
                    </p>
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
      </div>
      
      {pins.length === 0 && (
         <p style={{ 
          textAlign: "center", 
          color: "#666", 
          marginTop: "20px" }}>No spots found matching your filter.</p>
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

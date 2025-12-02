import React from "react";

function Sidebar({ pins, onDelete, onEdit, onZoom, onAddSpot, onLocate }) {
  return (
    <section className="left-pane">
      <button id="add-spot-btn" className="add-spot-btn" onClick={onAddSpot}>
        + Add Spot
      </button>
      <button id="btn-locate" onClick={onLocate}>
        📍 Locate me
      </button>
      <div className="pin-cards" id="pin-cards">
        {pins.map((pin, index) => (
          <article
            key={index}
            className="pin-card"
            data-index={index}
            onClick={() => onZoom(pin.lat, pin.lng, index)}
            style={{ cursor: "pointer" }}
          >
            <div
              className="pin-row"
              style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}
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
                  onEdit(index);
                }}
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(index);
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
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

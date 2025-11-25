import React from "react";

export default function LeftPane({ addPin }) {
  return (
    <section className="left-pane" aria-label="Left content">
      <button onClick={() => addPin([40.7128, -74.006])} id="add-spot-btn" className="add-spot-btn">+ Add Spot</button>
      <button id="btn-locate">📍 Locate me</button>

      {/* This is where cards will appear */}
      <div id="pin-cards" className="pin-cards"></div>

      <p style={{ backgroundColor: "aliceblue", borderRadius: "10px", textAlign: "center" }}>
        Click on "+ Add Spot" to add locations on the Map.
      </p>
    </section>
  );
}




//THIS IS THE PREVIOUS VERSION, HERE FOR TESTING PURPOSES. 


// export default function LeftPane() {
//   return (
//     <>
//         {/* Left column: content */}
//         <section className="left-pane" aria-label="Left content">
//           <button id="add-spot-btn" className="add-spot-btn">+ Add Spot</button>
//           <button id="btn-locate">📍 Locate me</button>

//           {/* This is where cards will appear */}
//           <div id="pin-cards" className="pin-cards"></div>

//           {/* <p id="loc-status" aria-live="polite"></p> */}
//           <p style={{ backgroundColor: "aliceblue", borderRadius: "10px", textAlign: "center" }}>Click on "+ Add Spot" to add locations on the Map.</p>
//         </section>

//         {/* Right column: map */}
//         <section className="right-pane" aria-label="Map area">
//           {/* map is here  */}
//           <div
//             id="map"
//             className="map-canvas"
//             role="img"
//             aria-label="Map placeholder"
//           ></div>
//         </section>
//     </>    
//   );
// }
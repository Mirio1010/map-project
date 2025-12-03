import React from "react";
import "../styles/style.css";

// This is the about page for the site

function About() {
  return (
    <div className="tab-content">
      <h1>About</h1>
      <p>
        Spoty is an interactive map application where users can drop pins,
        assign tags, and add descriptions to locations they want to remember or
        share.
      </p>
      <p>
        Users can view pins from friends, filter locations by category, and
        explore only the spots that fall within their current map view. The aim
        is to create a social, personalized way to discover events, places, and
        experiences through a shared map.
      </p>
    </div>
  );
}

export default About;


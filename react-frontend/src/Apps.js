import { useState } from "react";
import "./styles/style.css";
import "./styles/cards.css";
import "./images/favicon.png";
import "leaflet/dist/leaflet.css";

import Header from "./components/Header";
import LeftPane from "./components/LeftPane";
import MapPane from "./components/MapPane";
import Footer from "./components/Footer";


export default function App() {
  const [pins, setPins] = useState([]); // React state to track Pins

  const addPin = (pos) => setPins([...pins, pos]); // Adds Pins

  return(
    <div className="app-container">
      <Header />
      <main className="layout-full">
        <LeftPane />
        <MapPane />
      </main>
      <Footer />
    </div>
    );
}
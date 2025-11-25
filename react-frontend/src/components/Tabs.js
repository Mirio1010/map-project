import React, { useState } from "react";

export default function Tabs({ tabs, onSelect }) {
    const [selectedTab, setSelectedTab] = useState(tabs[0].route);    

    function handleClick(tab) {
        setSelectedTab(tab.route);
        if (onSelect) onSelect(tab.route);
    }



  return (
    <ul className="tabs" role="tablist">
      {tabs.map((tab) => (
        <li key={tab.route} role="tab" aria-selected={selectedTab === tab.route}>
            <button
                className={selectedTab === tab.route ? "tab--active" : ""}
                onClick={() => handleClick(tab)}
            >
                {tab.label}
            </button>
        </li>
      ))}
    </ul>
);
}
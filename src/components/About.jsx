import React from "react";
import "../styles/About.css";

function About() {
    return (
        <div className="about-container">
            <h1>ABOUT US</h1>

            <section>
                <h2>Our mission</h2>
                <p>
                    Spoty is an interactive map application that transforms how people discover,
                    remember, and share locations. Our mission is to create a social, personalized
                    way for users to explore events, places, and experiences through a shared,
                    collaborative map that connects friends and communities.
                </p>
            </section>

            <section>
                <h2>Key features</h2>
                <ul>
                    <li><strong>Interactive Pin Dropping:</strong> Drop pins on any location you want to remember or share</li>
                    <li><strong>Category Organization:</strong> Assign tags and categories to organize your spots (Food & Drinks, Nightlife, Events, Activities, Shopping, etc.)</li>
                    <li><strong>Descriptions:</strong> Add detailed descriptions, images, and ratings to each location</li>
                    <li><strong>Social Sharing:</strong> View pins from friends and discover new places through their recommendations</li>
                    <li><strong>Filtering:</strong> Filter locations by category, rating, or view only spots within your current map area</li>
                    <li><strong>Rating System:</strong> Rate and review locations to help others discover the best spots</li>
                    <li><strong>Personal Collections:</strong> Build your own personalized map of favorite places</li>
                </ul>
            </section>

            <section>
                <h2>How it works</h2>
                <ol>
                    <li><strong>Sign Up:</strong> Create your account to start exploring and sharing</li>
                    <li><strong>Drop Pins:</strong> Click anywhere on the map to add a new location</li>
                    <li><strong>Add Details:</strong> Fill in the name, description, category, and rating for each spot</li>
                    <li><strong>Share with Friends:</strong> Connect with friends to see their recommended locations</li>
                    <li><strong>Explore:</strong> Browse locations by category, filter by rating, or discover what's nearby</li>
                    <li><strong>Rate & Review:</strong> Help others by rating locations you've visited</li>
                </ol>
            </section>

            <section>
                <h2>Use cases</h2>
                <div className="use-cases-grid">
                    <div className="use-case-card">
                        <h3>Travel Planning</h3>
                        <p>Mark must-visit spots before your trip and share your itinerary with travel companions</p>
                    </div>
                    <div className="use-case-card">
                        <h3>Local Discovery</h3>
                        <p>Find hidden gems and local favorites recommended by friends in your area</p>
                    </div>
                    <div className="use-case-card">
                        <h3>Event Coordination</h3>
                        <p>Share event locations and meetup spots with your group</p>
                    </div>
                    <div className="use-case-card">
                        <h3>Personal Log</h3>
                        <p>Keep track of places you've visited and want to revisit</p>
                    </div>
                </div>
            </section>

            <section>
                <h2>Technology stack</h2>
                <p>
                    Spoty is built with these web technologies to provide a fast, responsive, and reliable experience:
                </p>
                <ul>
                    <li><strong>Frontend:</strong> React, JavaScript</li>
                    <li><strong>Maps:</strong> Leaflet</li>
                    <li><strong>Backend & Database:</strong> Supabase (for location data and user contributions)</li>
                    <li><strong>Styling:</strong> Custom CSS </li>
                    <li><strong>Build System:</strong> Vite (for fast development server and production builds)</li>
                </ul>
            </section>

            <section>
                <h2>Team & credits</h2>
                <p>
                    This project is developed as part of the <strong>CUNY Tech Prep Fellowship
                        (2025–2026 11th Cohort)</strong> by a collaborative student team across multiple
                    CUNY campuses. We're passionate about creating tools that bring people
                    together and make exploration easier.
                </p>
            </section>

            <section>
                <h2>Contact & feedback</h2>
                <p>
                    We'd love to hear from you! If you have questions, suggestions, or feedback,
                    please reach out. Your input helps us improve Spoty and make it better for everyone.
                </p>
            </section>
        </div>
    );
}

export default About;
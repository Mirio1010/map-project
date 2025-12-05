import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../utils/supabaseClient";
import { categories } from "../utils/pinCategories";
import "../styles/style.css";
import "../styles/explore.css";

/**
 * Explore Component
 * 
 * Displays a scrollable list of places pinned by OTHER users (excludes current user's pins).
 * Places are sorted by rating by default, with filtering capabilities.
 * Each place is shown in a card with image, description, rating, and other information.
 */
function Explore() {
  // State for pins from friends only
  const [friendsPins, setFriendsPins] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [friendIds, setFriendIds] = useState([]);
  
  // State for filter modal visibility
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // State for filter options
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(5);
  const [sortBy, setSortBy] = useState("rating"); // "rating", "name", "newest", "distance"
  
  // State for user's current location (for "near me" functionality)
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  /**
   * Load current user ID and friends list on component mount
   */
  useEffect(() => {
    const loadUserAndFriends = async () => {
      try {
        // Get current authenticated user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error getting user:", userError.message);
          setFriendsPins([]);
          return;
        }

        if (!user) {
          // Not logged in - no friends pins to show
          setFriendsPins([]);
          return;
        }

        // Store current user ID
        setCurrentUserId(user.id);

        // Load user's friends list
        const { data: friendsData, error: friendsError } = await supabase
          .from("friends")
          .select("friend_id")
          .eq("user_id", user.id);

        if (friendsError) {
          console.error("Error loading friends:", friendsError.message);
          setFriendIds([]);
          return;
        }

        const friendIdsList = (friendsData || []).map((f) => f.friend_id);
        setFriendIds(friendIdsList);
      } catch (err) {
        console.error("Unexpected error loading user and friends:", err);
        setFriendIds([]);
      }
    };

    loadUserAndFriends();
  }, []);

  /**
   * Load pins from friends when friendIds changes
   */
  useEffect(() => {
    const loadFriendsPins = async () => {
      if (!currentUserId || friendIds.length === 0) {
        setFriendsPins([]);
        return;
      }

      try {
        // Load pins from friends only
        // Use .in() to filter by multiple friend IDs
        const { data, error } = await supabase
          .from("locations")
          .select("*")
          .in("user_id", friendIds) // Only pins from friends
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading friends pins:", error.message);
          setFriendsPins([]);
        } else {
          setFriendsPins(data || []);
        }
      } catch (err) {
        console.error("Unexpected error loading friends pins:", err);
        setFriendsPins([]);
      }
    };

    loadFriendsPins();
  }, [currentUserId, friendIds]);

  /**
   * Request user's current location on component mount
   * This enables the "near me" sorting feature
   */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setLocationError(error.message);
          console.warn("Could not get user location:", error);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   * 
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in kilometers
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * Filter and sort places based on selected filters and sort option
   * Uses useMemo to optimize performance and avoid recalculating on every render
   */
  const filteredAndSortedPlaces = useMemo(() => {
    // Start with pins from friends
    let filtered = [...friendsPins];

    // Apply category filter
    // If categories are selected, only show places matching those categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((pin) =>
        selectedCategories.includes(pin.category)
      );
    }

    // Apply rating filter
    // Only show places with rating between minRating and maxRating
    filtered = filtered.filter((pin) => {
      const rating = pin.rating || 0;
      return rating >= minRating && rating <= maxRating;
    });

    // Sort places based on selected sort option
    filtered.sort((a, b) => {
      if (sortBy === "rating") {
        // Sort by rating (highest first) - default sort
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === "name") {
        // Sort alphabetically by name
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      } else if (sortBy === "newest") {
        // Sort by creation date (newest first)
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      } else if (sortBy === "distance" && userLocation) {
        // Sort by distance from user (nearest first)
        const distA = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          a.lat,
          a.lng
        );
        const distB = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          b.lat,
          b.lng
        );
        return distA - distB;
      }
      return 0;
    });

    return filtered;
  }, [friendsPins, selectedCategories, minRating, maxRating, sortBy, userLocation]);

  /**
   * Toggle category selection in filter
   * 
   * @param {string} category - Category value to toggle
   */
  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  /**
   * Reset all filters to default values
   */
  const resetFilters = () => {
    setSelectedCategories([]);
    setMinRating(0);
    setMaxRating(5);
    setSortBy("rating");
  };

  /**
   * Render star rating display
   * 
   * @param {number} rating - Rating value (0-5)
   * @returns {JSX.Element} Star rating display
   */
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="star-rating">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} className="star star-full">
            ★
          </span>
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <span className="star star-half">★</span>
        )}
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} className="star star-empty">
            ☆
          </span>
        ))}
        {/* Display numeric rating */}
        <span className="rating-number">({rating || 0})</span>
      </div>
    );
  };

  /**
   * Get category label from category value
   * 
   * @param {string} categoryValue - Category value
   * @returns {string} Category label
   */
  const getCategoryLabel = (categoryValue) => {
    const category = categories.find((cat) => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  /**
   * Format distance for display
   * 
   * @param {number} distance - Distance in kilometers
   * @returns {string} Formatted distance string
   */
  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  return (
    <div className="explore-page-wrapper">
      <div className="explore-container">
        {/* Header section with title and filter button */}
        <div className="explore-header">
          <div className="explore-header-content">
            <h1>Explore Places</h1>
            <p className="explore-subtitle">
              Discover places shared by your friends, sorted by rating
            </p>
          </div>
          <button
            className="filter-button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-label="Toggle filters"
          >
            <span className="filter-icon">🔍</span>
            Filters
            {selectedCategories.length > 0 || minRating > 0 || maxRating < 5 ? (
              <span className="filter-badge">
                {selectedCategories.length +
                  (minRating > 0 ? 1 : 0) +
                  (maxRating < 5 ? 1 : 0)}
              </span>
            ) : null}
          </button>
        </div>

        {/* Filter panel - shown when filter button is clicked */}
        {isFilterOpen && (
          <div className="filter-panel">
            <div className="filter-panel-header">
              <h2>Filter Places</h2>
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
                <option value="distance">Distance (Nearest First)</option>
                <option value="name">Name (A-Z)</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {/* Category filter */}
            <div className="filter-section">
              <label className="filter-label">Categories</label>
              <div className="category-checkboxes">
                {categories.map((category) => (
                  <label key={category.value} className="category-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.value)}
                      onChange={() => toggleCategory(category.value)}
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
              <button className="reset-filters-button" onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="results-info">
          <p>
            Showing <strong>{filteredAndSortedPlaces.length}</strong>{" "}
            {filteredAndSortedPlaces.length === 1 ? "place" : "places"}
          </p>
        </div>

        {/* Scrollable list of place cards */}
        <div className="places-list">
        {friendIds.length === 0 ? (
          <div className="no-results">
            <p>You haven't added any friends yet.</p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.9375rem", opacity: 0.8 }}>
              Go to your Profile page to add friends by email and see their pinned places here!
            </p>
          </div>
        ) : filteredAndSortedPlaces.length === 0 ? (
          <div className="no-results">
            <p>No places found matching your filters.</p>
            <button className="reset-filters-button" onClick={resetFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
            filteredAndSortedPlaces.map((place, index) => (
              <div key={place.id || index} className="place-card">
                {/* Place image */}
                <div className="place-card-image">
                  {place.images && place.images.length > 0 ? (
                    <img
                      src={place.images[0]}
                      alt={place.name || "Place image"}
                      loading="lazy"
                    />
                  ) : (
                    <div className="place-card-image-placeholder">
                      <span>📷</span>
                      <p>No image</p>
                    </div>
                  )}
                  {/* Category badge */}
                  {place.category && (
                    <div className="category-badge">
                      {getCategoryLabel(place.category)}
                    </div>
                  )}
                </div>

                {/* Place information */}
                <div className="place-card-content">
                  <div className="place-card-header">
                    <h2 className="place-card-title">
                      {place.name || "Unnamed Place"}
                    </h2>
                    {/* Rating display */}
                    {renderStars(place.rating)}
                  </div>

                  {/* Address */}
                  {place.address && (
                    <p className="place-card-address">
                      📍 {place.address}
                    </p>
                  )}

                  {/* Distance from user (if location is available) */}
                  {userLocation && place.lat && place.lng && (
                    <p className="place-card-distance">
                      {formatDistance(
                        calculateDistance(
                          userLocation.lat,
                          userLocation.lng,
                          place.lat,
                          place.lng
                        )
                      )}
                    </p>
                  )}

                  {/* Description */}
                  {place.description && (
                    <p className="place-card-description">{place.description}</p>
                  )}

                  {/* Additional info */}
                  <div className="place-card-footer">
                    <span className="place-card-category">
                      {place.category && getCategoryLabel(place.category)}
                    </span>
                    {place.created_at && (
                      <span className="place-card-date">
                        Added: {new Date(place.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Explore;

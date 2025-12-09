import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../utils/supabaseClient";
import { categories } from "../utils/pinCategories";
import FriendsSection from "./FriendsSection";
import "../styles/style.css";
import "../styles/explore.css";
import "../styles/profile.css";
import "../styles/friends.css";

/**
 * Profile Component
 * 
 * Displays user profile information, settings, and the user's own pinned places.
 * Includes sections for profile picture, email, username, and a scrollable list
 * of places the user has pinned, sorted by rating.
 */
function Profile() {
  // State for user profile data
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // State for user's pins
  const [userPins, setUserPins] = useState([]);

  // State for friends list (friend IDs)
  const [friendIds, setFriendIds] = useState([]);
  const [friendProfiles, setFriendProfiles] = useState([]); // Store friend profiles

  // State for friends section visibility (dropdown)
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isViewFriendsOpen, setIsViewFriendsOpen] = useState(false);

  // State for filter modal visibility
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // State for filter options
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(5);
  const [sortBy, setSortBy] = useState("rating");

  /**
   * Load user profile data and pins on component mount
   */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Get authenticated user
        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !authUser) {
          console.error("Error getting user:", userError?.message);
          return;
        }

        setUser(authUser);
        setEmail(authUser.email || "");

        // Load profile data from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profileError) {
          console.error("Error loading profile:", profileError.message);
        } else if (profileData) {
          setProfile(profileData);
          setUsername(profileData.username || "");
          setProfilePicture(profileData.profile_picture || null);
        }

        // Load user's pins
        const { data: pinsData, error: pinsError } = await supabase
          .from("locations")
          .select("*")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false });

        if (pinsError) {
          console.error("Error loading pins:", pinsError.message);
          setUserPins([]);
        } else {
          setUserPins(pinsData || []);
        }

        // Load friends list
        const { data: friendsData, error: friendsError } = await supabase
          .from("friends")
          .select("friend_id")
          .eq("user_id", authUser.id);

        if (!friendsError && friendsData) {
          const friendIdsList = friendsData.map((f) => f.friend_id);
          setFriendIds(friendIdsList);
          
          // Load friend profiles
          if (friendIdsList.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from("profiles")
              .select("id, username, email, profile_picture")
              .in("id", friendIdsList);
            
            if (!profilesError && profilesData) {
              setFriendProfiles(profilesData);
            }
          } else {
            setFriendProfiles([]);
          }
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      }
    };

    loadProfile();
  }, []);

  /**
   * Handle username update
   */
  const handleUpdateUsername = async () => {
    if (!user || !username.trim()) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: username.trim() })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating username:", error.message);
        alert("Failed to update username. Please try again.");
      } else {
        setIsEditingUsername(false);
        setProfile({ ...profile, username: username.trim() });
      }
    } catch (err) {
      console.error("Unexpected error updating username:", err);
      alert("Failed to update username. Please try again.");
    }
  };

  /**
   * Handle profile picture upload
   */
  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB.");
      return;
    }

    setIsUploadingPicture(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase storage (assuming you have a 'avatars' bucket)
      // Note: You'll need to create this bucket in Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile_pictures")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading picture:", uploadError.message);
        alert("Failed to upload picture. Please try again.");
        setIsUploadingPicture(false);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile_pictures").getPublicUrl(filePath);

      // Update profile with new picture URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_picture: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError.message);
        alert("Failed to update profile. Please try again.");
      } else {
        setProfilePicture(publicUrl);
        setProfile({ ...profile, profile_picture: publicUrl });
      }
    } catch (err) {
      console.error("Unexpected error uploading picture:", err);
      alert("Failed to upload picture. Please try again.");
    } finally {
      setIsUploadingPicture(false);
    }
  };

  /**
   * Calculate distance between two coordinates using Haversine formula
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
   * Filter and sort user's pins
   */
  const filteredAndSortedPlaces = useMemo(() => {
    let filtered = [...userPins];

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((pin) =>
        selectedCategories.includes(pin.category)
      );
    }

    // Apply rating filter
    filtered = filtered.filter((pin) => {
      const rating = pin.rating || 0;
      return rating >= minRating && rating <= maxRating;
    });

    // Sort places
    filtered.sort((a, b) => {
      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === "name") {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      } else if (sortBy === "newest") {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      }
      return 0;
    });

    return filtered;
  }, [userPins, selectedCategories, minRating, maxRating, sortBy]);

  /**
   * Toggle category selection in filter
   */
  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  /**
   * Reset all filters
   */
  const resetFilters = () => {
    setSelectedCategories([]);
    setMinRating(0);
    setMaxRating(5);
    setSortBy("rating");
  };

  /**
   * Render star rating display
   */
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="star-rating">
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} className="star star-full">
            ★
          </span>
        ))}
        {hasHalfStar && <span className="star star-half">★</span>}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} className="star star-empty">
            ☆
          </span>
        ))}
        <span className="rating-number">({rating || 0})</span>
      </div>
    );
  };

  /**
   * Get category label from category value
   */
  const getCategoryLabel = (categoryValue) => {
    const category = categories.find((cat) => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        {/* Profile Information Section */}
        <div className="profile-info-section">
          <div className="profile-header">
            <h1>My Profile</h1>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                className="friends-toggle-button"
                onClick={() => setIsViewFriendsOpen(!isViewFriendsOpen)}
                aria-label="View friends list"
                title="View your friends"
              >
                <span className="friends-icon">👥</span>
                View Friends
                <span className={`friends-arrow ${isViewFriendsOpen ? "open" : ""}`}>
                  ▼
                </span>
              </button>
              <button
                className="friends-toggle-button"
                onClick={() => setIsFriendsOpen(!isFriendsOpen)}
                aria-label="Toggle friends section"
                title="Add friends"
              >
                <span className="friends-icon">➕</span>
                Add Friend
                <span className={`friends-arrow ${isFriendsOpen ? "open" : ""}`}>
                  ▼
                </span>
              </button>
            </div>
          </div>

          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <div className="profile-picture-container">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="profile-picture"
                />
              ) : (
                <div className="profile-picture-placeholder">
                  <span>👤</span>
                </div>
              )}
              <label className="profile-picture-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  disabled={isUploadingPicture}
                  style={{ display: "none" }}
                />
                {isUploadingPicture ? "Uploading..." : "Change Picture"}
              </label>
            </div>
          </div>

          {/* User Information */}
          <div className="profile-details">
            <div className="profile-detail-item">
              <label>Email</label>
              <p>{email || "Not available"}</p>
            </div>

            <div className="profile-detail-item">
              <label>Username</label>
              {isEditingUsername ? (
                <div className="username-edit">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="username-input"
                  />
                  <button
                    onClick={handleUpdateUsername}
                    className="save-username-button"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingUsername(false);
                      setUsername(profile?.username || "");
                    }}
                    className="cancel-username-button"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="username-display">
                  <p>{username || "Not set"}</p>
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="edit-username-button"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Friends Modal */}
        {isViewFriendsOpen && (
          <>
            <div className="friends-modal-backdrop" onClick={() => setIsViewFriendsOpen(false)}></div>
            <div className="friends-modal">
              <div className="friends-modal-header">
                <h3>My Friends ({friendProfiles.length})</h3>
                <button
                  className="friends-modal-close"
                  onClick={() => setIsViewFriendsOpen(false)}
                  aria-label="Close friends list"
                >
                  ✕
                </button>
              </div>
              <div className="friends-modal-content" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                {friendProfiles.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--muted)", opacity: 0.7, padding: "2rem" }}>
                    You haven't added any friends yet. Use the "Add Friend" button to add friends by email.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {friendProfiles.map((friend) => (
                      <div
                        key={friend.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                          padding: "1rem",
                          background: "var(--panel)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px"
                        }}
                      >
                        {friend.profile_picture ? (
                          <img
                            src={friend.profile_picture}
                            alt={friend.username || friend.email}
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              objectFit: "cover"
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              background: "var(--bg)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.5rem"
                            }}
                          >
                            👤
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: "600", color: "var(--muted)" }}>
                            {friend.username || "No username"}
                          </p>
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "var(--muted)", opacity: 0.7 }}>
                            {friend.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Friends Section - Modal Overlay */}
        {isFriendsOpen && (
          <FriendsSection
            currentUserId={user?.id}
            onFriendsChange={(ids) => {
              setFriendIds(ids);
              // Reload friend profiles when friends change
              if (ids.length > 0) {
                supabase
                  .from("profiles")
                  .select("id, username, email, profile_picture")
                  .in("id", ids)
                  .then(({ data, error }) => {
                    if (!error && data) {
                      setFriendProfiles(data);
                    }
                  });
              } else {
                setFriendProfiles([]);
              }
            }}
            onClose={() => setIsFriendsOpen(false)}
          />
        )}

        {/* My Places Section */}
        <div className="my-places-section">
          <div className="explore-header">
            <div className="explore-header-content">
              <h2>My Places</h2>
              <p className="explore-subtitle">
                Places you've pinned, sorted by rating
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

          {/* Filter panel */}
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
            {filteredAndSortedPlaces.length === 0 ? (
              <div className="no-results">
                <p>No places found matching your filters.</p>
                <button className="reset-filters-button" onClick={resetFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredAndSortedPlaces.map((place, index) => (
                <div key={place.id || index} className="place-card">
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
                    {place.category && (
                      <div className="category-badge">
                        {getCategoryLabel(place.category)}
                      </div>
                    )}
                  </div>

                  <div className="place-card-content">
                    <div className="place-card-header">
                      <h2 className="place-card-title">
                        {place.name || "Unnamed Place"}
                      </h2>
                      {renderStars(place.rating)}
                    </div>

                    {place.address && (
                      <p className="place-card-address">📍 {place.address}</p>
                    )}

                    {place.description && (
                      <p className="place-card-description">
                        {place.description}
                      </p>
                    )}

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
    </div>
  );
}

export default Profile;

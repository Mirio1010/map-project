import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import "../styles/friends.css";

/**
 * FriendsSection Component
 * 
 * Modal overlay for managing friends. Allows users to:
 * - Add friends by email
 * 
 * @param {Object} props - Component props
 * @param {string} props.currentUserId - Current user's ID
 * @param {Function} props.onFriendsChange - Callback when friends list changes
 * @param {Function} props.onClose - Callback to close the modal
 */
function FriendsSection({ currentUserId, onFriendsChange, onClose }) {
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [addFriendError, setAddFriendError] = useState(null);
  const [addFriendSuccess, setAddFriendSuccess] = useState(null);

  /**
   * Load user's friends list when friend is added
   * This is called after successfully adding a friend to update the parent
   */
  const loadFriends = async () => {
    if (!currentUserId) return;

    try {
      const { data: friendsData, error: friendsError } = await supabase
        .from("friends")
        .select("friend_id")
        .eq("user_id", currentUserId);

      if (friendsError) {
        console.error("Error loading friends:", friendsError.message);
        return;
      }

      const friendIds = (friendsData || []).map((item) => item.friend_id);

      // Notify parent component of friends change
      if (onFriendsChange) {
        onFriendsChange(friendIds);
      }
    } catch (err) {
      console.error("Unexpected error loading friends:", err);
    }
  };

  /**
   * Add a new friend by email
   * 
   * @param {Event} e - Form submit event
   */
  const handleAddFriend = async (e) => {
    e.preventDefault();
    setAddFriendError(null);
    setAddFriendSuccess(null);

    if (!newFriendEmail.trim()) {
      setAddFriendError("Please enter an email address");
      return;
    }

    if (!currentUserId) {
      setAddFriendError("You must be logged in to add friends");
      return;
    }

    setIsAddingFriend(true);

    try {
      // First, find the user by email
      // Note: We need to query auth.users through a function or use profiles table
      // If profiles table has email, use that. Otherwise, we'll need a different approach.
      // For now, let's try to find by email in profiles table
      let friendProfile = null;
      let profileError = null;

      // Try to find user by email in profiles table
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("id, email, username")
        .eq("email", newFriendEmail.trim().toLowerCase())
        .single();

      if (profileErr || !profileData) {
        // If profiles table doesn't have email or user not found,
        // we need to get user ID from auth.users via a database function
        // For now, show error - you may need to create a database function
        setAddFriendError("User with this email not found. Make sure the user has signed up and their email is in the profiles table.");
        setIsAddingFriend(false);
        return;
      }

      friendProfile = profileData;

      if (profileError || !friendProfile) {
        setAddFriendError("User with this email not found");
        setIsAddingFriend(false);
        return;
      }

      // Check if trying to add yourself
      if (friendProfile.id === currentUserId) {
        setAddFriendError("You cannot add yourself as a friend");
        setIsAddingFriend(false);
        return;
      }

      // Check if already friends
      const { data: existingFriend, error: checkError } = await supabase
        .from("friends")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("friend_id", friendProfile.id)
        .single();

      if (existingFriend) {
        setAddFriendError("This user is already in your friends list");
        setIsAddingFriend(false);
        return;
      }

      // Add friend relationship
      const { error: addError } = await supabase.from("friends").insert({
        user_id: currentUserId,
        friend_id: friendProfile.id,
        created_at: new Date().toISOString(),
      });

      if (addError) {
        console.error("Error adding friend:", addError.message);
        setAddFriendError("Failed to add friend. Please try again.");
        setIsAddingFriend(false);
        return;
      }

      // Success - update friends list
      setAddFriendSuccess(`Successfully added ${friendProfile.username || friendProfile.email} as a friend!`);
      setNewFriendEmail("");

      // Reload friends list and notify parent
      await loadFriends();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setAddFriendSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Unexpected error adding friend:", err);
      setAddFriendError("An unexpected error occurred. Please try again.");
    } finally {
      setIsAddingFriend(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay - blocks interaction with rest of page */}
      <div className="friends-modal-backdrop" onClick={onClose}></div>

      {/* Modal content */}
      <div className="friends-modal">
        <div className="friends-modal-header">
          <h3>Add Friend</h3>
          <button
            className="friends-modal-close"
            onClick={onClose}
            aria-label="Close friends modal"
          >
            ✕
          </button>
        </div>

        <div className="friends-modal-content">
          <p className="friends-description">
            Add friends by email to see their pinned places on the Explore page.
          </p>

          {/* Add Friend Form */}
          <form onSubmit={handleAddFriend} className="add-friend-form">
            <div className="add-friend-input-group">
              <input
                type="email"
                value={newFriendEmail}
                onChange={(e) => {
                  setNewFriendEmail(e.target.value);
                  setAddFriendError(null);
                  setAddFriendSuccess(null);
                }}
                placeholder="Enter friend's email"
                className="add-friend-input"
                disabled={isAddingFriend}
                autoFocus
              />
              <button
                type="submit"
                className="add-friend-button"
                disabled={isAddingFriend}
              >
                {isAddingFriend ? "Adding..." : "Add Friend"}
              </button>
            </div>

            {/* Error message */}
            {addFriendError && (
              <div className="friend-message friend-error">{addFriendError}</div>
            )}

            {/* Success message */}
            {addFriendSuccess && (
              <div className="friend-message friend-success">
                {addFriendSuccess}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

export default FriendsSection;


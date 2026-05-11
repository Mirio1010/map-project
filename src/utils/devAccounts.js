import { supabase } from "./supabaseClient";

/** Curated team account for “Add Spoty Team” (Explore + tutorial). */
export const DEV_ACCOUNTS = [
  {
    username: "Federico.a.2399@gmail.com",
    id: "accc6b62-522b-40ae-968e-bc25b334d505",
    publicLabel: "Spoty Team",
  },
];

/**
 * Explore-step body copy pointing newcomers at the team account.
 */
export function buildExploreFollowBodyText() {
  const label = DEV_ACCOUNTS[0]?.publicLabel || "Spoty Team";
  return `Add a friend to get started! ${label} has already added some spots — add us below so your map isn't empty from day one.`;
}

/**
 * Insert the curated team friend row. Duplicate key counts as success for UX.
 * @param {string} userId — current Supabase user id
 * @returns {Promise<{ ok: boolean; duplicate?: boolean; error?: Error }>}
 */
export async function addDevAccountFriend(userId) {
  const teamId = DEV_ACCOUNTS[0]?.id;
  if (!userId || !teamId) {
    return { ok: false, error: new Error("Missing user or team id") };
  }

  const { error } = await supabase.from("friends").insert({
    user_id: userId,
    friend_id: teamId,
  });

  if (!error) {
    return { ok: true, duplicate: false };
  }

  const code = error.code;
  const msgLower = String(error.message || "").toLowerCase();
  if (code === "23505" || msgLower.includes("duplicate") || msgLower.includes("unique")) {
    return { ok: true, duplicate: true };
  }

  console.error("addDevAccountFriend:", error);
  return { ok: false, error };
}

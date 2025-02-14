import supabase from "../supabase-client.js";

/**
 * @function signOut
 * @description Signs out the current user.
 * @async
 * @returns {Promise<void>}
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = "login.html";
  } catch (error) {
    console.error("Error signing out:", error.message);
  }
}

/**
 * @function checkAuth
 * @description Checks if a user is currently authenticated.
 *              If not, it displays an authentication modal.
 * @async
 * @returns {Promise<boolean>} - True if the user is authenticated, false otherwise.
 */
export async function checkAuth() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      // Show modal instead of redirecting
      const modal = document.getElementById("auth-modal");
      if (modal) {
        modal.classList.remove("hidden");
      }
      return false;
    }
    return true;
  } catch (error) {
    console.error("Auth error:", error);
    const modal = document.getElementById("auth-modal");
    if (modal) {
      modal.classList.remove("hidden");
    }
    return false;
  }
}

/**
 * @function getUserData
 * @description Retrieves the current user's data.
 * @async
 * @returns {Promise<object|null>} - The user object if authenticated, null otherwise.
 */
export async function getUserData() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

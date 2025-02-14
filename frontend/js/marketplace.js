/**
 * @module marketplace
 * @description This module handles the logic for the marketplace page, including authentication checks,
 *              user data fetching, and displaying user information.
 */

import { signOut, checkAuth } from "./services/auth-service.js";
import supabase from "./supabase-client.js";

/**
 * @function handleSignOut
 * @description Signs out the user and redirects them to the index page.
 *              This function is made globally available so it can be called from the HTML.
 * @async
 * @returns {Promise<void>}
 */
window.handleSignOut = async () => {
  await signOut();
};

/**
 * @function initializeMarketplace
 * @description Initializes the marketplace page by checking authentication status and fetching user data.
 *              If the user is authenticated, their information is displayed.
 *              If not, the authentication modal is shown.
 * @async
 * @returns {Promise<void>}
 */
async function initializeMarketplace() {
  const loadingElement = document.getElementById("loading");
  const userDataContainer = document.getElementById("user-data");

  try {
    /**
     * @constant {boolean} isAuthenticated
     * @description Checks if the user is authenticated. If not, the function returns early,
     *              preventing further execution.
     */
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;

    /**
     * @constant {object} userResponse
     * @description Fetches the user data from Supabase.
     */
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;

    if (user) {
      userDataContainer.innerHTML = `
                        <div class="user-info">
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Member since:</strong> ${new Date(
                              user.created_at
                            ).toLocaleDateString()}</p>
                        </div>
                    `;
    }
  } catch (error) {
    console.error("Error:", error);
    userDataContainer.innerHTML = `
                    <div class="error-message">
                        Failed to load user data. Please try again later.
                    </div>
                `;
  } finally {
    loadingElement.style.display = "none";
  }
}

/**
 * @listens DOMContentLoaded
 * @description Initializes the marketplace when the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", initializeMarketplace);

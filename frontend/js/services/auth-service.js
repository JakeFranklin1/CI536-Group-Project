import supabase from "../supabase-client.js";

/**
 * @function signOut
 * @description Signs out the current user and redirects to login page
 * @async
 * @returns {Promise<void>}
 */
export async function signOut() {
    try {
        // Try the Supabase signOut
        const { error } = await supabase.auth.signOut();

        // Even if there's an error, continue with cleanup and redirect
        if (error) {
            console.warn("Supabase sign out had an error:", error.message);
        }
    } catch (error) {
        console.error("Error during sign out process:", error.message);
    } finally {
        // Force clean any potential storage items that might be causing the issue
        // This ensures clean logout even if the API call fails
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.expires_at');
        sessionStorage.clear();
        localStorage.clear();

        console.log("Attempting redirect to login.html from signOut...");
        window.location.href = "login.html";
        // Fallback in case redirect is blocked
        setTimeout(() => {
            if (window.location.pathname.indexOf("login.html") === -1) {
                console.warn("Redirect to login.html failed, forcing reload...");
                window.location.assign("login.html");
            }
        }, 6000);
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
    const modal = document.getElementById("auth-modal"); // Get modal element once
    // Log if modal element was found
    if (!modal) {
        console.error("CRITICAL: Auth modal element (#auth-modal) not found in the DOM!");
        return false; // Can't proceed without the modal
    } else {
        console.log("Auth modal element found:", modal);
    }


    try {
        console.log("Attempting to get user..."); // Log: Start check
        const { data: { user }, error } = await supabase.auth.getUser();

        // Handle potential errors during getUser call
        if (error) {
            console.error("Auth check error:", error.message);
            console.log("Attempting to show modal due to error..."); // Log
            modal.classList.remove("hidden");
            console.log("Modal classes after attempting removal (error case):", modal.className); // Log classes
            return false;
        }

        if (!user) {
            console.log("No user session found."); // Log: No user
            console.log("Attempting to show modal because no user found..."); // Log
            modal.classList.remove("hidden");
            console.log("Modal classes after attempting removal (no user case):", modal.className); // Log classes
            return false; // User is not authenticated
        }

        console.log("User session found:", user.email); // Log: User found
        // If user exists, ensure modal is hidden
        modal.classList.add("hidden");
        console.log("Modal hidden as user is authenticated."); // Log
        return true; // User is authenticated

    } catch (error) {
        // Catch any unexpected errors
        console.error("Unexpected error during auth check:", error);
        console.log("Attempting to show modal due to unexpected error..."); // Log
        if(modal) {
             modal.classList.remove("hidden");
             console.log("Modal classes after attempting removal (catch block):", modal.className); // Log classes
        }
        return false;
    }
}

export async function checkAuthAndRedirect(redirectPath) {
    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error) {
            console.error("Auth check error:", error.message);
            return;
        }

        if (user) {
            console.log("User authenticated, redirecting...");
            window.location.href = redirectPath;
        }
    } catch (error) {
        console.error("Authentication check failed:", error.message);
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

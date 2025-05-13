/**
 * @module marketplace
 * @description Main entry point for the marketplace page - imports and initializes all modules
 */

// Import core services
import { signOut, checkAuth } from "./services/auth-service.js";
import { loadGames } from "./services/GameService.js";

// Import UI modules
import { initializeUI, handleBrandClick } from "./modules/ui-initialiser.js";
import {
    setupYearPickerButton,
    initializeYearPicker,
} from "./modules/year-picker.js";
import { setupLoadMoreButton } from "./modules/pagination.js";
import { handleFilterSelection } from "./modules/filter-handler.js";
import { addItemToCart } from "./modules/cart-handler.js";
import { showGameDetails } from "./modules/game-details.js";
import { showAccountSettings } from "./modules/account-settings.js";

/**
 * @function initializeMarketplace
 * @description Initializes the marketplace page by checking authentication status and fetching user data
 * @async
 * @returns {Promise<boolean>} Whether authentication was successful
 */
async function initializeMarketplace() {
    try {
        console.log("Checking authentication..."); // Log
        const isAuthenticated = await checkAuth();
        console.log("Is authenticated:", isAuthenticated); // Log
        return isAuthenticated;
    } catch (error) {
        console.error("Authentication error:", error);
        return false;
    }
}

/**
 * @listens DOMContentLoaded
 * @description Initializes the marketplace when the DOM is fully loaded
 */
document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOMContentLoaded event fired."); // Log
    const loadingSpinner = document.getElementById("loading");
    if (loadingSpinner) loadingSpinner.classList.remove("hidden"); // Show loading spinner

    // Check authentication first
    const isAuthenticated = await initializeMarketplace();

    // If not authenticated, stop further execution for marketplace features.
    // checkAuth should handle showing the modal.
    if (!isAuthenticated) {
        console.log(
            "User not authenticated. Stopping marketplace initialization."
        ); // Log
        if (loadingSpinner) loadingSpinner.classList.add("hidden"); // Hide loading spinner
        return; // Stop execution here
    }

    console.log("User authenticated. Initializing marketplace..."); // Log

    // --- Code below only runs if authenticated ---

    // Set up year picker button
    setupYearPickerButton();

    // Load initial games
    loadGames({ timeframe: "Popular in 2025" }, 24, false, addItemToCart);

    // Initialize all UI components and functionality
    initializeUI();
    initializeYearPicker();
    setupLoadMoreButton();

    // Set brand container click handler
    const brandContainer = document.querySelector(".brand-container");
    if (brandContainer) {
        brandContainer.addEventListener("click", handleBrandClick);
    }

    // Find the profile button using the settings-btn class instead of :has() selector
    const profileButton = document.querySelector(".settings-btn");

    // If the profile button exists, add click event listener
    if (profileButton) {
        profileButton.addEventListener("click", function () {
            showAccountSettings();
        });
    }

    // Make essential functions available globally for HTML event handlers
    window.addItemToCart = addItemToCart;
    window.showGameDetails = showGameDetails;
    window.handleFilterSelection = handleFilterSelection;

    window.handleSignOut = async function () {
        try {
            await signOut();
        } catch (error) {
            console.error("Error signing out:", error);
            alert("Failed to sign out. Please try again.");
        }
    };

    // Hide loading spinner after setup
    if (loadingSpinner) loadingSpinner.classList.add("hidden");
});

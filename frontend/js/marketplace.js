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
            // Extract only needed user data
            const filteredUserData = {
                email: user.email,
                id: user.id,
                confirmed_at: user.confirmed_at,
            };

            console.log("User Data:", filteredUserData);
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
 * @function handleBrandClick
 * @description Handles the click event on the brand container. Navigates to marketplace.html if not already there,
 *              otherwise displays a toast message.
 */
function handleBrandClick() {
    if (window.location.pathname.endsWith("marketplace.html")) {
        showToast("You are already on the marketplace page.");
    } else {
        window.location.href = "marketplace.html";
    }
}

/**
 * @function showToast
 * @description Displays a toast message.
 * @param {string} message - The message to display in the toast.
 */
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("show");
    }, 100);
    setTimeout(() => {
        toast.classList.remove("show");
        document.body.removeChild(toast);
    }, 3000);
}

/**
 * @function setSelectedNavItem
 * @description Sets the selected state for navigation items based on current page
 */
function setSelectedNavItem() {
    const currentPath = window.location.pathname;
    const allNavItems = document.querySelectorAll(".filter-section ul li");

    // Remove selected class from all items
    allNavItems.forEach((item) => item.classList.remove("selected"));

    // Set selected based on current path
    if (currentPath.includes("about.html")) {
        document
            .querySelector('a[href="about.html"]')
            .parentElement.classList.add("selected");
    } else if (currentPath.includes("profile.html")) {
        document
            .querySelector('a[href="profile.html"]')
            .parentElement.classList.add("selected");
    }

    // Add click handlers for filter buttons
    const filterButtons = document.querySelectorAll(".filter-section button");
    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // Remove selected from ALL items across ALL filter sections
            const allListItems =
                document.querySelectorAll(".filter-section li");
            allListItems.forEach((item) => item.classList.remove("selected"));

            // Add selected to clicked item
            button.parentElement.classList.add("selected");
        });
    });
}

function initializeMobileMenu() {
    const hamburger = document.querySelector(".hamburger-menu");
    const sideNav = document.querySelector(".side-nav");

    hamburger?.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        sideNav?.classList.toggle("active");

        // Remove box-shadow when active
        if (hamburger.classList.contains("active")) {
            hamburger.style.boxShadow = "none";
        } else {
            hamburger.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"; // Restore default shadow
        }
    });
}

/**
 * @function generateGameCards
 * @description Generates multiple game cards and adds them to the games grid
 * @param {number} count - Number of cards to generate
 */
function generateGameCards(count) {
    const gamesGrid = document.querySelector(".games-grid");

    // Check if gamesGrid exists before proceeding
    if (gamesGrid) {
        const template = gamesGrid.innerHTML; // Save the original card as template

        // Clear the grid
        gamesGrid.innerHTML = "";

        // Generate cards
        for (let i = 0; i < count; i++) {
            gamesGrid.innerHTML += template;
        }
    } else {
        console.warn("Games grid not found on this page.");
    }
}

/**
 * @listens DOMContentLoaded
 * @description Initializes the marketplace when the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", async () => {
    // Call initializeMarketplace to check authentication and potentially show the modal
    await initializeMarketplace();

    setSelectedNavItem();
    initializeMobileMenu();
    generateGameCards(24);

    const brandContainer = document.querySelector(".brand-container");
    if (brandContainer) {
        brandContainer.addEventListener("click", handleBrandClick);
    }
});

/**
 * @module marketplace
 * @description This module handles the logic for the marketplace page, including authentication checks,
 *              user data fetching, and displaying user information.
 */

import { signOut, checkAuth } from "./services/auth-service.js";
import supabase from "./supabase-client.js";

/**
 * Global axios from CDN
 * @type {import('axios').AxiosStatic}
 */
const axios = window.axios;
const loadingElement = document.querySelector("#loading");
const spinner = document.querySelector(".spinner");

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
    } finally {
        // loadingElement.style.display = "none";
        // spinner.style.display = "none";
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
 * Use this to test the marketplace without loads of API calls
 */
// function generateGameCards(count) {
//     const gamesGrid = document.querySelector(".games-grid");

//     // Check if gamesGrid exists before proceeding
//     if (gamesGrid) {
//         const template = gamesGrid.innerHTML; // Save the original card as template

//         // Clear the grid
//         gamesGrid.innerHTML = "";

//         // Generate cards
//         for (let i = 0; i < count; i++) {
//             gamesGrid.innerHTML += template;
//         }

//         loadingElement.style.display = "none";
//         spinner.style.display = "none";
//     } else {
//         console.warn("Games grid not found on this page.");
//     }
// }

/**
 * @function generateGameCards
 * @description Fetches and displays popular games from the IGDB API
 * @param {number} count - Number of games to fetch
 * This is the actual method for generating game cards for the marketplace
 */
async function generateGameCards(count) {
    const gamesGrid = document.querySelector(".games-grid");
    const loadingElement = document.querySelector("#loading");

    if (!gamesGrid) {
        console.warn("Games grid not found on this page.");
        return;
    }

    try {
        // Clear the grid immediately to remove example game
        gamesGrid.innerHTML = "";

        // Use the global axios variable (provided by the CDN)
        const response = await axios.get(
            `http://localhost:3000/api/games?limit=${count}`
        );
        const games = response.data;

        // Generate cards for each game
        games.forEach((game) => {
            // Improve image quality by using the highest resolution available
            const coverUrl = game.cover?.url
                ? game.cover.url
                      .replace("t_thumb", "t_720p") // Use 720p for higher quality
                      .replace("t_cover_big", "t_720p")
                      .replace("t_cover_big_2x", "t_720p")
                      .replace("http:", "https:")
                : "../assets/images/placeholder-game.webp";

            const platforms = getPlatformIcons(game.platforms);
            const price = generateRandomPrice();

            const gameCard = `
                <div class="game-card">
                    <img src="${coverUrl}" alt="${game.name}" class="game-image" loading="lazy">
                    <div class="game-details">
                        <div class="purchase-row">
                            <span class="add-to-cart">Add to Cart</span>
                            <span class="price">£${price}</span>
                        </div>
                        <div class="platform-icons">
                            ${platforms}
                        </div>
                        <h2 class="game-title">${game.name}</h2>
                    </div>
                </div>
            `;
            gamesGrid.innerHTML += gameCard;
        });
    } catch (error) {
        console.error("Error fetching games:", error);
        gamesGrid.innerHTML =
            '<div class="error-message">Failed to load games. Please try again later.</div>';
    } finally {
        loadingElement.style.display = "none";
        spinner.style.display = "none";

    }
}

/**
 * @function getPlatformIcons
 * @description Converts platform names to Font Awesome icons
 * @param {Array} platforms - Array of platform objects
 * @returns {string} HTML string of platform icons
 */
function getPlatformIcons(platforms = []) {
    const platformIcons = {
        PC: "../assets/icons/windows.svg",
        PlayStation: "../assets/icons/playstation.svg",
        Nintendo: "../assets/icons/nintendo.svg",
        Xbox: "../assets/icons/xbox.svg",
        // Android: "../assets/icons/xbox.svg",
        // iOS: "../assets/icons/xbox.svg",
    };


    return platforms
    .map((platform) => {
        const iconClass = platformIcons[platform.name] || "../assets/icons";
        return `<img src="${iconClass}">`;
    })
    .join("");
}

/**
 * @function generateRandomPrice
 * @description Generates a random price for demo purposes
 * @returns {string} Formatted price string
 */
function generateRandomPrice() {
    const prices = ["59.99", "49.99", "39.99", "29.99", "19.99"];
    return prices[Math.floor(Math.random() * prices.length)];
}

/**
 * @listens DOMContentLoaded
 * @description Initializes the marketplace when the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", async () => {
    initializeMarketplace();
    generateGameCards(24);
    initializeMobileMenu();
    setSelectedNavItem();

    const brandContainer = document.querySelector(".brand-container");
    if (brandContainer) {
        brandContainer.addEventListener("click", handleBrandClick);
    }
});

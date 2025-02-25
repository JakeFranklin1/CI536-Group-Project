/**
 * @module marketplace
 * @description This module handles the logic for the marketplace page, including authentication checks,
 *              user data fetching, and displaying user information.
 */

import { signOut, checkAuth } from "./services/auth-service.js";
import { updateCartCount, updateCartTotal } from "./side-cart.js";
import supabase from "./supabase-client.js";

/**
 * Global axios from CDN
 * @type {import('axios').AxiosStatic}
 */
const axios = window.axios;

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://gamestore-backend-9v90.onrender.com'
  : 'http://localhost:3000';

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
// const loadingElement = document.querySelector("#loading");
// const spinner = document.querySelector(".spinner");
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
    const spinner = document.querySelector(".spinner");

    if (!gamesGrid) {
        console.warn("Games grid not found on this page.");
        return;
    }

    // Clear the grid and add loading cards
    gamesGrid.innerHTML = Array(count)
        .fill(
            `
        <div class="game-card loading">
        </div>
    `
        )
        .join("");

    try {
        const response = await axios.get(`${API_URL}/api/games?limit=${count}`);
        const games = response.data;

        // Clear the grid again for real content
        gamesGrid.innerHTML = "";

        // Generate cards for each game
        games.forEach((game) => {
            let coverUrl;
            // Check for specific GTA games and use custom images
            if (game.name.toLowerCase().includes('grand theft auto v') ||
                game.name.toLowerCase().includes('gta v') ||
                game.name.toLowerCase().includes('gta 5')) {
                coverUrl = '../assets/images/gta5.webp';
            } else if (game.name.toLowerCase().includes('grand theft auto: san andreas') ||
                      game.name.toLowerCase().includes('gta iv') ||
                      game.name.toLowerCase().includes('gta 4')) {
                coverUrl = '../assets/images/gta4.jpg';
            } else {
                // Use default IGDB cover for other games
                coverUrl = game.cover?.url
                    ? game.cover.url
                        .replace("t_thumb", "t_720p")
                        .replace("t_cover_big", "t_720p")
                        .replace("t_cover_big_2x", "t_720p")
                        .replace("http:", "https:")
                    : "../assets/images/placeholder-game.webp";
            }

            const platforms = getPlatformIcons(game.platforms);
            const price = generateRandomPrice();

            const gameCard = `
                <div class="game-card" data-age-rating="${game.age_rating_string}">
                    <img src="${coverUrl}" class="game-image" loading="lazy">
                    <div class="game-details">
                        <div class="purchase-row">
                            <span class="add-to-cart">Add to Cart</span>
                            <span class="price">£${price}</span>
                        </div>
                        <div class="platform-icons">
                            ${platforms}
                        </div>
                        <h2 class="game-title">${game.name}</h2>
                        <p class="game-age-rating">Age rating: ${game.age_rating_string}</p>
                    </div>
                </div>
            `;
            gamesGrid.innerHTML += gameCard;
        });

        // Add event listeners to the "Add to Cart" buttons
        const addToCartButtons = document.querySelectorAll(".add-to-cart");
        addToCartButtons.forEach((button) => {
            button.addEventListener("click", function () {
                // Find the game card associated with the button
                const gameCard = this.closest(".game-card");
                addItemToCart(gameCard);
            });
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
 * @description Converts platform names to corresponding icon images
 * @param {Array} platforms - Array of platform objects from IGDB API
 * @returns {string} HTML string of platform icons
 */
function getPlatformIcons(platforms = []) {
    // Common platform name parts and their corresponding icons
    const platformIcons = {
        // Exact matches
        PC: "../assets/icons/windows.svg",
        PlayStation: "../assets/icons/playstation.svg",
        "PlayStation 4": "../assets/icons/playstation.svg",
        "PlayStation 5": "../assets/icons/playstation.svg",
        "PlayStation 3": "../assets/icons/playstation.svg",
        Xbox: "../assets/icons/xbox.svg",
        "Xbox One": "../assets/icons/xbox.svg",
        "Xbox Series X": "../assets/icons/xbox.svg",
        "Xbox Series S": "../assets/icons/xbox.svg",
        "Nintendo Switch": "../assets/icons/nintendo.svg",
        Nintendo: "../assets/icons/nintendo.svg",
        "Wii U": "../assets/icons/nintendo.svg",
        Wii: "../assets/icons/nintendo.svg",
        iOS: "../assets/icons/apple.svg",
        Mac: "../assets/icons/apple.svg",
        Android: "../assets/icons/android.svg",
    };

    // Used icons for unique platforms to avoid duplicates
    const usedIcons = new Set();

    // Map each platform to an icon, avoiding duplicates
    return platforms
        .map((platform) => {
            // Try exact match first
            let iconPath = platformIcons[platform.name];

            // If no exact match, try partial match
            if (!iconPath) {
                if (platform.name.includes("PlayStation")) {
                    iconPath = "../assets/icons/playstation.svg";
                } else if (platform.name.includes("Xbox")) {
                    iconPath = "../assets/icons/xbox.svg";
                } else if (
                    platform.name.includes("Nintendo") ||
                    platform.name.includes("Wii") ||
                    platform.name.includes("Switch")
                ) {
                    iconPath = "../assets/icons/nintendo.svg";
                } else if (
                    platform.name.includes("PC") ||
                    platform.name.includes("Windows")
                ) {
                    iconPath = "../assets/icons/windows.svg";
                } else if (
                    platform.name.includes("Mac") ||
                    platform.name.includes("iOS") ||
                    platform.name.includes("Apple")
                ) {
                    iconPath = "../assets/icons/apple.svg";
                } else if (platform.name.includes("Android")) {
                    iconPath = "../assets/icons/android.svg";
                } else {
                    // Default fallback
                    iconPath = "../assets/icons/windows.svg";
                }
            }

            // Check if we've already used this icon type (to avoid duplicates)
            if (usedIcons.has(iconPath)) {
                return "";
            }

            // Add to used icons
            usedIcons.add(iconPath);

            // For debugging
            console.log(`Platform: ${platform.name} → Icon: ${iconPath}`);

            return `<img src="${iconPath}" alt="${platform.name}" class="platform-icon">`;
        })
        .filter((icon) => icon !== ""); // Remove empty strings (duplicates)
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

function addItemToCart(gameCard) {
    // Create flying animation element
    const addToCartBtn = gameCard.querySelector(".add-to-cart");
    const cartIcon = document.querySelector(".cart-btn");

    // Get the coordinates
    const start = addToCartBtn.getBoundingClientRect();
    const end = cartIcon.getBoundingClientRect();

    // Create the animation element
    const circle = document.createElement("div");
    circle.className = "add-to-cart-animation";

    // Set initial position
    circle.style.left = `${start.left + start.width / 2}px`;
    circle.style.top = `${start.top + start.height / 2}px`;

    // Calculate the animation path
    const keyframes = [
        {
            left: `${start.left + start.width / 2}px`,
            top: `${start.top + start.height / 2}px`,
            transform: "scale(3)",
            opacity: 1,
        },
        {
            left: `${end.left + end.width / 2}px`,
            top: `${end.top + end.height / 2}px`,
            transform: "scale(0.1)",
            opacity: 0,
        },
    ];

    document.body.appendChild(circle);

    // Animate the circle
    const animation = circle.animate(keyframes, {
        duration: 1000,
        easing: "cubic-bezier(0.47, 0, 0.745, 0.715)",
    });

    // Add the item to cart after animation
    animation.onfinish = () => {
        circle.remove();

        const gameTitle = gameCard.querySelector(".game-title").textContent;
        const gamePrice = gameCard.querySelector(".price").textContent;
        const gameImage = gameCard.querySelector(".game-image").src;

        const cartItemHTML = `
            <div class="cart-item">
                <div class="cart-item-details">
                    <div class="cart-item-title">${gameTitle}</div>
                    <div class="cart-item-info">
                        <img src="${gameImage}" alt="${gameTitle}" class="cart-item-image">
                        <div>
                            <div class="cart-item-platform">Platform</div>
                            <div class="cart-item-price">${gamePrice}</div>
                            <div class="cart-item-quantity">
                                <label>Qty:</label>
                                <div class="quantity-controls">
                                    <button class="quantity-decrement">-</button>
                                    <span class="quantity-value">1</span>
                                    <button class="quantity-increment">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="cart-remove" title="Remove item">
                    <i class="fa fa-times"></i>
                </button>
            </div>
        `;

        const cartItemsContainer = document.querySelector(".cart-items");
        const emptyCart = cartItemsContainer.querySelector(".empty-cart");
        if (emptyCart) {
            emptyCart.remove();
            document.querySelector(".cart-summary").style.display = "block";
        }

        cartItemsContainer.insertAdjacentHTML("beforeend", cartItemHTML);
        updateCartTotal();
        updateCartCount();
    };
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
    updateCartCount();

    const brandContainer = document.querySelector(".brand-container");
    if (brandContainer) {
        brandContainer.addEventListener("click", handleBrandClick);
    }

    // Add event listeners to quantity inputs and buttons
    const quantityInputs = document.querySelectorAll(".quantity-input");
    quantityInputs.forEach((input) => {
        input.addEventListener("change", updateCartTotal);
    });

    const incrementButtons = document.querySelectorAll(".quantity-increment");
    incrementButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const input = this.previousElementSibling;
            input.value = parseInt(input.value) + 1;
            updateCartTotal();
        });
    });

    const decrementButtons = document.querySelectorAll(".quantity-decrement");
    decrementButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const input = this.nextElementSibling;
            if (parseInt(input.value) > 1) {
                input.value = parseInt(input.value) - 1;
                updateCartTotal();
            }
        });
    });

    const removeButtons = document.querySelectorAll(".cart-remove");
    removeButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const cartItem = this.closest(".cart-item");
            cartItem.remove();
            updateCartTotal();
        });
    });
});

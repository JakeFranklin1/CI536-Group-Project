/**
 * @module GameDisplayService
 * @description Handles game card display and loading states
 */

import { escapeHTML } from "../utils/sanitise.js";
import { fetchFilteredGames } from "./FilterService.js";

/**
 * Shows loading state in the games grid
 * @param {HTMLElement} gamesGrid - The games grid element
 * @param {number} count - Number of placeholder cards to show
 */
function showLoadingPlaceholders(gamesGrid, count) {
    gamesGrid.innerHTML = ""; // Clear existing content

    for (let i = 0; i < count; i++) {
        const placeholderCard = document.createElement("div");
        placeholderCard.className = "game-card loading";
        placeholderCard.style.height = "300px";
        gamesGrid.appendChild(placeholderCard);
    }
}

/**
 * Creates a game card DOM element with proper security measures
 * @param {Object} game - Game data from API
 * @param {string} coverUrl - URL for the game cover image
 * @param {string} platforms - HTML for platform icons
 * @param {string} price - Formatted price string
 * @param {Function} addToCartCallback - Callback for add to cart button
 * @returns {HTMLElement} - Complete game card DOM element
 */
function createGameCard(game, coverUrl, platforms, price, addToCartCallback) {
    // Create main card element
    const card = document.createElement("div");
    card.className = "game-card";
    if (game.age_rating_string) {
        card.dataset.ageRating = escapeHTML(game.age_rating_string);
    }

    // Create and add game image
    const img = document.createElement("img");
    img.src = escapeHTML(coverUrl);
    img.className = "game-image";
    img.loading = "lazy";
    img.alt = escapeHTML(game.name || "Game Cover");
    card.appendChild(img);

    // Create details container
    const details = document.createElement("div");
    details.className = "game-details";

    // Create purchase row
    const purchaseRow = document.createElement("div");
    purchaseRow.className = "purchase-row";

    // Add to cart button
    const addToCart = document.createElement("span");
    addToCart.className = "add-to-cart";
    addToCart.textContent = "Add to Cart";
    addToCart.addEventListener("click", function () {
        addToCartCallback(card);
    });

    // Price element
    const priceElement = document.createElement("span");
    priceElement.className = "price";
    priceElement.textContent = `£${escapeHTML(price)}`;

    // Add elements to purchase row
    purchaseRow.appendChild(addToCart);
    purchaseRow.appendChild(priceElement);
    details.appendChild(purchaseRow);

    // Platform icons
    const platformsContainer = document.createElement("div");
    platformsContainer.className = "platform-icons";
    // Use DOMParser to safely convert HTML string to DOM elements
    const parser = new DOMParser();
    const platformDoc = parser.parseFromString(platforms, "text/html");
    const platformElements = platformDoc.body.children;
    // Append each platform icon to the container
    while (platformElements.length > 0) {
        platformsContainer.appendChild(platformElements[0]);
    }
    details.appendChild(platformsContainer);

    // Game title
    const title = document.createElement("h2");
    title.className = "game-title";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = escapeHTML(game.name || "Unknown Game");
    title.textContent = tempDiv.textContent;
    details.appendChild(title);

    // Age rating
    const ageRating = document.createElement("p");
    ageRating.className = "game-age-rating";
    ageRating.textContent = `Age rating: ${escapeHTML(game.age_rating_string || "Unknown")}`;
    details.appendChild(ageRating);

    // Add details to card
    card.appendChild(details);

    return card;
}

/**
 * Gets platform icons HTML based on platform data
 * @param {Array} platforms - Array of platform objects
 * @returns {string} - HTML string for platform icons
 */
function getPlatformIcons(platforms = []) {
    // Common platform name parts and their corresponding icons
    const platformIcons = {
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
                if (platform.name?.includes("PlayStation")) {
                    iconPath = "../assets/icons/playstation.svg";
                } else if (platform.name?.includes("Xbox")) {
                    iconPath = "../assets/icons/xbox.svg";
                } else if (
                    platform.name?.includes("Nintendo") ||
                    platform.name?.includes("Wii") ||
                    platform.name?.includes("Switch")
                ) {
                    iconPath = "../assets/icons/nintendo.svg";
                } else if (
                    platform.name?.includes("PC") ||
                    platform.name?.includes("Windows")
                ) {
                    iconPath = "../assets/icons/windows.svg";
                } else if (
                    platform.name?.includes("Mac") ||
                    platform.name?.includes("iOS") ||
                    platform.name?.includes("Apple")
                ) {
                    iconPath = "../assets/icons/apple.svg";
                } else if (platform.name?.includes("Android")) {
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
            return `<img src="${escapeHTML(iconPath)}" alt="${escapeHTML(platform.name || "Platform")}" class="platform-icon">`;
        })
        .filter((icon) => icon !== ""); // Remove empty strings (duplicates)
}

/**
 * Generates a random price for demo purposes
 * @returns {string} - Formatted price string
 */
function generateRandomPrice() {
    const prices = ["59.99", "49.99", "39.99", "29.99", "19.99", "9.99"];
    return prices[Math.floor(Math.random() * prices.length)];
}

/**
 * Displays games in the games grid
 * @param {Array} games - Array of game objects from API
 * @param {HTMLElement} gamesGrid - The games grid element
 * @param {Function} addToCartCallback - Callback function for add to cart button
 */
function displayGames(games, gamesGrid, addToCartCallback) {
    gamesGrid.innerHTML = ""; // Clear any existing content

    if (!games || games.length === 0) {
        gamesGrid.innerHTML =
            '<div class="no-games-message">No games found matching your criteria.</div>';
        return;
    }

    // Generate cards for each game
    games.forEach((game) => {
        // Get cover URL with special cases for certain games
        let coverUrl;
        if (
            game.name?.toLowerCase().includes("grand theft auto v") ||
            game.name?.toLowerCase().includes("gta v") ||
            game.name?.toLowerCase().includes("gta 5")
        ) {
            coverUrl = "../assets/images/gta5.webp";
        } else if (
            game.name
                ?.toLowerCase()
                .includes("grand theft auto: san andreas") ||
            game.name?.toLowerCase().includes("gta iv") ||
            game.name?.toLowerCase().includes("gta 4")
        ) {
            coverUrl = "../assets/images/gta4.jpg";
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

        // Get platform icons and price
        const platforms = getPlatformIcons(game.platforms);
        const price = generateRandomPrice();

        // Create and append the game card
        const gameCard = createGameCard(
            game,
            coverUrl,
            platforms,
            price,
            addToCartCallback
        );
        gamesGrid.appendChild(gameCard);
    });
}

/**
 * Loads and displays games with filters
 * @param {Object} filterParams - Filter parameters
 * @param {number} count - Number of games to display
 * @param {boolean} showFullScreenLoader - Whether to show full-screen loader
 * @param {Function} addToCartCallback - Callback for add to cart button
 */
export async function loadGames(
    filterParams = {},
    count = 24,
    showFullScreenLoader = false,
    addToCartCallback
) {
    const gamesGrid = document.querySelector(".games-grid");
    if (!gamesGrid) {
        console.error("Games grid element not found");
        return;
    }

    try {
        // Show loading state
        if (showFullScreenLoader) {
            document.getElementById("loading").classList.remove("hidden");
        } else {
            showLoadingPlaceholders(gamesGrid, count);
        }

        // Fetch games with filters
        const games = await fetchFilteredGames(filterParams, count);

        // Display games
        displayGames(games, gamesGrid, addToCartCallback);
    } catch (error) {
        console.error("Error loading games:", error);
        gamesGrid.innerHTML =
            '<div class="error-message">Failed to load games. Please try again later.</div>';
    } finally {
        // Hide full-screen loader if it was shown
        document.getElementById("loading")?.classList.add("hidden");
        console.log("Games loading process completed.");
    }
}
